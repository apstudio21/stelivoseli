/* Стелі в оселі — v2 */
(function () {
  'use strict';

  // Запрошення / відновлення пароля Netlify Identity приходять на головну — передаємо їх в адмінку
  if (/(invite|recovery|confirmation)_token=/.test(location.hash)) { location.replace('admin/' + location.hash); return; }

  var doc = document.documentElement;
  doc.classList.add('js');
  // ДЕМО на GitHub Pages: форм Netlify там немає, тому показуємо «успіх» без відправки
  var DEMO = /\.github\.io$/.test(location.hostname);
  function post(form) {
    if (DEMO) return new Promise(function (r) { setTimeout(r, 600); });
    return fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(new FormData(form)).toString() })
      .then(function (r) { if (!r.ok) throw new Error('send'); });
  }
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  /* ---------- Старт анімацій ---------- */
  function start() { requestAnimationFrame(function () { doc.classList.add('is-loaded'); }); }
  if (document.fonts && document.fonts.ready) {
    // чекаємо шрифт, щоб заголовок не «стрибав», але не довше 1.2 с
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 900); })]).then(start);
  } else { start(); }

  /* ---------- Header: ховається при скролі вниз ---------- */
  var header = $('header');
  var lastY = window.scrollY;
  var ticking = false;
  var frame = $('hero-frame');

  function onScroll() {
    var y = window.scrollY;
    if (!menuOpen) {
      if (y > lastY && y > 160) header.classList.add('is-hidden');
      else if (y < lastY) header.classList.remove('is-hidden');
    }
    lastY = y;

    // легкий паралакс фото: на старті видно самий верх кадру (стелю)
    if (!reduce && frame) {
      var h = frame.offsetHeight, end = frame.offsetTop + h;
      if (y < end) frame.style.setProperty('--py', (-(y / end) * h * 0.12).toFixed(1) + 'px');
    }
    progress();
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- Процес: лінія заповнюється зі скролом ---------- */
  function progress() {
    var track = $('process-list');
    if (!track) return;
    var steps = track.querySelectorAll('.pstep');
    if (!steps.length) return;
    var r = track.getBoundingClientRect(), vh = window.innerHeight;
    if (r.top > vh || r.bottom < -vh) return;
    var row = window.matchMedia('(min-width: 1024px)').matches;
    var p = reduce ? 1 : row ? (vh * 0.9 - r.top) / (vh * 0.55) : (vh * 0.62 - r.top) / r.height;
    p = Math.max(0, Math.min(p, 1));
    track.style.setProperty('--prog', p.toFixed(3));
    var size = row ? r.width : r.height;
    steps.forEach(function (st) {
      var at = (row ? st.offsetLeft : st.offsetTop) / size;
      st.classList.toggle('is-on', p >= at - 0.001 && p > 0);
    });
  }
  window.addEventListener('resize', progress);

  /* ---------- Відгуки: вкладки ---------- */
  var reviews = (function () {
    var tabsEl = $('reviews-tabs'), quotesEl = $('reviews-quotes');
    function select(i, focus) {
      var tabs = tabsEl.querySelectorAll('.rt'), qs = quotesEl.querySelectorAll('.rq');
      i = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        qs[n].classList.toggle('is-active', on);
        qs[n].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    function idx(el) { return Array.prototype.indexOf.call(tabsEl.querySelectorAll('.rt'), el); }
    tabsEl.addEventListener('click', function (e) { var t = e.target.closest('.rt'); if (t) select(idx(t)); });
    tabsEl.addEventListener('keydown', function (e) {
      var t = e.target.closest('.rt'); if (!t) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); select(idx(t) + 1, true); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); select(idx(t) - 1, true); }
    });
    return { select: select };
  })();

  /* ---------- Форма заявки на замір ---------- */
  (function () {
    var form = $('contact-form');
    if (!form) return;
    var fPhone = $('contact-field-phone'), fTg = $('contact-field-tg');
    var iPhone = $('contact-phone-input'), iTg = $('contact-tg-input');
    function way() { return form.querySelector('input[name="way"]:checked').value; }
    function syncWay() {
      var tg = way() === 'Telegram';
      fPhone.hidden = tg; iPhone.disabled = tg; iPhone.required = !tg;
      fTg.hidden = !tg; iTg.disabled = !tg; iTg.required = tg;
      $('contact-err').hidden = true;
      iPhone.classList.remove('is-bad'); iTg.classList.remove('is-bad');
    }
    form.querySelectorAll('input[name="way"]').forEach(function (r) { r.addEventListener('change', syncWay); });
    iTg.addEventListener('input', function () {
      var v = iTg.value.replace(/\s/g, '');
      if (v && v.charAt(0) !== '@') v = '@' + v;
      if (v !== iTg.value) iTg.value = v;
    });
    syncWay();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = $('contact-err'), btn = $('contact-submit');
      var tg = way() === 'Telegram', field = tg ? iTg : iPhone, ok;
      if (tg) {
        ok = /^@[A-Za-z][A-Za-z0-9_]{3,31}$/.test(iTg.value);
        err.textContent = 'Перевірте нікнейм: латиниця, цифри та «_», від 4 символів.';
      } else {
        var digits = iPhone.value.replace(/\D/g, '');
        ok = digits.length >= 10 && digits.length <= 12 && /^[+0-9 ()\-]+$/.test(iPhone.value);
        err.textContent = 'Перевірте номер — здається, бракує цифр.';
      }
      field.classList.toggle('is-bad', !ok);
      field.setAttribute('aria-invalid', String(!ok));
      err.hidden = ok;
      if (!ok) { field.focus(); return; }
      btn.disabled = true;
      post(form)
        .then(function () { $('contact-send').hidden = true; var d = $('contact-done'); d.hidden = false; d.focus(); })
        .catch(function () { btn.disabled = false; err.textContent = 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.'; err.hidden = false; });
    });
  })();

  /* ---------- Футер: назва на всю ширину + рік ---------- */
  function fitWord() {
    var w = $('footer-word');
    if (!w) return;
    w.style.fontSize = '100px';
    var ratio = w.parentNode.clientWidth - parseFloat(getComputedStyle(w.parentNode).paddingLeft) * 2;
    var width = w.getBoundingClientRect().width;
    if (width > 0) w.style.fontSize = (100 * ratio / width * 0.995).toFixed(2) + 'px';
  }
  fitWord();
  window.addEventListener('resize', fitWord);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWord);
  $('footer-year').textContent = String(new Date().getFullYear());

  /* ---------- FAQ: плавний акордеон на <details> + JSON-LD ---------- */
  var faq = (function () {
    var list = $('faq-list');
    list.addEventListener('click', function (e) {
      var sum = e.target.closest('summary');
      if (!sum || reduce || !('animate' in Element.prototype)) return;
      e.preventDefault();
      var qa = sum.parentNode, body = qa.querySelector('.qa__body');
      if (qa._anim) qa._anim.cancel();
      var opening = !qa.open || qa.classList.contains('is-closing');
      var from = body.offsetHeight;
      if (opening) { qa.open = true; qa.classList.remove('is-closing'); if (from === body.scrollHeight) from = 0; }
      else qa.classList.add('is-closing');
      var to = opening ? body.scrollHeight : 0;
      qa._anim = body.animate({ height: [from + 'px', to + 'px'] }, { duration: 520, easing: 'cubic-bezier(.22,.8,.2,1)' });
      qa._anim.onfinish = function () { if (!opening) { qa.open = false; qa.classList.remove('is-closing'); } qa._anim = null; };
    });
    function schema() {
      var old = $('faq-schema'); if (old) old.remove();
      var data = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: [] };
      list.querySelectorAll('.qa').forEach(function (qa) {
        data.mainEntity.push({ '@type': 'Question', name: qa.querySelector('.qa__title').textContent,
          acceptedAnswer: { '@type': 'Answer', text: qa.querySelector('.qa__a').textContent } });
      });
      var sc = document.createElement('script');
      sc.type = 'application/ld+json'; sc.id = 'faq-schema';
      sc.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
      document.head.appendChild(sc);
    }
    schema();
    return { schema: schema };
  })();

  /* ---------- Hero: слайдер ---------- */
  var slider = (function () {
    var media = $('hero-media'), wrap = $('hero-slides'), metas = $('hero-metas');
    var bar = $('hero-bar'), cur = $('hero-cur'), total = $('hero-total'), ctrl = $('hero-ctrl');
    var slides = [], dls = [], index = 0, busy = false;
    function pad(n) { return (n < 10 ? '0' : '') + n; }
    function runBar() {
      if (reduce || slides.length < 2) return;
      bar.classList.remove('is-run'); void bar.offsetWidth; bar.classList.add('is-run');
    }
    function go(to, back) {
      if (busy || slides.length < 2) return;
      hydrate();
      to = (to + slides.length) % slides.length;
      if (to === index) return;
      busy = true;
      var prev = slides[index], next = slides[to];
      dls[index].classList.remove('is-active'); dls[index].setAttribute('aria-hidden', 'true');
      dls[to].classList.add('is-active'); dls[to].removeAttribute('aria-hidden');
      next.classList.toggle('is-back', !!back);
      next.classList.add('is-enter');
      next.removeAttribute('aria-hidden');
      cur.textContent = pad(to + 1);
      index = to;
      runBar();
      setTimeout(function () {
        prev.classList.remove('is-active'); prev.setAttribute('aria-hidden', 'true');
        next.classList.add('is-active'); next.classList.remove('is-enter', 'is-back');
        busy = false;
      }, reduce ? 0 : 1250);
    }
    function hydrate() {
      wrap.querySelectorAll('img[data-src]').forEach(function (im) {
        if (im.getAttribute('data-srcset')) im.srcset = im.getAttribute('data-srcset');
        im.src = im.getAttribute('data-src');
        im.removeAttribute('data-src'); im.removeAttribute('data-srcset');
      });
    }
    if (document.readyState === 'complete') setTimeout(hydrate, 300);
    else window.addEventListener('load', function () { setTimeout(hydrate, 300); });

    function init() {
      if (document.readyState === 'complete') hydrate();
      slides = Array.prototype.slice.call(wrap.children);
      dls = Array.prototype.slice.call(metas.children);
      index = 0; busy = false;
      total.textContent = pad(slides.length);
      cur.textContent = '01';
      ctrl.hidden = slides.length < 2;
      runBar();
    }
    $('hero-next').addEventListener('click', function () { go(index + 1); });
    $('hero-prev').addEventListener('click', function () { go(index - 1, true); });
    bar.addEventListener('animationend', function () { go(index + 1); });
    // пауза, коли користувач взаємодіє або вкладка неактивна
    ['mouseenter', 'focusin'].forEach(function (e) { media.addEventListener(e, function () { media.classList.add('is-paused'); }); });
    ['mouseleave', 'focusout'].forEach(function (e) { media.addEventListener(e, function () { media.classList.remove('is-paused'); }); });
    document.addEventListener('visibilitychange', function () { media.classList.toggle('is-paused', document.hidden); });
    // свайп
    var x0 = null, y0 = null;
    media.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    media.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) { if (dx < 0) go(index + 1); else go(index - 1, true); }
      x0 = null;
    }, { passive: true });
    media.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') go(index + 1); else if (e.key === 'ArrowLeft') go(index - 1, true);
    });
    init();
    return { init: init };
  })();

  /* ---------- Мобільне меню ---------- */
  var burger = $('burger');
  var menu = $('menu');
  var menuOpen = false;

  function setMenu(open) {
    menuOpen = open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
    document.body.classList.toggle('is-locked', open);
    [$('main'), $('footer')].forEach(function (el) { if (el) el.inert = open; });
    if (open) {
      menu.hidden = false;
      header.classList.remove('is-hidden');
      requestAnimationFrame(function () { requestAnimationFrame(function () { menu.classList.add('is-open'); }); });
    } else {
      menu.classList.remove('is-open');
      setTimeout(function () { if (!menuOpen) menu.hidden = true; }, reduce ? 0 : 700);
    }
  }
  burger.addEventListener('click', function () { setMenu(!menuOpen); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', function (e) {
    if (e.matches && menuOpen) setMenu(false);
  });

  /* ---------- Поява при скролі + лічильники ---------- */
  function countUp(el) {
    var to = parseInt(el.getAttribute('data-count'), 10);
    if (!to || reduce) return;
    var t0 = null, dur = 1600;
    function step(t) {
      if (!t0) t0 = t;
      var k = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 4)));
      if (k < 1) requestAnimationFrame(step);
    }
    el.textContent = '0';
    requestAnimationFrame(step);
  }
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      var c = e.target.querySelector('[data-count]');
      if (c) countUp(c);
      io.unobserve(e.target);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -8% 0px' }) : null;
  function observe(root) {
    (root || document).querySelectorAll('[data-reveal]').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('is-in');
    });
  }

  /* ---------- Контент із CMS (content/*.json) ----------
     Тільки textContent / перевірені атрибути — жодного innerHTML. */
  function text(id, value) {
    var el = $(id);
    if (el && typeof value === 'string' && value.trim()) el.textContent = value;
  }
  function btnText(id, value) {
    var el = $(id);
    if (el && typeof value === 'string' && value.trim()) el.querySelector('.btn__text').textContent = value;
  }
  function safeAnchor(h) { return typeof h === 'string' && /^#[a-z0-9-]+$/i.test(h) ? h : null; }
  function safeTel(t) { return typeof t === 'string' && /^\+?\d{10,13}$/.test(t) ? t : null; }
  function safeImg(p) { return typeof p === 'string' && /^\/?images\/[\w\-./]+\.(webp|jpe?g|png|avif)$/i.test(p) && p.indexOf('..') === -1 ? p : null; }

  function load(path) {
    return fetch(path, { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  load('content/header.json').then(function (d) {
    if (!d) return;
    if (Array.isArray(d.nav) && d.nav.length) {
      var desk = $('nav-list'), mob = $('menu-list');
      var items = d.nav.filter(function (i) { return i && safeAnchor(i.href) && i.label; });
      if (items.length) {
        desk.textContent = ''; mob.textContent = '';
        items.forEach(function (i, n) {
          var li = document.createElement('li'), a = document.createElement('a');
          a.className = 'nav__link'; a.href = i.href; a.textContent = i.label;
          li.appendChild(a); desk.appendChild(li);

          var li2 = document.createElement('li'), a2 = document.createElement('a'), num = document.createElement('span');
          a2.className = 'menu__link'; a2.href = i.href;
          num.className = 'menu__num'; num.textContent = (n + 1 < 10 ? '0' : '') + (n + 1);
          a2.appendChild(num); a2.appendChild(document.createTextNode(i.label));
          li2.appendChild(a2); mob.appendChild(li2);
        });
      }
    }
    var tel = safeTel(d.phone_tel);
    ['header-phone', 'menu-phone', 'contact-phone', 'footer-phone'].forEach(function (id) {
      text(id, d.phone_label);
      if (tel) $(id).href = 'tel:' + tel;
    });
    text('menu-schedule', d.schedule); text('contact-schedule', d.schedule); text('footer-schedule', d.schedule);
    btnText('header-cta', d.cta);
  });

  load('content/about.json').then(function (d) {
    if (d) {
      text('about-label', d.label);
      text('about-title', d.title);
      text('about-text1', d.text1);
      text('about-text2', d.text2);
      if (Array.isArray(d.stats) && d.stats.length) {
        var ul = $('about-stats');
        ul.textContent = '';
        d.stats.slice(0, 4).forEach(function (st) {
          var n = parseInt(st && st.value, 10);
          if (!n || !st.label) return;
          var li = document.createElement('li'), num = document.createElement('span'),
              val = document.createElement('span'), lab = document.createElement('span');
          li.className = 'stat'; li.setAttribute('data-reveal', '');
          num.className = 'stat__num'; lab.className = 'stat__label';
          val.setAttribute('data-count', String(n)); val.textContent = String(n);
          num.appendChild(val);
          if (st.suffix) { var i = document.createElement('i'); i.textContent = String(st.suffix).slice(0, 2); num.appendChild(i); }
          lab.textContent = st.label;
          li.appendChild(num); li.appendChild(lab); ul.appendChild(li);
        });
      }
    }
    observe();
  });

  load('content/solutions.json').then(function (d) {
    if (!d) return;
    text('solutions-label', d.label);
    text('solutions-title', d.title);
    text('solutions-text', d.text);
    if (!Array.isArray(d.items) || !d.items.length) return;
    var list = $('solutions-list');
    var tpl = list.querySelector('.sol');
    if (!tpl) return;
    var frag = document.createDocumentFragment();
    d.items.forEach(function (it, n) {
      if (!it || !it.title_line1) return;
      var li = tpl.cloneNode(true);
      li.classList.remove('is-in');
      li.querySelector('.sol__num').textContent = (n + 1 < 10 ? '0' : '') + (n + 1);
      var spans = li.querySelectorAll('.sol__title span');
      spans[0].textContent = it.title_line1;
      spans[1].textContent = it.title_line2 || '';
      li.querySelector('.sol__text').textContent = it.text || '';
      li.querySelector('.sol__price').textContent = it.price || '';
      li.querySelector('.sol__term').textContent = it.term || '';
      if (typeof d.cta === 'string' && d.cta.trim()) li.querySelector('.sol__go').lastChild.textContent = d.cta;
      var im = li.querySelector('img'), src = safeImg(it.image);
      if (src) im.src = src;
      im.alt = it.image_alt || '';
      frag.appendChild(li);
    });
    if (frag.childNodes.length) { list.textContent = ''; list.appendChild(frag); observe(list); }
  });

  load('content/projects.json').then(function (d) {
    if (!d) return;
    text('projects-label', d.label);
    text('projects-title', d.title);
    text('projects-text', d.text);
    text('projects-more', d.more);
    btnText('projects-cta', d.cta);
    if (!Array.isArray(d.items) || !d.items.length) return;
    var list = $('projects-list');
    var tpl = list.querySelector('.proj');
    if (!tpl) return;
    var frag = document.createDocumentFragment();
    d.items.forEach(function (it) {
      if (!it || !it.title) return;
      var li = tpl.cloneNode(true);
      li.classList.remove('is-in');
      li.querySelector('.proj__title').textContent = it.title;
      li.querySelector('.proj__price').textContent = it.price || '';
      li.querySelector('.proj__place').textContent = it.place || '';
      li.querySelector('.proj__area').textContent = it.area || '';
      li.querySelector('.proj__year').textContent = it.year || '';
      li.querySelector('.proj__sol').textContent = it.solution || '';
      var im = li.querySelector('img'), src = safeImg(it.image);
      if (src) {
        var m = src.match(/^(.*)-1400\.webp$/);
        if (m) { im.srcset = m[1] + '-800.webp 800w, ' + src + ' 1400w'; im.src = m[1] + '-800.webp'; }
        else { im.removeAttribute('srcset'); im.src = src; }
      }
      im.alt = it.image_alt || '';
      frag.appendChild(li);
    });
    if (frag.childNodes.length) { list.textContent = ''; list.appendChild(frag); observe(list); }
  });

  /* ---------- Калькулятор ---------- */
  var calc = (function () {
    var form = $('calc-form');
    if (!form) return { update: function () {} };
    var area = $('calc-area'), areaOut = $('calc-area-out'), totalEl = $('calc-total');
    var shown = 0, raf = null;
    function fmt(n) { return Math.round(n).toLocaleString('uk-UA').replace(/\u00a0|\u202f/g, ' '); }
    function price(el) { return parseInt(el.getAttribute('data-price'), 10) || 0; }
    function tween(to) {
      if (reduce) { shown = to; totalEl.textContent = fmt(to); return; }
      var from = shown, t0 = null;
      cancelAnimationFrame(raf);
      (function step(t) {
        if (!t0) t0 = t || performance.now();
        var k = Math.min(((t || t0) - t0) / 500, 1);
        shown = from + (to - from) * (1 - Math.pow(1 - k, 3));
        totalEl.textContent = fmt(shown);
        if (k < 1) raf = requestAnimationFrame(step);
      })();
    }
    function update() {
      var a = parseInt(area.value, 10) || 0;
      areaOut.textContent = a;
      area.style.setProperty('--p', ((a - area.min) / (area.max - area.min) * 100).toFixed(1) + '%');
      var fab = form.querySelector('input[name="fabric"]:checked'), pro = form.querySelector('input[name="profile"]:checked');
      var r1 = a * price(fab), r2 = a * price(pro), r3 = 0, lights = [];
      form.querySelectorAll('.qty').forEach(function (q) {
        var inp = q.querySelector('input');
        var n = Math.max(0, Math.min(parseInt(inp.value, 10) || 0, parseInt(inp.max, 10)));
        if (String(n) !== inp.value && document.activeElement !== inp) inp.value = n;
        r3 += n * price(q);
        if (n) lights.push(q.querySelector('.qty__name').firstChild.textContent.trim() + ' ' + n);
      });
      $('calc-r1').textContent = fmt(r1) + ' грн';
      $('calc-r2').textContent = r2 ? '+' + fmt(r2) + ' грн' : 'у ціні';
      $('calc-r3').textContent = r3 ? '+' + fmt(r3) + ' грн' : '—';
      tween(r1 + r2 + r3);
      $('calc-summary').value = a + ' м²; ' + fab.value + '; профіль: ' + pro.value + '; світло: ' + (lights.join(', ') || 'немає') + '; ≈ ' + fmt(r1 + r2 + r3) + ' грн';
    }
    form.addEventListener('input', update);
    form.addEventListener('click', function (e) {
      var b = e.target.closest('.qty__btn');
      if (!b) return;
      var inp = b.parentNode.querySelector('input');
      var n = (parseInt(inp.value, 10) || 0) + parseInt(b.getAttribute('data-step'), 10);
      inp.value = Math.max(0, Math.min(n, parseInt(inp.max, 10)));
      update();
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var phone = $('calc-phone'), err = $('calc-err'), btn = $('calc-submit');
      var digits = phone.value.replace(/\D/g, '');
      var ok = digits.length >= 10 && digits.length <= 12 && /^[+0-9 ()\-]+$/.test(phone.value);
      phone.classList.toggle('is-bad', !ok);
      phone.setAttribute('aria-invalid', String(!ok));
      err.hidden = ok;
      if (!ok) { phone.focus(); return; }
      btn.disabled = true;
      post(form)
        .then(function () {
          $('calc-send').hidden = true;
          var done = $('calc-done'); done.hidden = false; done.focus();
        })
        .catch(function () {
          btn.disabled = false;
          err.textContent = 'Не вдалося надіслати. Спробуйте ще раз або зателефонуйте нам.';
          err.hidden = false;
        });
    });
    update();
    return { update: update };
  })();

  load('content/calc.json').then(function (d) {
    if (!d) return;
    text('calc-label', d.label); text('calc-title', d.title); text('calc-text', d.text);
    btnText('calc-submit', d.cta); text('calc-note', d.note);
    function num(v) { v = parseInt(v, 10); return v >= 0 && v < 1000000 ? v : null; }
    [['calc-fabrics', d.fabrics, false], ['calc-profiles', d.profiles, true]].forEach(function (g) {
      if (!Array.isArray(g[1])) return;
      $(g[0]).querySelectorAll('.opt').forEach(function (opt, i) {
        var it = g[1][i], p = it && num(it.price);
        if (!it || !it.name || p === null) return;
        var inp = opt.querySelector('input');
        inp.value = it.name; inp.setAttribute('data-price', p);
        opt.querySelector('.opt__name').textContent = it.name;
        opt.querySelector('.opt__hint').textContent = g[2] ? (p ? '+' + p + ' грн/м²' : 'у базовій ціні') : p + ' грн/м²';
      });
    });
    if (Array.isArray(d.lights)) $('calc-lights').querySelectorAll('.qty').forEach(function (q, i) {
      var it = d.lights[i], p = it && num(it.price);
      if (!it || !it.name || p === null) return;
      q.setAttribute('data-price', p);
      var nm = q.querySelector('.qty__name');
      nm.firstChild.textContent = it.name;
      nm.querySelector('small').textContent = p + ' грн/' + (it.unit || 'шт');
      q.querySelector('.qty__unit').textContent = it.unit || 'шт';
    });
    calc.update();
  });

  load('content/process.json').then(function (d) {
    if (!d) return;
    text('process-label', d.label); text('process-title', d.title); text('process-text', d.text);
    if (!Array.isArray(d.steps) || d.steps.length < 2) return;
    var list = $('process-list'), tpl = list.querySelector('.pstep'), line = list.querySelector('.ptrack__line');
    var frag = document.createDocumentFragment();
    d.steps.slice(0, 6).forEach(function (st, n) {
      if (!st || !st.title) return;
      var li = tpl.cloneNode(true);
      li.classList.remove('is-on');
      li.querySelector('.pstep__num').textContent = '0' + (n + 1);
      li.querySelector('.pstep__title').textContent = st.title;
      li.querySelector('.pstep__text').textContent = st.text || '';
      var tag = li.querySelector('.pstep__tag');
      if (st.tag) tag.textContent = st.tag; else tag.remove();
      frag.appendChild(li);
    });
    list.textContent = ''; list.appendChild(line); list.appendChild(frag);
    progress();
  });

  load('content/trust.json').then(function (d) {
    if (!d) return;
    text('trust-label', d.label); text('trust-title', d.title); text('trust-text', d.text);
    text('trust-g-label', d.g_label); text('trust-g-unit', d.g_unit); text('trust-g-text', d.g_text);
    btnText('trust-g-cta', d.g_cta);
    var gv = parseInt(d.g_value, 10);
    if (gv > 0) { var ge = $('trust-g-value'); ge.textContent = String(gv); ge.setAttribute('data-count', String(gv)); }
    if (Array.isArray(d.items)) $('trust-list').querySelectorAll('.fact').forEach(function (li, i) {
      var it = d.items[i];
      if (!it || !it.claim) return;
      li.querySelector('.fact__q').textContent = it.question || '';
      li.querySelector('.fact__claim').textContent = it.claim;
      li.querySelector('.fact__text').textContent = it.text || '';
    });
  });

  load('content/reviews.json').then(function (d) {
    if (!d) return;
    text('reviews-label', d.label); text('reviews-title', d.title); text('reviews-text', d.text);
    text('reviews-rate', d.rate); text('reviews-rate-text', d.rate_text); btnText('reviews-cta', d.cta);
    if (typeof d.cta_url === 'string' && /^https:\/\/[^\s"'<>]+$/.test(d.cta_url)) $('reviews-cta').href = d.cta_url;
    if (!Array.isArray(d.items) || d.items.length < 2) return;
    var tabsEl = $('reviews-tabs'), quotesEl = $('reviews-quotes');
    var tT = tabsEl.children[0], qT = quotesEl.children[0];
    var ft = document.createDocumentFragment(), fq = document.createDocumentFragment();
    d.items.slice(0, 6).forEach(function (it, n) {
      if (!it || !it.text || !it.name) return;
      var li = tT.cloneNode(true), q = qT.cloneNode(true), b = li.querySelector('.rt'), id = n + 1;
      b.id = 'rt-' + id; b.setAttribute('aria-controls', 'rq-' + id);
      q.id = 'rq-' + id; q.setAttribute('aria-labelledby', 'rt-' + id);
      li.querySelector('.rt__num').textContent = '0' + id;
      li.querySelector('.rt__name').textContent = it.name;
      li.querySelector('.rt__obj').textContent = it.object || '';
      li.querySelector('.rt__date').textContent = it.date || '';
      q.querySelector('.rq__text').textContent = it.text;
      ft.appendChild(li); fq.appendChild(q);
    });
    if (ft.childNodes.length < 2) return;
    tabsEl.textContent = ''; quotesEl.textContent = '';
    tabsEl.appendChild(ft); quotesEl.appendChild(fq);
    reviews.select(0);
  });

  load('content/faq.json').then(function (d) {
    if (!d) return;
    text('faq-label', d.label); text('faq-title', d.title); text('faq-text', d.text);
    if (typeof d.telegram === 'string' && /^https:\/\/t\.me\/[\w+]*$/.test(d.telegram)) { $('faq-tg').href = d.telegram; $('contact-tg').href = d.telegram; }
    var vb = safeTel(d.viber_phone);
    if (vb) { $('faq-viber').href = 'viber://chat?number=' + encodeURIComponent(vb); $('contact-viber').href = $('faq-viber').href; }
    if (!Array.isArray(d.items) || !d.items.length) return;
    var list = $('faq-list'), tpl = list.querySelector('.qa'), frag = document.createDocumentFragment();
    d.items.slice(0, 10).forEach(function (it, n) {
      if (!it || !it.q || !it.a) return;
      var qa = tpl.cloneNode(true);
      qa.open = !frag.childNodes.length;
      qa.querySelector('.qa__num').textContent = (n + 1 < 10 ? '0' : '') + (n + 1);
      qa.querySelector('.qa__title').textContent = it.q;
      qa.querySelector('.qa__a').textContent = it.a;
      frag.appendChild(qa);
    });
    if (frag.childNodes.length) { list.textContent = ''; list.appendChild(frag); faq.schema(); }
  });

  load('content/contact.json').then(function (d) {
    if (!d) return;
    text('contact-label', d.label); text('contact-line1', d.title_line1); text('contact-line2', d.title_line2);
    text('contact-text', d.text); text('contact-area', d.area); btnText('contact-submit', d.cta); text('contact-note', d.note);
  });

  load('content/footer.json').then(function (d) {
    if (!d) return;
    text('footer-tagline', d.tagline); text('footer-address', d.address);
    if (typeof d.email === 'string' && /^[^@\s<>"']+@[^@\s<>"']+\.[^@\s<>"']+$/.test(d.email)) { $('footer-email').textContent = d.email; $('footer-email').href = 'mailto:' + d.email; }
    [['footer-ig', d.instagram], ['footer-fb', d.facebook], ['footer-tg', d.telegram]].forEach(function (p) {
      if (typeof p[1] === 'string' && /^https:\/\/[^\s"'<>]+$/.test(p[1])) $(p[0]).href = p[1];
    });
  });

  load('content/hero.json').then(function (d) {
    if (!d) return;
    text('hero-tag1', d.tag1);
    text('hero-tag2', d.tag2);
    text('hero-note', d.note);
    text('hero-line1', d.title_line1);
    text('hero-line2', d.title_line2);
    text('hero-line3', d.title_line3);
    text('hero-text', d.text);
    btnText('hero-cta1', d.cta_primary);
    btnText('hero-cta2', d.cta_secondary);

    if (Array.isArray(d.slides) && d.slides.length) {
      var wrap = $('hero-slides'), metas = $('hero-metas');
      var sT = wrap.children[0], mT = metas.children[0];
      var fs = document.createDocumentFragment(), fm = document.createDocumentFragment();
      d.slides.slice(0, 6).forEach(function (sl, n) {
        var src = sl && safeImg(sl.image);
        if (!src) return;
        var li = sT.cloneNode(true), im = li.querySelector('img'), dl = mT.cloneNode(false);
        var first = !fs.childNodes.length;
        li.className = 'hslide' + (first ? ' is-active' : '');
        dl.className = 'meta' + (first ? ' is-active' : '');
        if (first) { li.removeAttribute('aria-hidden'); dl.removeAttribute('aria-hidden'); }
        else { li.setAttribute('aria-hidden', 'true'); dl.setAttribute('aria-hidden', 'true'); im.loading = 'lazy'; im.removeAttribute('fetchpriority'); }
        var m = src.match(/^(.*)-1920\.webp$/);
        var ss = m ? m[1] + '-800.webp 800w, ' + m[1] + '-1280.webp 1280w, ' + src + ' 1920w' : '';
        var s1 = m ? m[1] + '-1280.webp' : src;
        im.removeAttribute('srcset'); im.removeAttribute('data-src'); im.removeAttribute('data-srcset');
        if (first) { if (ss) im.srcset = ss; im.src = s1; }
        else { im.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; im.setAttribute('data-src', s1); if (ss) im.setAttribute('data-srcset', ss); }
        im.alt = sl.image_alt || '';
        (Array.isArray(sl.meta) ? sl.meta : []).slice(0, 4).forEach(function (r) {
          if (!r || !r.k || !r.v) return;
          var row = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
          row.className = 'meta__row'; dt.textContent = r.k; dd.textContent = r.v;
          row.appendChild(dt); row.appendChild(dd); dl.appendChild(row);
        });
        fs.appendChild(li); fm.appendChild(dl);
      });
      // перебудовуємо лише якщо набір слайдів відрізняється від того, що вже у верстці
      var same = fs.childNodes.length === wrap.children.length && Array.prototype.every.call(fs.childNodes, function (li, i) {
        function u(el) { var g = el.querySelector('img'); return g.getAttribute('data-src') || g.getAttribute('src'); }
        return u(li) === u(wrap.children[i]) &&
               fm.childNodes[i].textContent === metas.children[i].textContent;
      });
      if (fs.childNodes.length && !same) {
        wrap.textContent = ''; metas.textContent = '';
        wrap.appendChild(fs); metas.appendChild(fm);
        slider.init();
      }
    }
  });
})();
