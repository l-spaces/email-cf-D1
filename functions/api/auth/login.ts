import {
  AuthEnv,
  createOpaqueIdentifier,
  createSessionCookie,
  createSessionToken,
  getAuthConfigError,
  hasSameOrigin,
  isLoopbackHostname,
  secureCompare
} from '../../../lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
  ACCESS_PASSWORD: string;
  SESSION_SECRET: string;
}

interface LoginBody {
  password?: unknown;
}

interface RateLimitRow {
  attempt_count: number;
  blocked_until: number;
}

const MAX_REQUEST_BYTES = 2048;
const MAX_PASSWORD_LENGTH = 512;
const ATTEMPT_WINDOW_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const BLOCK_SECONDS = 10 * 60;
const STALE_ATTEMPT_SECONDS = 24 * 60 * 60;

let rateLimitSetup: Promise<void> | null = null;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  if (!hasSameOrigin(context.request)) {
    return Response.json({ success: false, error: 'Invalid request origin' }, { status: 403 });
  }

  const configError = getAuthConfigError(context.env);

  if (configError) {
    console.error(`Authentication configuration error: ${configError}`);
    return Response.json({ success: false, error: '登录服务暂不可用' }, { status: 503 });
  }

  const contentType = context.request.headers.get('Content-Type') || '';

  if (!contentType.toLowerCase().startsWith('application/json')) {
    return Response.json({ success: false, error: '请求格式不正确' }, { status: 415 });
  }

  const declaredLength = Number(context.request.headers.get('Content-Length') || 0);

  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_BYTES) {
    return Response.json({ success: false, error: '请求内容过大' }, { status: 413 });
  }

  const requestBytes = await context.request.arrayBuffer();

  if (requestBytes.byteLength > MAX_REQUEST_BYTES) {
    return Response.json({ success: false, error: '请求内容过大' }, { status: 413 });
  }

  let body: LoginBody;

  try {
    body = JSON.parse(new TextDecoder().decode(requestBytes)) as LoginBody;
  } catch (error) {
    return Response.json({ success: false, error: '请求格式不正确' }, { status: 400 });
  }

  if (typeof body?.password !== 'string' || body.password.length === 0 || body.password.length > MAX_PASSWORD_LENGTH) {
    return Response.json({ success: false, error: '请输入有效的访问密码' }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  let clientKey: string;

  try {
    await ensureRateLimitTable(context.env.DB);
    clientKey = await getClientKey(context.request, context.env.SESSION_SECRET);
    const existing = await getRateLimit(context.env.DB, clientKey);

    if (existing && existing.blocked_until > now) {
      return tooManyAttempts(existing.blocked_until - now);
    }
  } catch (error) {
    console.error('Login rate limiter unavailable');
    return Response.json({ success: false, error: '登录服务暂不可用' }, { status: 503 });
  }

  const passwordMatches = await secureCompare(body.password, context.env.ACCESS_PASSWORD);

  if (!passwordMatches) {
    try {
      const rateLimit = await recordFailedAttempt(context.env.DB, clientKey, now);

      if (rateLimit.blocked_until > now) {
        return tooManyAttempts(rateLimit.blocked_until - now);
      }
    } catch (error) {
      console.error('Failed to record login rate limit');
      return Response.json({ success: false, error: '登录服务暂不可用' }, { status: 503 });
    }

    return Response.json({ success: false, error: '密码错误，请重试' }, { status: 401 });
  }

  try {
    await context.env.DB.prepare(
      'DELETE FROM auth_login_attempts WHERE client_key = ? OR updated_at < ?'
    ).bind(clientKey, now - STALE_ATTEMPT_SECONDS).run();
  } catch (error) {
    console.error('Failed to clear login rate limit');
    return Response.json({ success: false, error: '登录服务暂不可用' }, { status: 503 });
  }

  const token = await createSessionToken(context.env.SESSION_SECRET);

  return Response.json({ success: true }, {
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': createSessionCookie(token, context.request.url)
    }
  });
};

function ensureRateLimitTable(db: D1Database): Promise<void> {
  if (!rateLimitSetup) {
    rateLimitSetup = db.batch([
      db.prepare(`
        CREATE TABLE IF NOT EXISTS auth_login_attempts (
          client_key TEXT PRIMARY KEY,
          window_started_at INTEGER NOT NULL,
          attempt_count INTEGER NOT NULL DEFAULT 0,
          blocked_until INTEGER NOT NULL DEFAULT 0,
          updated_at INTEGER NOT NULL
        )
      `),
      db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_auth_login_attempts_updated_at
        ON auth_login_attempts(updated_at)
      `)
    ]).then(() => undefined).catch((error) => {
      rateLimitSetup = null;
      throw error;
    });
  }

  return rateLimitSetup;
}

async function getClientKey(request: Request, secret: string): Promise<string> {
  const url = new URL(request.url);
  const clientAddress = request.headers.get('CF-Connecting-IP')
    || (isLoopbackHostname(url.hostname) ? `loopback:${url.hostname}` : 'missing-client-address');

  return createOpaqueIdentifier(clientAddress, secret);
}

function getRateLimit(db: D1Database, clientKey: string): Promise<RateLimitRow | null> {
  return db.prepare(
    'SELECT attempt_count, blocked_until FROM auth_login_attempts WHERE client_key = ?'
  ).bind(clientKey).first<RateLimitRow>();
}

async function recordFailedAttempt(db: D1Database, clientKey: string, now: number): Promise<RateLimitRow> {
  const row = await db.prepare(`
    INSERT INTO auth_login_attempts (
      client_key, window_started_at, attempt_count, blocked_until, updated_at
    ) VALUES (?, ?, 1, 0, ?)
    ON CONFLICT(client_key) DO UPDATE SET
      attempt_count = CASE
        WHEN auth_login_attempts.window_started_at <= excluded.window_started_at - ? THEN 1
        ELSE auth_login_attempts.attempt_count + 1
      END,
      window_started_at = CASE
        WHEN auth_login_attempts.window_started_at <= excluded.window_started_at - ? THEN excluded.window_started_at
        ELSE auth_login_attempts.window_started_at
      END,
      blocked_until = CASE
        WHEN auth_login_attempts.window_started_at <= excluded.window_started_at - ? THEN 0
        WHEN auth_login_attempts.attempt_count + 1 >= ? THEN excluded.window_started_at + ?
        ELSE auth_login_attempts.blocked_until
      END,
      updated_at = excluded.updated_at
    RETURNING attempt_count, blocked_until
  `).bind(
    clientKey,
    now,
    now,
    ATTEMPT_WINDOW_SECONDS,
    ATTEMPT_WINDOW_SECONDS,
    ATTEMPT_WINDOW_SECONDS,
    MAX_ATTEMPTS,
    BLOCK_SECONDS
  ).first<RateLimitRow>();

  if (!row) {
    throw new Error('Rate limit update returned no row');
  }

  return row;
}

function tooManyAttempts(retryAfterSeconds: number): Response {
  return Response.json({ success: false, error: '尝试次数过多，请稍后再试' }, {
    status: 429,
    headers: { 'Retry-After': String(Math.max(1, retryAfterSeconds)) }
  });
}
