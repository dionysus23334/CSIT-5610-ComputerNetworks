(function () {
  var KEY = 'course-lang-scroll';

  function getState() {
    var heads = document.querySelectorAll('.md-typeset h1, .md-typeset h2, .md-typeset h3');
    var best = -1;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top <= 96) best = i;
    }
    var offset = 0;
    if (best >= 0) {
      offset = window.scrollY - (heads[best].getBoundingClientRect().top + window.scrollY);
    }
    return { index: best, offset: offset, y: window.scrollY, ts: Date.now() };
  }

  function saveState() {
    try { sessionStorage.setItem(KEY, JSON.stringify(getState())); } catch (e) {}
  }

  function restoreState() {
    var raw = null;
    try { raw = sessionStorage.getItem(KEY); } catch (e) {}
    if (!raw) return;
    var state;
    try { state = JSON.parse(raw); } catch (e) { return; }
    if (!state || Date.now() - state.ts > 15000) {
      try { sessionStorage.removeItem(KEY); } catch (e) {}
      return;
    }
    try { sessionStorage.removeItem(KEY); } catch (e) {}

    var prev = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    var target = state.y || 0;
    if (state.index >= 0) {
      var heads = document.querySelectorAll('.md-typeset h1, .md-typeset h2, .md-typeset h3');
      if (heads[state.index]) {
        target = heads[state.index].getBoundingClientRect().top + window.scrollY + Math.max(0, state.offset || 0) - 76;
      }
    }
    window.scrollTo(0, Math.max(0, target));
    setTimeout(function () { history.scrollRestoration = prev || 'auto'; }, 80);
  }

  function scheduleRestore() {
    var run = function () { setTimeout(restoreState, 60); };
    if (document.readyState === 'complete') run();
    else window.addEventListener('load', run, { once: true });
    setTimeout(restoreState, 1200);
  }

  function addSwitch() {
    var header = document.querySelector('.md-header__inner');
    if (!header || header.querySelector('.lang-text')) return;
    var select = header.querySelector('.md-select');
    if (select) select.remove();
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
    a.addEventListener('click', saveState);
    var anchor = header.querySelector('.md-header__option');
    if (anchor) header.insertBefore(a, anchor);
    else header.appendChild(a);
  }

  scheduleRestore();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addSwitch);
  else addSwitch();
  if (typeof document$ !== 'undefined') document$.subscribe(addSwitch);
})();
