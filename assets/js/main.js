document.documentElement.classList.add('js-enabled');

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.site-footer .footer-grid > div:first-child').forEach(function (footerBlock) {
    if (footerBlock.querySelector('.site-ad-notice')) return;
    var notice = document.createElement('p');
    notice.className = 'site-ad-notice';
    notice.style.fontSize = '.86rem';
    notice.style.margin = '10px 0 0';
    notice.style.color = '#6b5b43';
    notice.textContent = '当サイトではアフィリエイト広告を利用する場合があります。';
    footerBlock.appendChild(notice);
  });
});
