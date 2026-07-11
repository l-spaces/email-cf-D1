interface Env {
  DB: D1Database;
}

interface EmailData {
  email: string;
  password: string;
  description?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body = await context.request.json() as any;
    let emails: EmailData[];

    // 支持两种格式：单个对象或数组
    if (Array.isArray(body.emails)) {
      // 批量上传格式: { "emails": [...] }
      emails = body.emails;
    } else if (body.email && body.password) {
      // 单个上传格式: { "email": "...", "password": "...", "description": "..." }
      emails = [body as EmailData];
    } else {
      return Response.json({
        success: false,
        error: 'Invalid data format. Expected {"email": "...", "password": "..."} or {"emails": [...]}'
      }, { status: 400 });
    }

    if (emails.length === 0) {
      return Response.json({ success: false, error: 'No emails to upload' }, { status: 400 });
    }

    const db = context.env.DB;
    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;
    const failedItems: Array<{ email: string; reason: string }> = [];
    const skippedItems: Array<string> = [];

    for (const item of emails) {
      try {
        if (!item.email || !item.password) {
          failedCount++;
          failedItems.push({ email: item.email || 'unknown', reason: 'Missing email or password' });
          continue;
        }

        // 检查邮箱是否已存在
        const existing = await db.prepare(
          'SELECT id FROM emails WHERE email = ?'
        ).bind(item.email).first();

        if (existing) {
          skippedCount++;
          skippedItems.push(item.email);
          continue;
        }

        await db.prepare(
          'INSERT INTO emails (email, password, description) VALUES (?, ?, ?)'
        ).bind(item.email, item.password, item.description || '').run();

        successCount++;
      } catch (error) {
        failedCount++;
        failedItems.push({ email: item.email, reason: 'Database error' });
      }
    }

    return Response.json({
      success: true,
      data: {
        total: emails.length,
        success: successCount,
        skipped: skippedCount,
        failed: failedCount,
        skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
        failedItems: failedItems.length > 0 ? failedItems : undefined
      }
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to upload emails' }, { status: 500 });
  }
};
