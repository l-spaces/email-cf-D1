interface Env {
  DB: D1Database;
}

export const onRequestPut: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id;
    const body = await context.request.json() as any;
    const { email, password, description } = body;

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    await context.env.DB.prepare(
      'UPDATE emails SET email = ?, password = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).bind(email, password, description || '', id).run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to update email' }, { status: 500 });
  }
};

export const onRequestDelete: PagesFunction<Env> = async (context) => {
  try {
    const id = context.params.id;

    await context.env.DB.prepare(
      'DELETE FROM emails WHERE id = ?'
    ).bind(id).run();

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to delete email' }, { status: 500 });
  }
};
