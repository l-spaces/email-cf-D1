import {
  AuthEnv,
  getAuthConfigError,
  getBearerToken,
  hasSameOrigin,
  isAuthenticated,
  isLoopbackHostname,
  normalizePathname,
  secureCompare,
  withSecurityHeaders
} from '../lib/auth';

interface Env extends AuthEnv {
  DB: D1Database;
  API_KEY: string;
  ACCESS_PASSWORD: string;
  SESSION_SECRET: string;
}

const PUBLIC_ASSETS = new Set([
  '/favicon.svg',
  '/login.css',
  '/login.js',
  '/vendor/lucide.min.js'
]);

const PUBLIC_AUTH_ENDPOINTS = new Set([
  '/api/auth/login',
  '/api/auth/logout'
]);

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const pathname = normalizePathname(url.pathname);
  const finalize = (response: Response) => withSecurityHeaders(response, context.request.url, pathname);
  const configError = getAuthConfigError(context.env);

  if (url.protocol === 'http:' && !isLoopbackHostname(url.hostname)) {
    const secureUrl = new URL(url);
    secureUrl.protocol = 'https:';
    return finalize(Response.redirect(secureUrl.toString(), 308));
  }

  if (PUBLIC_AUTH_ENDPOINTS.has(url.pathname) || PUBLIC_ASSETS.has(url.pathname)) {
    return finalize(await context.next());
  }

  if (pathname === '/login' || pathname === '/login.html') {
    if (!configError && await isAuthenticated(context.request, context.env)) {
      return finalize(Response.redirect(new URL('/', url).toString(), 302));
    }

    if (pathname === '/login.html') {
      const loginUrl = new URL('/login', url);
      loginUrl.search = url.search;
      return finalize(Response.redirect(loginUrl.toString(), 302));
    }

    return finalize(await context.next());
  }

  if (pathname === '/api/upload') {
    const hasSession = !configError && await isAuthenticated(context.request, context.env);
    const bearerToken = getBearerToken(context.request);
    const hasApiKey = Boolean(
      bearerToken
      && context.env.API_KEY
      && await secureCompare(bearerToken, context.env.API_KEY)
    );

    if (!hasSession && !hasApiKey) {
      return finalize(jsonError('Unauthorized', 401));
    }

    if (hasSession && !hasApiKey && UNSAFE_METHODS.has(context.request.method) && !hasSameOrigin(context.request)) {
      return finalize(jsonError('Invalid request origin', 403));
    }

    return finalize(await context.next());
  }

  if (configError) {
    return finalize(pathname.startsWith('/api/')
      ? jsonError('Authentication is not configured', 503)
      : new Response('Authentication is not configured', { status: 503 }));
  }

  const authenticated = await isAuthenticated(context.request, context.env);

  if (!authenticated) {
    if (pathname.startsWith('/api/')) {
      return finalize(jsonError('Unauthorized', 401));
    }

    if ((context.request.method === 'GET' || context.request.method === 'HEAD') && isPagePath(pathname)) {
      const loginUrl = new URL('/login', url);
      loginUrl.searchParams.set('next', `${url.pathname}${url.search}`);
      return finalize(Response.redirect(loginUrl.toString(), 302));
    }

    return finalize(new Response('Unauthorized', { status: 401 }));
  }

  if (pathname.startsWith('/api/') && UNSAFE_METHODS.has(context.request.method) && !hasSameOrigin(context.request)) {
    return finalize(jsonError('Invalid request origin', 403));
  }

  return finalize(await context.next());
};

function jsonError(error: string, status: number): Response {
  return Response.json({ success: false, error }, { status });
}

function isPagePath(pathname: string): boolean {
  const finalSegment = pathname.split('/').pop() || '';

  return pathname === '/' || pathname.endsWith('.html') || !finalSegment.includes('.');
}
