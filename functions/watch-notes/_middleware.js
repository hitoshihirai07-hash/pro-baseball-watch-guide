const BRIDGE_SCRIPT = "/assets/js/player-lens-watch-note-bridge.js?v=20260822-stage3-links";

export async function onRequest(context) {
  const request = context.request;
  const url = new URL(request.url);

  // The watch-note list page does not need article-specific Player Lens links.
  if (url.pathname === "/watch-notes" || url.pathname === "/watch-notes/") {
    return context.next();
  }

  const response = await context.next();
  if (request.method === "HEAD") return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("text/html")) return response;

  const html = await response.text();
  if (!html.includes("player-lens-box") || html.includes(BRIDGE_SCRIPT)) {
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.delete("content-encoding");
    headers.delete("etag");
    return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  const body = html.replace(
    /<\/body>/i,
    `  <script src="${BRIDGE_SCRIPT}" defer></script>\n</body>`,
  );
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("etag");
  headers.set("x-watch-note-player-lens-links", "enabled");

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
