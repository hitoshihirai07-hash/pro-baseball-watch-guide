function unauthorized(message = '認証が必要です。') {
  return new Response(message, {
    status: 401,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'WWW-Authenticate': 'Basic realm="Pro Baseball Watch Guide Admin", charset="UTF-8"',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive'
    }
  });
}

function decodeCredentials(header) {
  if (!header?.startsWith('Basic ')) return null;
  try {
    const decoded = atob(header.slice(6));
    const separator = decoded.indexOf(':');
    if (separator < 0) return null;
    return {
      username: decoded.slice(0, separator),
      password: decoded.slice(separator + 1)
    };
  } catch {
    return null;
  }
}

function constantTimeEqual(actual, expected) {
  const maxLength = Math.max(actual.length, expected.length);
  let difference = actual.length ^ expected.length;
  for (let index = 0; index < maxLength; index += 1) {
    difference |= (actual.charCodeAt(index) || 0) ^ (expected.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export async function onRequest({ request, env, next }) {
  const expectedUsername = env.ADMIN_USER;
  const expectedPassword = env.ADMIN_PASSWORD;

  if (!expectedUsername || !expectedPassword) {
    return new Response('管理画面の認証情報が設定されていません。', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow, noarchive'
      }
    });
  }

  const credentials = decodeCredentials(request.headers.get('Authorization'));
  if (
    !credentials ||
    !constantTimeEqual(credentials.username, expectedUsername) ||
    !constantTimeEqual(credentials.password, expectedPassword)
  ) {
    return unauthorized();
  }

  const response = await next();
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Content-Security-Policy', "default-src 'self'; base-uri 'none'; connect-src 'none'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; object-src 'none'; script-src 'self'; style-src 'self'");
  headers.set('Permissions-Policy', 'camera=(), geolocation=(), microphone=()');
  headers.set('Referrer-Policy', 'no-referrer');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
