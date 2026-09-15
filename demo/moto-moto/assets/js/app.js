/* moto-moto — вітрина */
(function () {
  'use strict';

  var LS = {
    bikes: 'mm_bikes',
    cart:  'mm_cart',
    last:  'mm_last',
    promo: 'mm_promo'
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ helpers */

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
  }
  function money(n) { return '$' + Number(n || 0).toLocaleString('en-US'); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Замінник фото: доки реальних знімків немає, малюємо осмислену картку,
     а не «розбите зображення». Підміняється автоматично, щойно файл лягає в assets/bikes/. */
  function placeholder(bike, w, h) {
    w = w || 1200; h = h || 800;
    var label = String(bike.brand || 'moto-moto').toUpperCase().split('').join(' ');
    var tiny = w < 400;                          // у мініатюрі кошика напис не читається — не малюємо
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
          '<stop offset="0" stop-color="#1C1C16"/><stop offset="1" stop-color="#0D0D0B"/>' +
        '</linearGradient></defs>' +
        '<rect width="' + w + '" height="' + h + '" fill="url(#g)"/>' +
        '<path d="M' + (w * 0.52) + ' 0 L' + (w * 0.74) + ' 0 L' + (w * 0.32) + ' ' + h + ' L' + (w * 0.10) + ' ' + h + ' Z" fill="#8FA35C" opacity="0.07"/>' +
        '<path d="M0 ' + (h * 0.72) + ' H' + w + '" stroke="#F4F2ED" stroke-opacity="0.09"/>' +
        (tiny ? '' :
          '<text x="' + (w * 0.06) + '" y="' + (h * 0.55) + '" font-family="Helvetica,Arial,sans-serif" font-size="' + (h * 0.072) + '" letter-spacing="' + (h * 0.028) + '" fill="#F4F2ED" fill-opacity="0.38">' + esc(label) + '</text>' +
          '<text x="' + (w * 0.06) + '" y="' + (h * 0.88) + '" font-family="Helvetica,Arial,sans-serif" font-size="' + (h * 0.028) + '" letter-spacing="' + (h * 0.007) + '" fill="#F4F2ED" fill-opacity="0.2">ФОТО ГОТУЄТЬСЯ</text>') +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

/* Фото з Wikimedia Commons під ліцензіями CC BY / CC BY-SA — вони вимагають
   називати автора й ліцензію поруч із зображенням. */
function creditHTML(b) {
  if (!b.credit) return '';
  return '<p class="credit">Фото: ' + esc(b.credit.author) +
         ' · ' + esc(b.credit.license) + ' · ' + esc(b.credit.source || '') + '</p>';
}

  function bindFallbacks(root) {
    $$('img[data-fb]', root).forEach(function (img) {
      img.addEventListener('error', function handler() {
        img.removeEventListener('error', handler);
        img.src = img.getAttribute('data-fb');
      });
      if (img.complete && img.naturalWidth === 0) img.src = img.getAttribute('data-fb');
    });
  }

  /* -------------------------------------------------------------- state */

  var bikes = read(LS.bikes, null) || DEFAULT_BIKES.slice();
  var cart  = read(LS.cart, []) || [];
  var lastAdded = read(LS.last, null);

  var filter = { brand: 'all', type: 'all', sort: 'featured' };

  function findBike(id) {
    for (var i = 0; i < bikes.length; i++) if (bikes[i].id === id) return bikes[i];
    return null;
  }
  function cartCount() { return cart.reduce(function (s, l) { return s + l.qty; }, 0); }
  function cartTotal() {
    return cart.reduce(function (s, l) {
      var b = findBike(l.id);
      return s + (b ? b.price * l.qty : 0);
    }, 0);
  }

  /* ------------------------------------------------------------ бренди */

  function renderBrands() {
    var strip = $('#brandStrip');
    if (!strip) return;
    var html = BRANDS.map(function (b) {
      return '<span class="brand-chip">' + esc(b.name) +
             (b.type === 'electric' ? '<sup>EV</sup>' : '') + '</span>';
    }).join('');
    // два прогони поспіль — безшовна стрічка
    strip.innerHTML = '<div class="marquee__row">' + html + '</div><div class="marquee__row" aria-hidden="true">' + html + '</div>';
    var cnt = $('#brandCount');
    if (cnt) cnt.textContent = BRANDS.length;
  }

  /* ----------------------------------------------------------- каталог */

  function specsHTML(b) {
    var second = b.type === 'electric'
      ? { k: 'Тип', v: 'Електро' }
      : { k: 'Об’єм', v: (b.displacement || '—') + ' <small>см³</small>' };
    return '<div class="specs">' +
        '<div class="spec spec--power"><span class="spec__k">Сила</span>' +
          '<span class="spec__v">' + esc(b.power) + ' <small>к.с.</small></span></div>' +
        '<div class="spec"><span class="spec__k">' + second.k + '</span>' +
          '<span class="spec__v">' + second.v + '</span></div>' +
      '</div>';
  }

  function cardHTML(b) {
    var inCart = cart.some(function (l) { return l.id === b.id; });
    return '' +
      '<article class="card rv" data-id="' + esc(b.id) + '">' +
        '<button class="card__link" data-detail="' + esc(b.id) + '" aria-label="Відкрити ' + esc(b.brand + ' ' + b.model) + '"></button>' +
        '<div class="card__media">' +
          '<span class="card__n">' + esc(b.n) + '</span>' +
          '<span class="card__tag' + (b.type === 'electric' ? ' is-ev' : '') + '">' + esc(b.category) + '</span>' +
          '<img src="' + esc(b.photo) + '" data-fb="' + placeholder(b) + '" alt="' + esc(b.brand + ' ' + b.model) + '" loading="lazy" decoding="async" width="1200" height="800">' +
        '</div>' +
        '<div class="card__body">' +
          '<span class="card__brand">' + esc(b.brand) + '</span>' +
          '<h3 class="card__model">' + esc(b.model) + '</h3>' +
          '<p class="card__desc">' + esc(b.desc) + '</p>' +
          specsHTML(b) +
          '<div class="card__foot">' +
            '<span class="price">' + money(b.price) + '<small>з США, під ключ</small></span>' +
            '<button class="card__add' + (inCart ? ' is-done' : '') + '" data-add="' + esc(b.id) + '">' +
              (inCart ? 'У кошику' : 'У кошик') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  function visibleBikes() {
    var list = bikes.filter(function (b) {
      if (filter.brand !== 'all' && b.brandId !== filter.brand) return false;
      if (filter.type !== 'all' && b.type !== filter.type) return false;
      return true;
    });
    if (filter.sort === 'price-asc')  list.sort(function (a, b) { return a.price - b.price; });
    if (filter.sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    if (filter.sort === 'power')      list.sort(function (a, b) { return b.power - a.power; });
    return list;
  }

  function renderCatalog() {
    var grid = $('#grid');
    if (!grid) return;
    var list = visibleBikes();
    var counter = $('#catCount');
    if (counter) counter.textContent = list.length;

    if (!list.length) {
      grid.innerHTML = '<div class="empty"><b>Тут поки порожньо</b>За цим фільтром мотоциклів немає. Скиньте фільтр або напишіть нам — знайдемо під замовлення.</div>';
      grid.style.gridTemplateColumns = '1fr';
      return;
    }
    grid.style.gridTemplateColumns = '';
    grid.innerHTML = list.map(cardHTML).join('');
    bindFallbacks(grid);
    observeReveal(grid);
  }

  function renderFilters() {
    var box = $('#brandFilters');
    if (!box) return;
    var used = {};
    bikes.forEach(function (b) { used[b.brandId] = true; });
    var chips = ['<button class="chip' + (filter.brand === 'all' ? ' is-on' : '') + '" data-brand="all">Усі</button>'];
    BRANDS.forEach(function (b) {
      if (!used[b.id]) return;              // бренд без позицій у каталозі фільтром не показуємо
      chips.push('<button class="chip' + (filter.brand === b.id ? ' is-on' : '') + '" data-brand="' + esc(b.id) + '">' + esc(b.name) + '</button>');
    });
    box.innerHTML = chips.join('');
  }

  /* ------------------------------------------------------------ кошик */

  function saveCart() {
    write(LS.cart, cart);
    write(LS.last, lastAdded);
    renderFab();
    renderDrawer();
    var n = cartCount();
    $$('[data-cart-count]').forEach(function (el) { el.textContent = n; });
  }

  function addToCart(id) {
    var line = null;
    for (var i = 0; i < cart.length; i++) if (cart[i].id === id) line = cart[i];
    if (line) line.qty += 1; else cart.push({ id: id, qty: 1 });
    lastAdded = id;
    saveCart();

    var btn = $('[data-add="' + id + '"]');
    if (btn) { btn.classList.add('is-done'); btn.textContent = 'У кошику'; }

    var fab = $('#fab');
    if (fab && !reduced) {
      fab.classList.remove('pulse');
      void fab.offsetWidth;
      fab.classList.add('pulse');
    }
  }

  function setQty(id, delta) {
    for (var i = 0; i < cart.length; i++) {
      if (cart[i].id !== id) continue;
      cart[i].qty += delta;
      if (cart[i].qty < 1) cart.splice(i, 1);
      break;
    }
    if (!cart.some(function (l) { return l.id === id; })) {
      var btn = $('[data-add="' + id + '"]');
      if (btn) { btn.classList.remove('is-done'); btn.textContent = 'У кошик'; }
    }
    saveCart();
  }

  function removeLine(id) {
    cart = cart.filter(function (l) { return l.id !== id; });
    var btn = $('[data-add="' + id + '"]');
    if (btn) { btn.classList.remove('is-done'); btn.textContent = 'У кошик'; }
    saveCart();
  }

  /* Плаваюча іконка: кількість + мініатюра останнього доданого */
  function renderFab() {
    var fab = $('#fab');
    if (!fab) return;
    var n = cartCount();
    if (!n) { fab.classList.remove('is-on'); return; }

    var b = findBike(lastAdded) || findBike(cart[cart.length - 1].id);
    var img = $('#fabImg');
    if (b && img) {
      img.setAttribute('data-fb', placeholder(b, 200, 200));
      img.src = b.photo;
      img.alt = b.brand + ' ' + b.model;
      bindFallbacks(fab);
    }
    $('#fabCount').textContent = n;
    $('#fabTotal').textContent = money(cartTotal());
    fab.classList.add('is-on');
  }

  function renderDrawer() {
    var body = $('#drawerBody');
    if (!body) return;

    if (!cart.length) {
      body.innerHTML = '<div class="cart-empty"><b>Кошик порожній</b>Оберіть мотоцикл у каталозі — і він з’явиться тут.</div>';
      $('#drawerTotal').textContent = money(0);
      $('#checkoutBtn').setAttribute('disabled', '');
      return;
    }
    $('#checkoutBtn').removeAttribute('disabled');

    body.innerHTML = cart.map(function (l) {
      var b = findBike(l.id);
      if (!b) return '';
      return '' +
        '<div class="litem">' +
          '<div class="litem__img"><img src="' + esc(b.photo) + '" data-fb="' + placeholder(b, 200, 200) + '" alt="" loading="lazy"></div>' +
          '<div>' +
            '<span class="litem__b">' + esc(b.brand) + '</span>' +
            '<div class="litem__m">' + esc(b.model) + '</div>' +
            '<span class="litem__p">' + money(b.price) + ' · ' + esc(b.power) + ' к.с.</span>' +
          '</div>' +
          '<div class="litem__side">' +
            '<div class="qty">' +
              '<button data-qty="-1" data-id="' + esc(b.id) + '" aria-label="Менше">−</button>' +
              '<span>' + l.qty + '</span>' +
              '<button data-qty="1" data-id="' + esc(b.id) + '" aria-label="Більше">+</button>' +
            '</div>' +
            '<button class="rm" data-rm="' + esc(b.id) + '">Прибрати</button>' +
          '</div>' +
        '</div>';
    }).join('');
    bindFallbacks(body);
    $('#drawerTotal').textContent = money(cartTotal());
  }

  /* ------------------------------------------------- оверлеї + фокус */

  var lastFocus = null;

  function openOverlay(el) {
    lastFocus = document.activeElement;
    el.classList.add('is-on');
    $('#scrim').classList.add('is-on');
    document.body.classList.add('is-locked');
    var f = el.querySelector('[data-autofocus]') || el.querySelector('button');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }

  function closeOverlay(el) {
    el.classList.remove('is-on');
    if (!$$('.drawer.is-on, .modal.is-on').length) {
      $('#scrim').classList.remove('is-on');
      document.body.classList.remove('is-locked');
    }
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function closeAll() {
    $$('.drawer.is-on, .modal.is-on').forEach(function (el) { el.classList.remove('is-on'); });
    $('#scrim').classList.remove('is-on');
    document.body.classList.remove('is-locked');
  }

  /* ------------------------------------------------- картка товару */

  function openDetail(id) {
    var b = findBike(id);
    if (!b) return;
    var shots = [b.photo].concat(b.gallery || []);
    var box = $('#detailBox');

    box.innerHTML = '' +
      '<button class="promo__close promo__close--detail" data-close-modal aria-label="Закрити" data-autofocus>' +
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5"/></svg>Закрити</button>' +
      '<div class="detail">' +
        '<div class="detail__media">' +
          '<div class="detail__hero"><img id="detailHero" src="' + esc(shots[0]) + '" data-fb="' + placeholder(b) + '" alt="' + esc(b.brand + ' ' + b.model) + '"></div>' +
          (shots.length > 1 ?
            '<div class="detail__thumbs">' +
              shots.slice(1, 4).map(function (s, i) {
                return '<button data-shot="' + esc(s) + '" aria-label="Фото ' + (i + 2) + '"><img src="' + esc(s) + '" data-fb="' + placeholder(b, 400, 300) + '" alt=""></button>';
              }).join('') +
            '</div>' : '') +
          creditHTML(b) +
        '</div>' +
        '<div class="detail__info">' +
          '<div><span class="detail__brand">' + esc(b.brand) + ' · ' + esc(b.year) + '</span>' +
            '<h3 class="display d-md" style="margin-top:10px">' + esc(b.model) + '</h3></div>' +
          '<p class="detail__desc">' + esc(b.desc) + '</p>' +
          '<div class="detail__specs">' +
            '<div class="spec spec--power"><span class="spec__k">Сила</span><span class="spec__v">' + esc(b.power) + ' <small>к.с.</small></span></div>' +
            '<div class="spec"><span class="spec__k">' + (b.type === 'electric' ? 'Тип' : 'Об’єм') + '</span><span class="spec__v">' + (b.type === 'electric' ? 'Електро' : esc(b.displacement) + ' <small>см³</small>') + '</span></div>' +
            '<div class="spec"><span class="spec__k">Клас</span><span class="spec__v" style="font-size:.95rem">' + esc(b.category) + '</span></div>' +
            '<div class="spec"><span class="spec__k">Рік</span><span class="spec__v">' + esc(b.year) + '</span></div>' +
          '</div>' +
          '<div class="detail__price"><span class="price">' + money(b.price) + '</span>' +
            '<span style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:var(--faint)">розмитнення й доставка враховані</span></div>' +
          '<button class="btn btn--solid btn--wide" data-add="' + esc(b.id) + '"><span>Додати в кошик</span></button>' +
        '</div>' +
      '</div>';

    bindFallbacks(box);
    openOverlay($('#detailModal'));
  }

  /* ------------------------------------------- банер знижки (3 сек) */

  function initPromo() {
    var modal = $('#promoModal');
    if (!modal) return;
    if (read(LS.promo, null)) return;         // показуємо один раз на відвідувача

    setTimeout(function () {
      if ($$('.drawer.is-on, .modal.is-on').length) return;   // не перекриваємо відкрите вікно
      openOverlay(modal);
    }, 3000);

    var form = $('#promoForm');
    var input = $('#promoEmail');
    var err = $('#promoErr');

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v)) {
        input.setAttribute('aria-invalid', 'true');
        err.textContent = 'Перевірте адресу — здається, у ній помилка.';
        input.focus();
        return;
      }
      input.removeAttribute('aria-invalid');
      err.textContent = '';
      write(LS.promo, { status: 'subscribed', email: v, at: Date.now() });
      $('#promoInner').innerHTML = '' +
        '<div class="promo__done">' +
          '<span class="promo__badge">Готово</span>' +
          '<h3 class="display d-md">Промокод у вас</h3>' +
          '<p class="promo__x" style="margin-inline:auto">Надіслали копію на ' + esc(v) + '. Код діє 30 днів на будь-яку позицію каталогу.</p>' +
          '<span class="promo__code">MOTO10</span>' +
          '<button class="btn btn--ghost" style="margin-top:26px" data-close-modal><span>Повернутись до каталогу</span></button>' +
        '</div>';
      $('#promoInner').querySelector('[data-close-modal]').focus();
    });

    $$('[data-promo-dismiss]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        write(LS.promo, { status: 'dismissed', at: Date.now() });
        closeOverlay(modal);
      });
    });
  }

  /* -------------------------------------------- скрол-скрабінг відео */

  function initStage() {
    var stage = $('#stage');
    var track = $('#stageTrack');
    var video = $('#heroVideo');
    if (!stage || !track || !video) return;

    var layers = $$('[data-from]', stage);
    var fill = $('#stageFill');
    var val = $('#stageVal');
    var cue = $('#cue');

    var duration = 0;
    var target = 0;
    var current = 0;
    var ticking = false;
    var ready = false;

    // перший кадр у файлі чорний — тримаємо скрабінг у діапазоні 6…100 %
    var START = 0.06;

    function setReady() {
      duration = video.duration || 0;
      if (!(duration > 0)) return;
      ready = true;
      stage.classList.remove('no-video');
      current = target = duration * START;
      try { video.currentTime = current; } catch (e) {}
    }
    video.addEventListener('loadedmetadata', setReady);
    video.addEventListener('loadeddata', setReady);
    if (video.readyState >= 1) setReady();   // метадані могли приїхати ще до init
    video.addEventListener('error', function () { stage.classList.add('no-video'); });

    // iOS не дає перемотувати, доки відео жодного разу не «грало»
    var unlocked = false;
    function unlock() {
      if (unlocked) return;
      unlocked = true;
      var p = video.play();
      if (p && p.then) p.then(function () { video.pause(); }).catch(function () {});
      else { try { video.pause(); } catch (e) {} }
    }
    ['touchstart', 'pointerdown', 'wheel', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, unlock, { once: true, passive: true });
    });

    function progress() {
      var total = track.offsetHeight - window.innerHeight;
      if (total <= 0) return 0;
      return clamp(-track.getBoundingClientRect().top / total, 0, 1);
    }

    function paint() {
      var p = progress();

      if (fill) fill.style.height = (p * 100) + '%';
      if (val) val.textContent = String(Math.round(p * 100)).padStart(2, '0');
      if (cue) cue.style.opacity = p > 0.04 ? '0' : '1';

      layers.forEach(function (l) {
        var from = parseFloat(l.getAttribute('data-from'));
        var to = parseFloat(l.getAttribute('data-to'));
        l.classList.toggle('is-live', p >= from && p < to);
      });

      if (ready && !reduced) target = (START + p * (0.995 - START)) * duration;
    }

    function loop() {
      ticking = false;
      if (!ready || reduced) return;

      current += (target - current) * 0.16;            // згладжування, щоб кадр не смикався
      if (Math.abs(target - current) < 0.004) current = target;
      if (Math.abs(video.currentTime - current) > 0.02) {
        try { video.currentTime = current; } catch (e) {}
      }
      // скрол міг зупинитись раніше, ніж відео дійшло до цілі — догортуємо
      if (current !== target) kick();
    }

    function kick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(loop);
    }

    function onScroll() { paint(); kick(); }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', paint);
    paint();

    // страховка: якщо метадані так і не приїхали — показуємо градієнтний постер
    setTimeout(function () { if (!ready) stage.classList.add('no-video'); }, 6000);
  }

  /* ----------------------------------------------------------- reveal */

  var io = null;
  function observeReveal(root) {
    if (reduced) { $$('.rv', root).forEach(function (el) { el.classList.add('in'); }); return; }
    if (!('IntersectionObserver' in window)) { $$('.rv', root).forEach(function (el) { el.classList.add('in'); }); return; }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('in');
          io.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    }
    $$('.rv', root).forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* -------------------------------------------------------------- nav */

  function initNav() {
    var nav = $('#nav');
    var onScroll = function () { nav.classList.toggle('is-stuck', window.scrollY > 40); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    var mnav = $('#mnav');
    $('#burger').addEventListener('click', function () { mnav.classList.add('is-on'); document.body.classList.add('is-locked'); });
    $$('#mnav a, #mnavClose').forEach(function (el) {
      el.addEventListener('click', function () { mnav.classList.remove('is-on'); document.body.classList.remove('is-locked'); });
    });
  }

  /* -------------------------------------------------------- делегація */

  function initEvents() {
    document.addEventListener('click', function (e) {
      var t = e.target;

      var add = t.closest('[data-add]');
      if (add) { addToCart(add.getAttribute('data-add')); return; }

      var det = t.closest('[data-detail]');
      if (det) { openDetail(det.getAttribute('data-detail')); return; }

      var shot = t.closest('[data-shot]');
      if (shot) {
        var hero = $('#detailHero');
        hero.setAttribute('data-fb', shot.querySelector('img').getAttribute('data-fb'));
        hero.src = shot.getAttribute('data-shot');
        bindFallbacks($('#detailBox'));
        $$('.detail__thumbs button').forEach(function (b) { b.classList.remove('is-on'); });
        shot.classList.add('is-on');
        return;
      }

      if (t.closest('[data-open-cart]')) { renderDrawer(); openOverlay($('#drawer')); return; }
      if (t.closest('[data-close-drawer]')) { closeOverlay($('#drawer')); return; }
      if (t.closest('[data-close-modal]')) { closeAll(); return; }
      if (t.id === 'scrim') { closeAll(); return; }

      var q = t.closest('[data-qty]');
      if (q) { setQty(q.getAttribute('data-id'), parseInt(q.getAttribute('data-qty'), 10)); return; }

      var rm = t.closest('[data-rm]');
      if (rm) { removeLine(rm.getAttribute('data-rm')); return; }

      var brandBtn = t.closest('[data-brand]');
      if (brandBtn) {
        filter.brand = brandBtn.getAttribute('data-brand');
        renderFilters(); renderCatalog(); return;
      }

      var typeBtn = t.closest('[data-type]');
      if (typeBtn) {
        filter.type = typeBtn.getAttribute('data-type');
        $$('.filters [data-type]').forEach(function (b) {   // підсвічуємо лише чіпи у фільтрі, не посилання в підвалі
          b.classList.toggle('is-on', b.getAttribute('data-type') === filter.type);
        });
        renderCatalog(); return;
      }
    });

    var sort = $('#sort');
    if (sort) sort.addEventListener('change', function () { filter.sort = sort.value; renderCatalog(); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('#mnav').classList.contains('is-on')) {
        $('#mnav').classList.remove('is-on');
        document.body.classList.remove('is-locked');
        return;
      }
      if ($$('.drawer.is-on, .modal.is-on').length) closeAll();
    });

    var checkout = $('#checkoutBtn');
    if (checkout) checkout.addEventListener('click', function () {
      var note = $('#drawerNote');
      note.textContent = 'Заявку прийнято. Менеджер передзвонить протягом робочого дня та узгодить умови.';
      note.style.color = 'var(--avo-bright)';
    });
  }

  /* -------------------------------------------------------------- init */

  function init() {
    renderBrands();
    renderFilters();
    renderCatalog();
    renderFab();
    renderDrawer();
    $$('[data-cart-count]').forEach(function (el) { el.textContent = cartCount(); });
    initNav();
    initEvents();
    initStage();
    initPromo();
    observeReveal(document);
    bindFallbacks(document);          // статичні зображення в розмітці теж потребують запасного варіанта

    var y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
