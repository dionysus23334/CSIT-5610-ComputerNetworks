(function () {
  function addSwitch() {
    var header = document.querySelector('.md-header__inner');
    if (!header || header.querySelector('.lang-text')) return;
    var lang = (document.documentElement.lang || 'en').toLowerCase().slice(0, 2);
    var other = lang === 'zh' ? 'en' : 'zh';
    var link = document.querySelector('link[rel="alternate"][hreflang="' + other + '"]');
    if (!link) return;
    if (other === 'zh') {
      document.querySelectorAll('a[href="https://dionysus23334.github.io/study-blogs/"]').forEach(function (el) {
        el.href = 'https://dionysus23334.github.io/study-blogs/en/';
      });
    }
    var a = document.createElement('a');
    a.className = 'lang-text';
    a.href = link.href;
    a.textContent = other === 'en' ? 'EN' : '中文';
    a.title = other === 'en' ? 'English version' : '中文版';
    a.setAttribute('hreflang', other);
    var anchor = header.querySelector('.md-header__option');
    if (anchor) header.insertBefore(a, anchor);
    else header.appendChild(a);
  }
  if (typeof document$ !== 'undefined') document$.subscribe(addSwitch);
  else document.addEventListener('DOMContentLoaded', addSwitch);
})();
