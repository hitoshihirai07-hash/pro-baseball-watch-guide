const THREADS_API_BASE = 'https://graph.threads.net';
const PROFILE_FIELDS = 'id,username,name,threads_profile_picture_url,threads_biography';
const POST_FIELDS = 'id,media_product_type,media_type,permalink,username,text,timestamp,shortcode,is_quote_post,has_replies';
const POST_METRICS = 'views,likes,replies,reposts,quotes,shares';
const ACCOUNT_METRICS = 'views,likes,replies,reposts,quotes,clicks,followers_count';

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


function graphErrorStatus(error) {
  const httpStatus = Number(error?.status) || 0;
  const code = Number(error?.meta?.code);

  // Meta often returns HTTP 400 for expired/invalid access tokens (OAuth code 190).
  if (code === 190 || httpStatus === 401) return 401;
  if (httpStatus === 403 || code === 10 || code === 200) return 403;
  if (httpStatus === 429 || [4, 17, 32, 613].includes(code)) return 429;
  if (httpStatus >= 400 && httpStatus < 500) return httpStatus;
  return 502;
}

function graphErrorMessage(error, fallback) {
  const status = graphErrorStatus(error);
  const code = Number(error?.meta?.code);
  if (code === 190 || status === 401) {
    return 'Threadsのアクセストークンが無効または期限切れです。Cloudflare Pagesの THREADS_ACCESS_TOKEN を有効なトークンへ更新してください。';
  }
  if (status === 403) {
    return 'Threads APIの権限が不足しています。threads_basic など必要な権限を付けたトークンを確認してください。';
  }
  if (status === 429) {
    return 'Threads APIの利用上限に達しています。時間を置いてから再実行してください。';
  }
  const detail = String(error?.meta?.message || '').trim();
  return detail ? `${fallback}（Meta: ${detail}）` : fallback;
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

async function enrichPosts(posts, token, batchSize = 10) {
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
  const requestedMode = String(url.searchParams.get('mode') || 'dashboard').toLowerCase();
  const mode = ['status','dashboard','search'].includes(requestedMode) ? requestedMode : 'dashboard';
  const requestedLimit = Number.parseInt(url.searchParams.get('limit') || '30', 10);
  const limit = Math.min(50, Math.max(5, Number.isFinite(requestedLimit) ? requestedLimit : 30));

  let profile;
  try {
    profile = await graphRequest('/me', token, { fields: PROFILE_FIELDS });
  } catch (error) {
    const status = graphErrorStatus(error);
    return json({
      configured: true,
      connected: false,
      message: graphErrorMessage(error, 'Threads APIへ接続できませんでした。'),
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

  if (mode === 'search') {
    const q = String(url.searchParams.get('q') || '').trim();
    if (!q) {
      return json({
        ...base,
        posts: [],
        message: 'Threads検索の検索語を入力してください。'
      }, 400);
    }
    const searchType = String(url.searchParams.get('search_type') || 'RECENT').toUpperCase() === 'TOP' ? 'TOP' : 'RECENT';
    const searchMode = String(url.searchParams.get('search_mode') || 'KEYWORD').toUpperCase() === 'TAG' ? 'TAG' : 'KEYWORD';
    try {
      const searchPayload = await graphRequest('/keyword_search', token, {
        q,
        search_type: searchType,
        search_mode: searchMode,
        fields: POST_FIELDS,
        limit: Math.min(limit, 25)
      });
      const posts = (searchPayload?.data || []).map(normalizePost).filter((post) => post.id);
      return json({
        ...base,
        posts,
        query: q,
        searchType,
        searchMode,
        limit: Math.min(limit, 25),
        message: 'Threadsの公開投稿を検索しました。'
      });
    } catch (error) {
      const status = graphErrorStatus(error);
      return json({
        ...base,
        posts: [],
        query: q,
        searchType,
        searchMode,
        message: status === 403
          ? 'Threads話題検索には threads_keyword_search 権限が必要です。権限付きトークンを確認してください。'
          : graphErrorMessage(error, 'Threads話題検索に失敗しました。'),
        meta: error.meta || null
      }, status);
    }
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
    const status = graphErrorStatus(error);
    return json({
      ...base,
      accountInsights,
      insightsAvailable,
      posts: [],
      warnings,
      message: graphErrorMessage(error, 'Threadsの投稿一覧を取得できませんでした。'),
      meta: error.meta || null
    }, status);
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
