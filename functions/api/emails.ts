interface Env {
  DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '20')));
    const search = url.searchParams.get('search')?.trim() || '';
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM emails';
    let countQuery = 'SELECT COUNT(*) as total FROM emails';
    const params: any[] = [];
    const countParams: any[] = [];

    if (search) {
      const searchCondition = ' WHERE email LIKE ? OR description LIKE ?';
      query += searchCondition;
      countQuery += searchCondition;
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam);
      countParams.push(searchParam, searchParam);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const [dataResult, countResult] = await Promise.all([
      context.env.DB.prepare(query).bind(...params).all(),
      context.env.DB.prepare(countQuery).bind(...countParams).all()
    ]);

    const total = countResult.results[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return Response.json({
      success: true,
      data: dataResult.results,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });
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
