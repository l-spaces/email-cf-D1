export interface AuthEnv {
  ACCESS_PASSWORD?: string;
  SESSION_SECRET?: string;
  API_KEY?: string;
}

export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const TOKEN_VERSION = 'v1';
const LOCAL_COOKIE_NAME = 'email_db_session';
const SECURE_COOKIE_NAME = '__Host-email_db_session';
const encoder = new TextEncoder();

export function getAuthConfigError(env: AuthEnv): string | null {
  if (!env.ACCESS_PASSWORD || env.ACCESS_PASSWORD.length < 8) {
    return 'ACCESS_PASSWORD must contain at least 8 characters';
  }

  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    return 'SESSION_SECRET must contain at least 32 characters';
  }

  return null;
}

export async function secureCompare(left: string, right: string): Promise<boolean> {
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(left)),
    crypto.subtle.digest('SHA-256', encoder.encode(right))
  ]);
  const leftBytes = new Uint8Array(leftHash);
  const rightBytes = new Uint8Array(rightHash);
  let difference = 0;

  for (let index = 0; index < leftBytes.length; index++) {
    difference |= leftBytes[index] ^ rightBytes[index];
  }

  return difference === 0;
}

export async function createSessionToken(secret: string): Promise<string> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const nonce = encodeBase64Url(crypto.getRandomValues(new Uint8Array(18)));
  const payload = `${TOKEN_VERSION}.${expiresAt}.${nonce}`;
  const signature = await signPayload(payload, secret);

  return `${payload}.${signature}`;
}

export function createOpaqueIdentifier(value: string, secret: string): Promise<string> {
  return signPayload(`opaque:${value}`, secret);
}

export async function verifySessionToken(token: string, secret: string): Promise<boolean> {
  if (token.length > 256) {
    return false;
  }

  const parts = token.split('.');

  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) {
    return false;
  }

  const expiresAt = Number(parts[1]);
  const now = Math.floor(Date.now() / 1000);

  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now || expiresAt > now + SESSION_TTL_SECONDS + 60) {
    return false;
  }

  const payload = parts.slice(0, 3).join('.');

  try {
    const key = await importHmacKey(secret, ['verify']);
    const signature = decodeBase64Url(parts[3]);

    return crypto.subtle.verify('HMAC', key, signature, encoder.encode(payload));
  } catch (error) {
    return false;
  }
}

export async function isAuthenticated(request: Request, env: AuthEnv): Promise<boolean> {
  if (getAuthConfigError(env)) {
    return false;
  }

  const token = getCookie(request.headers.get('Cookie'), getSessionCookieName(request.url));

  if (!token) {
    return false;
  }

  return verifySessionToken(token, env.SESSION_SECRET!);
}

export function createSessionCookie(token: string, requestUrl: string): string {
  const url = new URL(requestUrl);
  const secure = url.protocol === 'https:';

  if (!secure && !isLoopbackHostname(url.hostname)) {
    throw new Error('Session cookies require HTTPS outside loopback development');
  }

  const attributes = [
    `${getSessionCookieName(requestUrl)}=${token}`,
    'Path=/',
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'HttpOnly',
    'SameSite=Strict',
    'Priority=High'
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function clearSessionCookie(requestUrl: string): string {
  const url = new URL(requestUrl);
  const secure = url.protocol === 'https:';

  if (!secure && !isLoopbackHostname(url.hostname)) {
    throw new Error('Session cookies require HTTPS outside loopback development');
  }

  const attributes = [
    `${getSessionCookieName(requestUrl)}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Strict'
  ];

  if (secure) {
    attributes.push('Secure');
  }

  return attributes.join('; ');
}

export function getBearerToken(request: Request): string | null {
  const authorization = request.headers.get('Authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  return match?.[1]?.trim() || null;
}

export function normalizePathname(pathname: string): string {
  if (pathname === '/') {
    return pathname;
  }

  return pathname.replace(/\/+$/, '') || '/';
}

export function hasSameOrigin(request: Request): boolean {
  const origin = request.headers.get('Origin');

  return Boolean(origin && origin === new URL(request.url).origin);
}

export function isLoopbackHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

export function withSecurityHeaders(response: Response, requestUrl: string, pathname: string): Response {
  const url = new URL(requestUrl);
  const headers = new Headers(response.headers);

  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  headers.set('Cross-Origin-Resource-Policy', 'same-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');

  if (url.protocol === 'https:') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  if (pathname.startsWith('/api/') || pathname === '/' || pathname === '/login' || pathname.endsWith('.html')) {
    headers.set('Cache-Control', 'no-store');
    headers.set('Pragma', 'no-cache');
    appendVary(headers, 'Cookie');
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

function getSessionCookieName(requestUrl: string): string {
  return new URL(requestUrl).protocol === 'https:' ? SECURE_COOKIE_NAME : LOCAL_COOKIE_NAME;
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get('Vary');
  const values = current?.split(',').map((item) => item.trim().toLowerCase()) || [];

  if (!values.includes(value.toLowerCase())) {
    headers.set('Vary', current ? `${current}, ${value}` : value);
  }
}

function getCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(';')) {
    const separatorIndex = cookie.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const cookieName = cookie.slice(0, separatorIndex).trim();

    if (cookieName === name) {
      return cookie.slice(separatorIndex + 1).trim() || null;
    }
  }

  return null;
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));

  return encodeBase64Url(new Uint8Array(signature));
}

function importHmacKey(secret: string, usages: Array<'sign' | 'verify'>): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages
  );
}

function encodeBase64Url(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index++) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}
