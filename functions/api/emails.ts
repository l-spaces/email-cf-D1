interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM emails ORDER BY created_at DESC'
    ).all();

    return Response.json({ success: true, data: results });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to fetch emails' }, { status: 500 });
  }
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    const { email, password, description } = body;

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const result = await context.env.DB.prepare(
      'INSERT INTO emails (email, password, description) VALUES (?, ?, ?)'
    ).bind(email, password, description || '').run();

    return Response.json({ success: true, data: { id: result.meta.last_row_id } }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to create email' }, { status: 500 });
  }
};
