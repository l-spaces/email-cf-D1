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

    if (!token || token !== context.env.API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  return context.next();
};
