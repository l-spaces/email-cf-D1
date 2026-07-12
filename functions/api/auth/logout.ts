import { clearSessionCookie, hasSameOrigin } from '../../../lib/auth';

export const onRequestPost: PagesFunction = async (context) => {
  if (!hasSameOrigin(context.request)) {
    return Response.json({ success: false, error: 'Invalid request origin' }, { status: 403 });
  }

  return Response.json({ success: true }, {
    headers: {
      'Cache-Control': 'no-store',
      'Set-Cookie': clearSessionCookie(context.request.url)
    }
  });
};
