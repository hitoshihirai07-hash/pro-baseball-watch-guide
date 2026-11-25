export const SITE_HEADER_STYLE_ID = "pbwg-common-header-style";
export const SITE_HEADER_STYLE = `<style id="${SITE_HEADER_STYLE_ID}">
.pbwg-common-header,.pbwg-common-header *{box-sizing:border-box}
.pbwg-common-header{position:static;width:100%;margin:0;padding:0;border:0;border-bottom:1px solid #eadfcf;background:rgba(255,250,241,.94);color:#233044;font-family:-apple-system,BlinkMacSystemFont,"Hiragino Kaku Gothic ProN","Yu Gothic",Meiryo,sans-serif;font-size:16px;line-height:1.85;text-align:left}
.pbwg-common-header .pbwg-common-inner{display:flex;width:min(1080px,92vw);margin-inline:auto;padding:14px 0;align-items:center;justify-content:space-between;gap:24px}
.pbwg-common-header .pbwg-common-brand{display:flex;align-items:center;gap:12px;min-width:0;color:#233044;text-decoration:none;border:0;background:none;padding:0}
.pbwg-common-header .pbwg-common-mark{width:44px;height:44px;flex:0 0 44px;display:grid;place-items:center;border-radius:50%;background:linear-gradient(135deg,#f3b23c,#fff0c2);box-shadow:0 18px 40px rgba(80,50,20,.08)}
.pbwg-common-header .pbwg-common-brand strong{display:block;font-size:17.6px;line-height:1.2;font-weight:700;color:#233044}
.pbwg-common-header .pbwg-common-brand small{display:block;color:#667085;font-size:12.48px;line-height:1.85}
.pbwg-common-header .pbwg-common-nav{display:flex;flex-wrap:wrap;gap:8px;min-width:0;align-items:center;margin:0;padding:0;border:0;background:none;overflow:visible;width:auto}
.pbwg-common-header .pbwg-common-link{display:inline-block;padding:8px 12px;border-radius:999px;color:#233044;font-weight:700;font-size:14.72px;line-height:1.85;text-decoration:none;white-space:nowrap;background:transparent;border:0}
.pbwg-common-header .pbwg-common-link.active,.pbwg-common-header .pbwg-common-link:hover{background:#fff1d6;text-decoration:none}
.pbwg-common-header a:focus-visible{outline:2px solid #c9481d;outline-offset:2px}
@media(max-width:820px){.pbwg-common-header .pbwg-common-inner{align-items:flex-start;flex-direction:column;gap:12px}.pbwg-common-header .pbwg-common-nav{width:100%}.pbwg-common-header .pbwg-common-link{background:#fff;font-size:14.08px}.pbwg-common-header .pbwg-common-link.active,.pbwg-common-header .pbwg-common-link:hover{background:#fff1d6}}
</style>`;
export const SITE_MENU = Object.freeze([['/','トップ'],['/giants/','巨人の今'],['/articles/','記事一覧'],['/watch-notes/','観戦メモ'],['/about','このサイトについて'],['/contact','お問い合わせ']]);
export function pageRoute(file) {
  if (file === 'index.html') return '/';
  if (file.endsWith('/index.html')) return '/' + file.slice(0, -'index.html'.length);
  return '/' + file.replace(/\.html$/, '');
}
export function renderSiteHeader(route, {bridge=false}={}) {
  const current=SITE_MENU.find(([href])=>href===route||(href!=='/'&&href.endsWith('/')&&route.startsWith(href)));
  const active=current?.[0]||(route==='/stadium-rules/'?'/articles/':'');
  return ['<header class="pbwg-common-header"'+(bridge?' data-pbwg-bridge="true"':'')+'>','<div class="pbwg-common-inner">','<a aria-label="プロ野球観戦メモ トップへ" class="pbwg-common-brand" href="/">','<span class="pbwg-common-mark" aria-hidden="true">⚾</span>','<span><strong>プロ野球観戦メモ</strong><small>試合・選手・チームを見て、データでも楽しむ個人ブログ</small></span>','</a>','<nav aria-label="主要ナビゲーション" class="pbwg-common-nav">',...SITE_MENU.map(([href,label])=>'<a class="pbwg-common-link'+(href===active?' active':'')+'" href="'+href+'"'+(href===active?' aria-current="'+(route===href?'page':'location')+'"':'')+'>'+label+'</a>'),'</nav>','</div>','</header>'].join('\n');
}
const HEADER=/<header\b[^>]*\bclass=(["'])[^"']*\b(?:site-header|pbwg-common-header)\b[^"']*\1[^>]*>[\s\S]*?<\/header>/gi;
const OLD_CSS=/<link\b[^>]*\bhref=(["'])\/assets\/css\/site-header\.css(?:\?[^"']*)?\1[^>]*>/gi;
const INLINE_STYLE=/<style\b[^>]*\bid=["']pbwg-common-header-style["'][^>]*>[\s\S]*?<\/style>/gi;
export function isRedirectPage(html){return /<meta\b[^>]*\bhttp-equiv\s*=\s*["']refresh["']/i.test(html);}
export function normalizeSiteHeader(html,file){
  if(isRedirectPage(html))return html;
  if([...html.matchAll(HEADER)].length!==1)throw Error(file+': ヘッダー数が不正');
  const css=[...html.matchAll(OLD_CSS),...html.matchAll(INLINE_STYLE)];
  if(css.length>1||!/<\/head>/i.test(html))throw Error(file+': CSSまたはheadが不正');
  let result=html.replace(HEADER,()=>renderSiteHeader(pageRoute(file)));
  if (css.length) return result.replace(OLD_CSS,()=>SITE_HEADER_STYLE).replace(INLINE_STYLE,()=>SITE_HEADER_STYLE);
  return result.replace(/<\/head>/i,SITE_HEADER_STYLE+'\n</head>');
}
