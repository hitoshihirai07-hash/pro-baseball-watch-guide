const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const DATA_API_BASE = 'https://analyticsdata.googleapis.com/v1beta';
const ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/analytics.readonly';
const CACHE_SECONDS = 15 * 60;

function json(data, status = 200, cacheControl = 'private, no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function base64Url(bytes) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlText(value) {
  return base64Url(new TextEncoder().encode(value));
}

function pemToArrayBuffer(pem) {
  const base64 = String(pem || '')
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s+/g, '');
  if (!base64) throw new Error('サービスアカウントの秘密鍵がありません。');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

async function serviceAccountAssertion(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  if (credentials.private_key_id) header.kid = credentials.private_key_id;
  const payload = {
    iss: credentials.client_email,
    scope: ANALYTICS_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600
  };
  const encodedHeader = base64UrlText(JSON.stringify(header));
  const encodedPayload = base64UrlText(JSON.stringify(payload));
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(credentials.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  return `${unsigned}.${base64Url(new Uint8Array(signature))}`;
}

async function accessToken(credentials) {
  const assertion = await serviceAccountAssertion(credentials);
  const body = new URLSearchParams({
    grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
    assertion
  });
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || !payload.access_token) {
    const detail = payload.error_description || payload.error || `HTTP ${response.status}`;
    throw new Error(`Google認証に失敗しました：${detail}`);
  }
  return payload.access_token;
}

async function runReport({ token, propertyId, body }) {
  const response = await fetch(`${DATA_API_BASE}/properties/${encodeURIComponent(propertyId)}:runReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.error?.message || `HTTP ${response.status}`;
    throw new Error(`GA4 Data APIの取得に失敗しました：${message}`);
  }
  return payload;
}

function rowsFromReport(report) {
  const dimensions = (report.dimensionHeaders || []).map((item) => item.name);
  const metrics = (report.metricHeaders || []).map((item) => item.name);
  return (report.rows || []).map((row) => {
    const result = {};
    dimensions.forEach((name, index) => { result[name] = row.dimensionValues?.[index]?.value || ''; });
    metrics.forEach((name, index) => {
      const value = row.metricValues?.[index]?.value ?? '';
      const number = Number(value);
      result[name] = value !== '' && Number.isFinite(number) ? number : value;
    });
    return result;
  });
}

function overviewFromReport(report) {
  return rowsFromReport(report)[0] || {
    activeUsers: 0,
    sessions: 0,
    screenPageViews: 0,
    averageSessionDuration: 0,
    engagementRate: 0
  };
}

function cacheApi() {
  try {
    return typeof caches !== 'undefined' ? caches.default : null;
  } catch {
    return null;
  }
}

export async function onRequestGet({ env, request }) {
  const propertyId = String(env.GA4_PROPERTY_ID || '').trim();
  const rawCredentials = String(env.GA4_SERVICE_ACCOUNT_JSON || '').trim();
  if (!propertyId || !rawCredentials) {
    return json({
      configured: false,
      message: 'GA4_PROPERTY_ID と GA4_SERVICE_ACCOUNT_JSON をCloudflareの変数・シークレットに設定してください。'
    }, 503);
  }

  let credentials;
  try {
    credentials = JSON.parse(rawCredentials);
  } catch {
    return json({ configured: false, message: 'GA4_SERVICE_ACCOUNT_JSON が正しいJSONではありません。' }, 503);
  }
  if (!credentials.client_email || !credentials.private_key) {
    return json({ configured: false, message: 'GA4_SERVICE_ACCOUNT_JSON に client_email または private_key がありません。' }, 503);
  }

  const cache = cacheApi();
  const cacheKey = new Request(`${new URL(request.url).origin}/__admin_cache__/ga4-stage5-v1`);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  try {
    const token = await accessToken(credentials);
    const commonMetrics = [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'engagementRate' }
    ];
    const [overview7Report, overview30Report, pagesReport, sourcesReport] = await Promise.all([
      runReport({ token, propertyId, body: { dateRanges: [{ startDate: '6daysAgo', endDate: 'today' }], metrics: commonMetrics } }),
      runReport({ token, propertyId, body: { dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }], metrics: commonMetrics } }),
      runReport({
        token,
        propertyId,
        body: {
          dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'unifiedPagePathScreen' }, { name: 'pageTitle' }],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'activeUsers' },
            { name: 'screenPageViewsPerUser' },
            { name: 'averageEngagementTime', expression: 'userEngagementDuration/activeUsers' }
          ],
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
          limit: 100
        }
      }),
      runReport({
        token,
        propertyId,
        body: {
          dateRanges: [{ startDate: '29daysAgo', endDate: 'today' }],
          dimensions: [{ name: 'sessionDefaultChannelGroup' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
          limit: 30
        }
      })
    ]);

    const payload = {
      configured: true,
      generatedAt: new Date().toISOString(),
      propertyId,
      overview7: overviewFromReport(overview7Report),
      overview30: overviewFromReport(overview30Report),
      pages30: rowsFromReport(pagesReport),
      sources30: rowsFromReport(sourcesReport)
    };
    const response = json(payload, 200, `public, max-age=${CACHE_SECONDS}`);
    if (cache) await cache.put(cacheKey, response.clone());
    return response;
  } catch (error) {
    return json({
      configured: true,
      message: error.message || 'GA4のデータ取得に失敗しました。サービスアカウントとGA4の閲覧権限を確認してください。'
    }, 502);
  }
}
