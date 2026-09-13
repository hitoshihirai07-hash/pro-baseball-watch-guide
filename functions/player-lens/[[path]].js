const PLAYER_LENS_ORIGIN = "https://player-lens-pages.pages.dev";
const PLAYER_LENS_PREFIX = "/player-lens";
const CANONICAL_ORIGIN = "https://pro-baseball-watch-guide.com";
const BRIDGE_STYLESHEET = "/assets/css/player-lens-integrated.css?v=20260913-imobile-clean";
const WATCH_NOTE_BRIDGE_SCRIPT = "/assets/js/player-lens-watch-note-bridge.js?v=20260822-stage3-links";

const PLAYER_LENS_IMOBILE_ADS = {
  // Keep the i-mobile tags themselves exactly as issued. The surrounding slot has no
  // label, border, padding, or reserved height, so an unfilled ad leaves no blank box.
  desktop: `
<div class="pbwg-player-lens-ad-slot" data-ad-network="i-mobile" data-ad-position="player-lens-content-end" data-ad-device="pc">
  <div id="im-12cfa34ed43744749a8ad91d362aebab">
    <script async src="https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?20220104"></script>
    <script>(window.adsbyimobile=window.adsbyimobile||[]).push({pid:85320,mid:595661,asid:1944356,type:"banner",display:"inline",elementid:"im-12cfa34ed43744749a8ad91d362aebab"})</script>
  </div>
</div>`,
  mobile: `
<div class="pbwg-player-lens-ad-slot" data-ad-network="i-mobile" data-ad-position="player-lens-content-end" data-ad-device="sp">
  <div id="im-54c6e959802e4cb285c3d9e79b3aacbf">
    <script async src="https://imp-adedge.i-mobile.co.jp/script/v1/spot.js?20220104"></script>
    <script>(window.adsbyimobile=window.adsbyimobile||[]).push({pid:85320,mid:595759,asid:1944357,type:"banner",display:"inline",elementid:"im-54c6e959802e4cb285c3d9e79b3aacbf"})</script>
  </div>
</div>`,
};

const TEXT_CONTENT_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/ld+json",
  "application/xml",
  "text/xml",
  "text/plain",
  "image/svg+xml",
];

const REVALIDATE_CONTENT_TYPES = [
  "text/html",
  "text/css",
  "text/javascript",
  "application/javascript",
  "application/json",
  "application/ld+json",
  "application/xml",
  "text/xml",
  "text/plain",
  "text/csv",
];

const BRIDGE_HEADER = `
<header class="pbwg-bridge-header" data-pbwg-bridge="true">
  <div class="pbwg-bridge-inner">
    <a class="pbwg-bridge-brand" href="/" aria-label="プロ野球観戦メモ トップへ">
      <span class="pbwg-bridge-mark" aria-hidden="true">⚾</span>
      <span class="pbwg-bridge-brand-copy">
        <strong>プロ野球観戦メモ</strong>
        <small>試合・選手・チームを見て、データでも楽しむ</small>
      </span>
    </a>
    <nav class="pbwg-bridge-nav" aria-label="プロ野球観戦メモ 共通メニュー">
      <a href="/">トップ</a>
      <a href="/giants/">巨人の今</a>
      <a href="/articles/">記事一覧</a>
      <a href="/watch-notes/">観戦メモ</a>
      <a class="is-current" href="/player-lens/" aria-current="page">Player Lens</a>
      <a href="/about">このサイトについて</a>
      <a href="/contact">お問い合わせ</a>
    </nav>
  </div>
</header>`;

function isTextResponse(contentType = "") {
  const normalized = contentType.toLowerCase();
  return TEXT_CONTENT_TYPES.some((type) => normalized.includes(type));
}

function isHtmlResponse(contentType = "") {
  return contentType.toLowerCase().includes("text/html");
}

function shouldRevalidate(contentType = "") {
  const normalized = contentType.toLowerCase();
  return REVALIDATE_CONTENT_TYPES.some((type) => normalized.includes(type));
}

function publicPlayerLensUrl(sourceUrl) {
  const url = new URL(sourceUrl, PLAYER_LENS_ORIGIN);
  if (url.origin !== PLAYER_LENS_ORIGIN) return sourceUrl;
  return `${CANONICAL_ORIGIN}${PLAYER_LENS_PREFIX}${url.pathname}${url.search}${url.hash}`;
}

