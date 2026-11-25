export const SITE_HEADER_CSS = '/assets/css/site-header.css?v=20261125-common';
export const SITE_HEADER_CSS_LINK = '<link rel="stylesheet" href="' + SITE_HEADER_CSS + '"/>';
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
const CSS=/<link\b[^>]*\bhref=(["'])\/assets\/css\/site-header\.css(?:\?[^"']*)?\1[^>]*>/gi;
export function isRedirectPage(html){return /<meta\b[^>]*\bhttp-equiv\s*=\s*["']refresh["']/i.test(html);}
export function normalizeSiteHeader(html,file){
  if(isRedirectPage(html))return html;
  if([...html.matchAll(HEADER)].length!==1)throw Error(file+': ヘッダー数が不正');
  const css=[...html.matchAll(CSS)];
  if(css.length>1||!/<\/head>/i.test(html))throw Error(file+': CSSまたはheadが不正');
  let result=html.replace(HEADER,()=>renderSiteHeader(pageRoute(file)));
  return css.length?result.replace(CSS,()=>SITE_HEADER_CSS_LINK):result.replace(/<\/head>/i,SITE_HEADER_CSS_LINK+'\n</head>');
}
