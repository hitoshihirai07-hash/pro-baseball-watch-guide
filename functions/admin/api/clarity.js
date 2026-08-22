const CLARITY_ENDPOINT = 'https://www.clarity.ms/export-data/api/v1/project-live-insights';
const DAYS = 3;
const CACHE_SECONDS = 12 * 60 * 60;

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

function cacheApi() {
  try {
    return typeof caches !== 'undefined' ? caches.default : null;
  } catch {
    return null;
  }
}

function metricRows(payload) {
  if (!Array.isArray(payload)) return [];
  return payload
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      metricName: String(item.metricName || '').trim(),
      information: Array.isArray(item.information) ? item.information : []
    }))
    .filter((item) => item.metricName);
}

function urlValue(info) {
  return String(info?.URL || info?.Url || info?.url || '').trim();
}

function normalizeByUrl(metrics) {
  const map = new Map();
  for (const metric of metrics) {
    for (const info of metric.information) {
      const url = urlValue(info);
      if (!url) continue;
      if (!map.has(url)) map.set(url, { url, metrics: {} });
      map.get(url).metrics[metric.metricName] = info;
    }
  }
  return [...map.values()];
}

export async function onRequestGet({ env, request }) {
  const token = String(env.CLARITY_API_TOKEN || '').trim();
  if (!token) {
    return json({ configured: false, message: 'CLARITY_API_TOKEN をCloudflareのシークレットに設定してください。' }, 503);
  }

  const cache = cacheApi();
  const cacheKey = new Request(`${new URL(request.url).origin}/__admin_cache__/clarity-stage5-v1`);
  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) return cached;
  }

  async function requestClarity(dimension = '') {
    const url = new URL(CLARITY_ENDPOINT);
    url.searchParams.set('numOfDays', String(DAYS));
    if (dimension) url.searchParams.set('dimension1', dimension);
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      }
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      const error = new Error(`Clarity Data Export APIの取得に失敗しました（${response.status}）。`);
      error.status = response.status;
      throw error;
    }
    return payload;
  }

  let summaryPayload;
  let urlPayload;
  try {
    [summaryPayload, urlPayload] = await Promise.all([requestClarity(), requestClarity('URL')]);
  } catch (error) {
    let message = error.message || 'Clarity Data Export APIへ接続できませんでした。';
    if (error.status === 401) message = 'Clarity APIトークンが無効または期限切れです。';
    if (error.status === 403) message = 'Clarity APIトークンに対象プロジェクトの権限がありません。';
    if (error.status === 429) message = 'Clarity APIの1日あたり取得上限に達しました。時間を置いて確認してください。';
    return json({ configured: true, message }, error.status === 429 ? 429 : 502);
  }

  const metrics = metricRows(summaryPayload);
  const urlMetrics = metricRows(urlPayload);
  const result = {
    configured: true,
    generatedAt: new Date().toISOString(),
    days: DAYS,
    cacheHours: CACHE_SECONDS / 3600,
    metrics,
    urlMetrics,
    byUrl: normalizeByUrl(urlMetrics)
  };
  const output = json(result, 200, `public, max-age=${CACHE_SECONDS}`);
  if (cache) await cache.put(cacheKey, output.clone());
  return output;
}
