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
      var labels = {'切换到深色模式': 'Switch to dark mode', '切换到浅色模式': 'Switch to light mode'};
      document.querySelectorAll('[aria-label], [title]').forEach(function (el) {
        ['aria-label', 'title'].forEach(function (attr) {
          var v = el.getAttribute(attr);
          if (v && labels[v]) el.setAttribute(attr, labels[v]);
        });
      });
    }
    var a = document.createElement('a');
    a.className = 'lang-text';
    a.href = link.href;
    a.textContent = other === 'en' ? 'EN' : 'ZH';
    a.title = other === 'en' ? 'English version' : 'Chinese version';
    a.setAttribute('hreflang', other);
    var anchor = header.querySelector('.md-header__option');
    if (anchor) header.insertBefore(a, anchor);
    else header.appendChild(a);
  }
  if (typeof document$ !== 'undefined') document$.subscribe(addSwitch);
  else document.addEventListener('DOMContentLoaded', addSwitch);
})();