function sourceUrlFor(requestUrl) {
  const incoming = new URL(requestUrl);
  let sourcePath = incoming.pathname.slice(PLAYER_LENS_PREFIX.length);
  if (!sourcePath) sourcePath = "/";
  if (!sourcePath.startsWith("/")) sourcePath = `/${sourcePath}`;

  const source = new URL(sourcePath, PLAYER_LENS_ORIGIN);
  source.search = incoming.search;
  return source;
}

function rewriteLocation(headers) {
  const location = headers.get("location");
  if (!location) return;
  try {
    const absolute = new URL(location, PLAYER_LENS_ORIGIN);
    if (absolute.origin === PLAYER_LENS_ORIGIN) {
      headers.set("location", publicPlayerLensUrl(absolute.href));
    }
  } catch {
    // Leave an unusual Location header unchanged.
  }
}

function addIntegratedBodyClass(html) {
  return html.replace(/<body([^>]*)>/i, (match, attrs) => {
    const classMatch = attrs.match(/\sclass=(['"])(.*?)\1/i);
    if (classMatch) {
      const quote = classMatch[1];
      const classes = classMatch[2].split(/\s+/).filter(Boolean);
      if (!classes.includes("pbwg-integrated-player-lens")) classes.push("pbwg-integrated-player-lens");
      return match.replace(classMatch[0], ` class=${quote}${classes.join(" ")}${quote}`);
    }
    return `<body${attrs} class="pbwg-integrated-player-lens">`;
  });
}

function removeInternalNewTab(html) {
  return html.replace(/<a\b[^>]*>/gi, (tag) => {
    const href = tag.match(/\bhref=(['"])(.*?)\1/i)?.[2] || "";
    if (!href.startsWith(CANONICAL_ORIGIN)) return tag;
    return tag
      .replace(/\s+target=(['"])_blank\1/gi, "")
      .replace(/\s+rel=(['"])(?:noopener(?:\s+noreferrer)?|noreferrer(?:\s+noopener)?)\1/gi, "");
  });
}

function stripUnusedAdsenseLoader(html) {
  // Player Lens upstream still contains the old AdSense loader, but no AdSense ad units.
  // Remove only that loader from the integrated public copy so i-mobile is the sole ad runtime here.
  return html.replace(
    /\s*<script\b[^>]*src=(['"])https:\/\/pagead2\.googlesyndication\.com\/pagead\/js\/adsbygoogle\.js\?client=ca-pub-7687416670736373[^>]*><\/script>/gi,
    "",
  );
}

function insertPlayerLensAd(html, device = "desktop", enabled = true) {
  if (!enabled) return html;
  if (html.includes('data-ad-position="player-lens-content-end"')) return html;

  const adHtml = device === "mobile" ? PLAYER_LENS_IMOBILE_ADS.mobile : PLAYER_LENS_IMOBILE_ADS.desktop;
  if (/<footer\b[^>]*class=(['"])[^'"]*\bsite-footer\b[^'"]*\1[^>]*>/i.test(html)) {
    return html.replace(
      /<footer\b([^>]*class=(['"])[^'"]*\bsite-footer\b[^'"]*\2[^>]*)>/i,
      `${adHtml}\n<footer$1>`,
    );
  }

  return html.replace(/<\/body>/i, `${adHtml}\n</body>`);
}

function integrateHtml(html, device = "desktop", adsEnabled = true) {
  let integrated = stripUnusedAdsenseLoader(addIntegratedBodyClass(html));

  if (!integrated.includes("data-pbwg-bridge=\"true\"")) {
    integrated = integrated.replace(/<body([^>]*)>/i, (bodyTag) => `${bodyTag}\n${BRIDGE_HEADER}`);
  }

  if (!integrated.includes(BRIDGE_STYLESHEET)) {
    integrated = integrated.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="${BRIDGE_STYLESHEET}">\n</head>`,
    );
  }

  integrated = insertPlayerLensAd(integrated, device, adsEnabled);

  if (!integrated.includes(WATCH_NOTE_BRIDGE_SCRIPT)) {
    integrated = integrated.replace(
      /<\/body>/i,
      `  <script src="${WATCH_NOTE_BRIDGE_SCRIPT}" defer></script>\n</body>`,
    );
  }

  return removeInternalNewTab(integrated);
}

function isMobileRequest(request) {
  const mobileHint = request.headers.get("sec-ch-ua-mobile");
  if (mobileHint === "?1") return true;
  if (mobileHint === "?0") return false;

  const userAgent = request.headers.get("user-agent") || "";
  return /Android|iPhone|iPad|iPod|Mobile|IEMobile|Opera Mini/i.test(userAgent);
}

function shouldShowPlayerLensAds(requestUrl, upstreamStatus) {
  if (upstreamStatus < 200 || upstreamStatus >= 300) return false;

  const pathname = new URL(requestUrl).pathname;
  const relativePath = pathname.slice(PLAYER_LENS_PREFIX.length) || "/";
  return !/^\/admin(?:\.html)?\/?$/i.test(relativePath);
}

function rewriteTextBody(text, contentType = "", device = "desktop", adsEnabled = true) {
  let rewritten = text.replaceAll(
    PLAYER_LENS_ORIGIN,
    `${CANONICAL_ORIGIN}${PLAYER_LENS_PREFIX}`,
  );

  if (isHtmlResponse(contentType)) rewritten = integrateHtml(rewritten, device, adsEnabled);
  return rewritten;
}

function preparePublicHeaders(headers, contentType = "") {
  // The upstream origin is intentionally noindex. The public /player-lens/ URL is the indexable copy.
  headers.delete("x-robots-tag");

  // Player Lens is updated from its own repository. Revalidate data/code so those updates appear here promptly.
  if (shouldRevalidate(contentType)) {
    headers.set("cache-control", "no-cache, must-revalidate");
  }
}

export async function onRequest(context) {
  const request = context.request;
  const incoming = new URL(request.url);

  // Keep the root with a trailing slash so ./assets and ./data resolve under /player-lens/.
  if (incoming.pathname === PLAYER_LENS_PREFIX) {
    incoming.pathname = `${PLAYER_LENS_PREFIX}/`;
    return Response.redirect(incoming.toString(), 308);
  }

  if (request.method !== "GET" && request.method !== "HEAD") {
    return new Response("Method Not Allowed", {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  }

  const sourceUrl = sourceUrlFor(request.url);
  let upstream;
  try {
    upstream = await fetch(sourceUrl.toString(), {
      method: request.method,
      redirect: "manual",
      headers: {
        Accept: request.headers.get("accept") || "*/*",
        "Accept-Language": request.headers.get("accept-language") || "ja,en;q=0.8",
        "Cache-Control": "no-cache",
        "User-Agent": request.headers.get("user-agent") || "Player-Lens-Proxy",
      },
      cf: {
        cacheTtl: 0,
      },
    });
  } catch (error) {
    console.error("Player Lens upstream fetch failed", error);
    return new Response("Player Lensを一時的に表示できません。時間をおいて再度お試しください。", {
      status: 502,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const headers = new Headers(upstream.headers);
  const contentType = headers.get("content-type") || "";
  rewriteLocation(headers);
  preparePublicHeaders(headers, contentType);

  if (upstream.status >= 300 && upstream.status < 400) {
    headers.delete("content-length");
    return new Response(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  if (request.method === "HEAD") {
    return new Response(null, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  if (!isTextResponse(contentType)) {
    headers.set("x-player-lens-source", "player-lens-pages.pages.dev");
    headers.set("x-player-lens-integration-stage", "4-single-source");
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  const device = isMobileRequest(request) ? "mobile" : "desktop";
  const adsEnabled = shouldShowPlayerLensAds(request.url, upstream.status);
  const body = rewriteTextBody(await upstream.text(), contentType, device, adsEnabled);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");

  headers.set("x-player-lens-source", "player-lens-pages.pages.dev");
  headers.set("x-player-lens-integration-stage", "6-imobile-clean-slot");
  if (isHtmlResponse(contentType)) {
    headers.append("vary", "Sec-CH-UA-Mobile");
    headers.append("vary", "User-Agent");
  }

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
