const PLAYER_LENS_ORIGIN = "https://player-lens-pages.pages.dev";
const PLAYER_LENS_PREFIX = "/player-lens";
const CANONICAL_ORIGIN = "https://pro-baseball-watch-guide.com";
const BRIDGE_STYLESHEET = "/assets/css/player-lens-integrated.css?v=20260822-stage3";
const WATCH_NOTE_BRIDGE_SCRIPT = "/assets/js/player-lens-watch-note-bridge.js?v=20260822-stage3-links";

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

function integrateHtml(html) {
  let integrated = addIntegratedBodyClass(html);

  if (!integrated.includes("data-pbwg-bridge=\"true\"")) {
    integrated = integrated.replace(/<body([^>]*)>/i, (bodyTag) => `${bodyTag}\n${BRIDGE_HEADER}`);
  }

  if (!integrated.includes(BRIDGE_STYLESHEET)) {
    integrated = integrated.replace(
      /<\/head>/i,
      `  <link rel="stylesheet" href="${BRIDGE_STYLESHEET}">\n</head>`,
    );
  }

  if (!integrated.includes(WATCH_NOTE_BRIDGE_SCRIPT)) {
    integrated = integrated.replace(
      /<\/body>/i,
      `  <script src="${WATCH_NOTE_BRIDGE_SCRIPT}" defer></script>\n</body>`,
    );
  }

  return removeInternalNewTab(integrated);
}

function rewriteTextBody(text, contentType = "") {
  let rewritten = text.replaceAll(
    PLAYER_LENS_ORIGIN,
    `${CANONICAL_ORIGIN}${PLAYER_LENS_PREFIX}`,
  );

  if (isHtmlResponse(contentType)) rewritten = integrateHtml(rewritten);
  return rewritten;
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
        "User-Agent": request.headers.get("user-agent") || "Player-Lens-Proxy",
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
  rewriteLocation(headers);

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

  const contentType = headers.get("content-type") || "";
  if (!isTextResponse(contentType)) {
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  }

  const body = rewriteTextBody(await upstream.text(), contentType);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");

  headers.set("x-player-lens-source", "player-lens-pages.pages.dev");
  headers.set("x-player-lens-integration-stage", "3-links");

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
