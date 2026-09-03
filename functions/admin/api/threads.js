const THREADS_API_BASE = 'https://graph.threads.net';
const PROFILE_FIELDS = 'id,username,name,threads_profile_picture_url,threads_biography';
const POST_FIELDS = 'id,media_product_type,media_type,permalink,username,text,timestamp,shortcode,is_quote_post,has_replies';
const POST_METRICS = 'views,likes,replies,reposts,quotes,shares';
const ACCOUNT_METRICS = 'views,likes,replies,reposts,quotes,followers_count';

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

function publicMetaError(payload, fallback) {
  const error = payload?.error || {};
  const message = String(error.message || '').trim();
  return {
    message: message || fallback,
    code: error.code ?? null,
    subcode: error.error_subcode ?? null,
    type: error.type || ''
  };
}

async function graphRequest(path, token, params = {}) {
  const url = new URL(path, THREADS_API_BASE);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok || payload?.error) {
    const meta = publicMetaError(payload, `Threads APIへの接続に失敗しました（${response.status}）。`);
    const error = new Error(meta.message);
    error.status = response.status || 502;
    error.meta = meta;
    throw error;
  }
  return payload || {};
}

function insightValue(item) {
  const total = Number(item?.total_value?.value);
  if (Number.isFinite(total)) return total;

  const values = Array.isArray(item?.values) ? item.values : [];
  return values.reduce((sum, row) => {
    const value = Number(row?.value);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
}

function normalizeInsights(payload, metricNames) {
  const result = Object.fromEntries(metricNames.map((name) => [name, 0]));
  for (const item of payload?.data || []) {
    if (Object.prototype.hasOwnProperty.call(result, item?.name)) {
      result[item.name] = insightValue(item);
    }
  }
  return result;
}

async function fetchPostInsight(post, token) {
  try {
    const payload = await graphRequest(`/${encodeURIComponent(post.id)}/insights`, token, {
      metric: POST_METRICS
    });
    return {
      ...post,
      insights: normalizeInsights(payload, POST_METRICS.split(',')),
      insightError: null
    };
  } catch (error) {
    return {
      ...post,
      insights: null,
      insightError: error.meta || { message: error.message || '投稿分析を取得できませんでした。' }
    };
  }
}

async function enrichPosts(posts, token, batchSize = 5) {
  const enriched = [];
  for (let index = 0; index < posts.length; index += batchSize) {
    const batch = posts.slice(index, index + batchSize);
    const rows = await Promise.all(batch.map((post) => fetchPostInsight(post, token)));
    enriched.push(...rows);
  }
  return enriched;
}

function normalizePost(post) {
  return {
    id: String(post?.id || ''),
    mediaType: String(post?.media_type || ''),
    permalink: String(post?.permalink || ''),
    username: String(post?.username || ''),
    text: String(post?.text || ''),
    timestamp: String(post?.timestamp || ''),
    shortcode: String(post?.shortcode || ''),
    isQuotePost: Boolean(post?.is_quote_post),
    hasReplies: Boolean(post?.has_replies)
  };
}

export async function onRequestGet({ request, env }) {
  const token = String(env.THREADS_ACCESS_TOKEN || '').trim();
  if (!token) {
    return json({
      configured: false,
      connected: false,
      message: 'Cloudflare Pagesの「変数とシークレット」に THREADS_ACCESS_TOKEN をシークレットとして設定してください。'
    }, 503);
  }

  const url = new URL(request.url);
  const mode = url.searchParams.get('mode') === 'status' ? 'status' : 'dashboard';
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '20', 10);
  const limit = Math.min(30, Math.max(5, Number.isFinite(requestedLimit) ? requestedLimit : 20));

  let profile;
  try {
    profile = await graphRequest('/me', token, { fields: PROFILE_FIELDS });
  } catch (error) {
    const status = error.status === 401 || error.status === 403 ? 401 : 502;
    return json({
      configured: true,
      connected: false,
      message: status === 401
        ? 'Threadsのアクセストークンが無効・期限切れ、または必要な権限がありません。'
        : 'Threads APIへ接続できませんでした。',
      meta: error.meta || null
    }, status);
  }

  const base = {
    configured: true,
    connected: true,
    profile: {
      id: String(profile?.id || ''),
      username: String(profile?.username || ''),
      name: String(profile?.name || ''),
      profilePictureUrl: String(profile?.threads_profile_picture_url || ''),
      biography: String(profile?.threads_biography || '')
    },
    fetchedAt: new Date().toISOString()
  };

  if (mode === 'status') {
    return json({
      ...base,
      message: 'Threads APIへ接続できました。'
    });
  }

  const warnings = [];
  let accountInsights = null;
  let insightsAvailable = true;

  try {
    const insightPayload = await graphRequest('/me/threads_insights', token, {
      metric: ACCOUNT_METRICS
    });
    accountInsights = normalizeInsights(insightPayload, ACCOUNT_METRICS.split(','));
  } catch (error) {
    insightsAvailable = false;
    warnings.push('アカウント分析を取得できませんでした。トークンに threads_manage_insights 権限があるか確認してください。');
  }

  let posts = [];
  try {
    const postPayload = await graphRequest('/me/threads', token, {
      fields: POST_FIELDS,
      limit
    });
    posts = (postPayload?.data || []).map(normalizePost).filter((post) => post.id);
  } catch (error) {
    return json({
      ...base,
      accountInsights,
      insightsAvailable,
      posts: [],
      warnings,
      message: 'Threadsの投稿一覧を取得できませんでした。',
      meta: error.meta || null
    }, 502);
  }

  const enrichedPosts = await enrichPosts(posts, token);
  if (enrichedPosts.some((post) => post.insightError)) {
    insightsAvailable = false;
    if (!warnings.some((message) => message.includes('threads_manage_insights'))) {
      warnings.push('一部または全部の投稿分析を取得できませんでした。トークンの threads_manage_insights 権限を確認してください。');
    }
  }

  return json({
    ...base,
    accountInsights,
    insightsAvailable,
    posts: enrichedPosts,
    warnings,
    limit,
    message: 'Threadsの投稿と分析データを取得しました。'
  });
}
