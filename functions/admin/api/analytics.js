const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';

const QUERY = `
query AdminWebAnalytics(
  $accountTag: String!
  $siteTag: String!
  $seriesStart: Time!
  $top7Start: Time!
  $top30Start: Time!
  $end: Time!
) {
  viewer {
    accounts(filter: { accountTag: $accountTag }) {
      series: rumPageloadEventsAdaptiveGroups(
        limit: 5000
        filter: { siteTag: $siteTag, datetime_geq: $seriesStart, datetime_lt: $end, bot: 0 }
        orderBy: [date_ASC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { date requestPath }
      }
      top7: rumPageloadEventsAdaptiveGroups(
        limit: 100
        filter: { siteTag: $siteTag, datetime_geq: $top7Start, datetime_lt: $end, bot: 0 }
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { requestPath }
      }
      top30: rumPageloadEventsAdaptiveGroups(
        limit: 100
        filter: { siteTag: $siteTag, datetime_geq: $top30Start, datetime_lt: $end, bot: 0 }
        orderBy: [count_DESC]
      ) {
        count
        avg { sampleInterval }
        sum { visits }
        dimensions { requestPath }
      }
    }
  }
}`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}

function startOfUtcDay(date = new Date()) {
  const result = new Date(date);
  result.setUTCHours(0, 0, 0, 0);
  return result;
}

function daysAgo(days) {
  const date = startOfUtcDay();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function scaled(group, dimension) {
  const interval = Math.max(1, Number(group?.avg?.sampleInterval) || 1);
  return {
    [dimension]: group?.dimensions?.[dimension] || '',
    pageviews: Math.round((Number(group?.count) || 0) * interval),
    visits: Math.round((Number(group?.sum?.visits) || 0) * interval)
  };
}

function cleanPages(groups = []) {
  return groups
    .map((group) => scaled(group, 'requestPath'))
    .map((row) => ({ path: row.requestPath || '/', pageviews: row.pageviews, visits: row.visits }))
    .filter((row) => row.path && !row.path.startsWith('/admin') && !row.path.startsWith('/assets/'));
}

export async function onRequestGet({ env }) {
  const required = {
    CF_ACCOUNT_ID: env.CF_ACCOUNT_ID,
    CF_WEB_ANALYTICS_SITE_TAG: env.CF_WEB_ANALYTICS_SITE_TAG,
    CF_API_TOKEN: env.CF_API_TOKEN
  };
  const missing = Object.entries(required).filter(([, value]) => !value).map(([name]) => name);
  if (missing.length) {
    return json({
      configured: false,
      message: `Cloudflare Pagesの「変数とシークレット」に ${missing.join('、')} を設定してください。`,
      missing
    }, 503);
  }

  const end = new Date(startOfUtcDay().getTime() + 24 * 60 * 60 * 1000).toISOString();
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.CF_API_TOKEN}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        accountTag: env.CF_ACCOUNT_ID,
        siteTag: env.CF_WEB_ANALYTICS_SITE_TAG,
        seriesStart: daysAgo(59),
        top7Start: daysAgo(6),
        top30Start: daysAgo(29),
        end
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    return json({ configured: true, message: `Cloudflare Analytics APIへの接続に失敗しました（${response.status}）。` }, 502);
  }
  if (Array.isArray(payload.errors) && payload.errors.length) {
    return json({
      configured: true,
      message: 'Cloudflare Analytics APIがクエリを受け付けませんでした。Account Analytics: Read権限とサイトタグを確認してください。',
      details: payload.errors.map((error) => error.message).filter(Boolean).slice(0, 3)
    }, 502);
  }

  const account = payload.data?.viewer?.accounts?.[0];
  if (!account) return json({ configured: true, message: '指定したCloudflareアカウントの分析データを取得できません。' }, 502);

  const seriesMap = new Map();
  for (const group of account.series || []) {
    const requestPath = group?.dimensions?.requestPath || '/';
    const date = group?.dimensions?.date;
    if (!date || requestPath.startsWith('/admin') || requestPath.startsWith('/assets/')) continue;
    const row = scaled(group, 'date');
    const current = seriesMap.get(date) || { date, pageviews: 0, visits: 0 };
    current.pageviews += row.pageviews;
    current.visits += row.visits;
    seriesMap.set(date, current);
  }
  const series = [...seriesMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return json({
    configured: true,
    generatedAt: new Date().toISOString(),
    series,
    topPages7: cleanPages(account.top7),
    topPages30: cleanPages(account.top30)
  });
}
