const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const GRAPHQL_ENDPOINT = `${CLOUDFLARE_API_BASE}/graphql`;
const PAGES_PROJECT_NAME = 'pro-baseball-watch-guide';

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
  return {
    [dimension]: group?.dimensions?.[dimension] || '',
    pageviews: Math.round(Number(group?.count) || 0),
    visits: Math.round(Number(group?.sum?.visits) || 0)
  };
}

function cleanPages(groups = []) {
  return groups
    .map((group) => scaled(group, 'requestPath'))
    .map((row) => ({ path: row.requestPath || '/', pageviews: row.pageviews, visits: row.visits }))
    .filter((row) => row.path && !row.path.startsWith('/admin') && !row.path.startsWith('/assets/'));
}

function analyticsTagFromProject(project) {
  return project?.build_config?.web_analytics_tag
    || project?.canonical_deployment?.build_config?.web_analytics_tag
    || project?.latest_deployment?.build_config?.web_analytics_tag
    || '';
}

async function fetchPagesProject(accountId, token) {
  const url = `${CLOUDFLARE_API_BASE}/accounts/${encodeURIComponent(accountId)}/pages/projects/${encodeURIComponent(PAGES_PROJECT_NAME)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success || !payload?.result) {
    const details = Array.isArray(payload?.errors)
      ? payload.errors.map((error) => error?.message).filter(Boolean).slice(0, 3)
      : [];

    let message = `Cloudflare Pages APIへの接続に失敗しました（${response.status}）。`;
    if (response.status === 401) {
      message = 'Cloudflare APIトークンを確認してください。';
    } else if (response.status === 403) {
      message = 'Cloudflare APIトークンに「Cloudflare Pages: Read」権限がありません。';
    } else if (response.status === 404) {
      message = `Cloudflare Pagesプロジェクト「${PAGES_PROJECT_NAME}」を確認できませんでした。`;
    }

    const error = new Error(message);
    error.status = response.status;
    error.details = details;
    throw error;
  }

  return payload.result;
}

async function resolveAnalyticsSite({ accountId, token }) {
  const project = await fetchPagesProject(accountId, token);
  const siteTag = analyticsTagFromProject(project);

  if (!siteTag) {
    const error = new Error('Cloudflare PagesプロジェクトからWeb Analyticsのサイトタグを取得できませんでした。');
    error.status = 404;
    throw error;
  }

  return {
    siteTag,
    projectName: project.name || PAGES_PROJECT_NAME
  };
}

async function fetchAnalytics({ accountId, siteTag, token, end }) {
  const response = await fetch(GRAPHQL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: QUERY,
      variables: {
        accountTag: accountId,
        siteTag,
        seriesStart: daysAgo(59),
        top7Start: daysAgo(6),
        top30Start: daysAgo(29),
        end
      }
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload) {
    const error = new Error(`Cloudflare Analytics APIへの接続に失敗しました（${response.status}）。`);
    error.status = response.status;
    throw error;
  }
  if (Array.isArray(payload.errors) && payload.errors.length) {
    const error = new Error('Cloudflare Analytics APIがクエリを受け付けませんでした。APIトークンの「Account Analytics: Read」権限を確認してください。');
    error.status = 502;
    error.details = payload.errors.map((item) => item?.message).filter(Boolean).slice(0, 3);
    throw error;
  }

  return payload;
}

export async function onRequestGet({ env }) {
  const required = {
    CF_ACCOUNT_ID: env.CF_ACCOUNT_ID,
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

  let analyticsSite;
  try {
    analyticsSite = await resolveAnalyticsSite({
      accountId: env.CF_ACCOUNT_ID,
      token: env.CF_API_TOKEN
    });
  } catch (error) {
    return json({
      configured: false,
      message: error.message || 'Cloudflare PagesのWeb Analytics設定を自動判定できませんでした。',
      details: error.details || []
    }, 503);
  }

  const end = new Date(startOfUtcDay().getTime() + 24 * 60 * 60 * 1000).toISOString();
  let payload;
  try {
    payload = await fetchAnalytics({
      accountId: env.CF_ACCOUNT_ID,
      siteTag: analyticsSite.siteTag,
      token: env.CF_API_TOKEN,
      end
    });
  } catch (error) {
    return json({
      configured: true,
      message: error.message || 'Cloudflare Analytics APIから閲覧データを取得できませんでした。',
      details: error.details || []
    }, error.status === 403 ? 503 : 502);
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
    analyticsSource: 'cloudflare-pages-project',
    projectName: analyticsSite.projectName,
    series,
    topPages7: cleanPages(account.top7),
    topPages30: cleanPages(account.top30)
  });
}
