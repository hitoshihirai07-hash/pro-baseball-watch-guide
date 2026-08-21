const PLAYER_LENS_ORIGIN = "https://player-lens-pages.pages.dev";
const PLAYER_LENS_PREFIX = "/player-lens";
const CANONICAL_ORIGIN = "https://pro-baseball-watch-guide.com";

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

function isTextResponse(contentType = "") {
  const normalized = contentType.toLowerCase();
  return TEXT_CONTENT_TYPES.some((type) => normalized.includes(type));
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

function rewriteTextBody(text) {
  return text.replaceAll(
    PLAYER_LENS_ORIGIN,
    `${CANONICAL_ORIGIN}${PLAYER_LENS_PREFIX}`,
  );
}

export async function onRequest(context) {
  const request = context.request;
  const incoming = new URL(request.url);

  // A trailing slash is required on the Player Lens root so ./assets and ./data
  // resolve under /player-lens/ rather than at the site root.
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

  const body = rewriteTextBody(await upstream.text());
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");

  // The upstream site remains the data/source deployment during stage 2,
  // while public canonical URLs are the integrated /player-lens/ paths.
  headers.set("x-player-lens-source", "player-lens-pages.pages.dev");

  return new Response(body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}
