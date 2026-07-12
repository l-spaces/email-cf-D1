interface Env {
  DB: D1Database;
  API_KEY: string;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);

  // 上传接口需要验证 API key
  if (url.pathname === '/api/upload') {
    const authHeader = context.request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const expectedKey = context.env.API_KEY;

    console.log('Auth check:', {
      hasToken: !!token,
      hasEnvKey: !!expectedKey,
      tokenMatch: token === expectedKey
    });

    if (!token || !expectedKey || token !== expectedKey) {
      return new Response(JSON.stringify({
        error: 'Unauthorized',
        debug: {
          hasToken: !!token,
          hasEnvKey: !!expectedKey
        }
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return context.next();
};
