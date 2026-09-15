/* bilderfashion — site behaviour
   deps (all vendored locally): lenis, gsap, ScrollTrigger */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  var hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  if (reduced) document.documentElement.classList.add('no-motion');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------
     smooth scroll
     --------------------------------------------------------- */
  var lenis = null;
  if (!reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, wheelMultiplier: 1, touchMultiplier: 1.6 });
    if (hasGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      var raf = function (t) { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }
  function scrollToTarget(el) {
    if (lenis) lenis.scrollTo(el, { offset: -90 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  /* ---------------------------------------------------------
     in-page anchors
     --------------------------------------------------------- */
  $$('a[href^="#"]').forEach(function (a) {
    var id = a.getAttribute('href');
    if (!id || id === '#' || id.length < 2) return;
    a.addEventListener('click', function (e) {
      var t = document.getElementById(id.slice(1));
      if (!t) return;
      e.preventDefault();
      closeMenu();
      scrollToTarget(t);
    });
  });

  /* ---------------------------------------------------------
     header: shrink + hide on scroll down
     --------------------------------------------------------- */
  var hdr = $('.hdr');
  if (hdr) {
    // the bar stays put the whole way down the page, like the reference —
    // it only firms up its background once you leave the very top
    var onScroll = function () {
      hdr.classList.toggle('is-stuck', window.pageYOffset > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------------------------------------------------------
     mobile menu
     --------------------------------------------------------- */
  var burger = $('.burger');
  function closeMenu() {
    if (!document.body.classList.contains('is-menu')) return;
    document.body.classList.remove('is-menu', 'is-locked');
    if (burger) burger.setAttribute('aria-expanded', 'false');
    if (lenis) lenis.start();
  }
  if (burger) {
    burger.addEventListener('click', function () {
      var open = document.body.classList.toggle('is-menu');
      document.body.classList.toggle('is-locked', open);
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    });
  }
  $$('.menu a').forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  /* ---------------------------------------------------------
     scroll reveal
     --------------------------------------------------------- */
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
    $$('.rv, .reveal-lines').forEach(function (el) { io.observe(el); });
  } else {
    $$('.rv, .reveal-lines').forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------
     hero: masked line reveal on load
     --------------------------------------------------------- */
  requestAnimationFrame(function () {
    setTimeout(function () { $$('.on-load').forEach(function (el) { el.classList.add('is-in'); }); }, 80);
  });

  /* ---------------------------------------------------------
     THE REEL — parallax video band between screen 1 and 2
     --------------------------------------------------------- */
  var reel = $('.reel');
  if (reel && hasGsap && !reduced) {
    var items = $$('.reel__item', reel);
    // The drift is measured against the viewport, not the card, so the three
    // columns visibly separate as the page moves from screen one to screen two.
    // Below 820px the reel is a single stacked column — parallax would just
    // open uneven gaps, so it is off there.
    gsap.matchMedia().add('(min-width: 820px)', function () {
      items.forEach(function (el) {
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.12;
        gsap.fromTo(el,
          { y: 0 },
          {
            y: function () { return -speed * window.innerHeight; },
            ease: 'none',
            scrollTrigger: {
              trigger: reel,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.7,
              invalidateOnRefresh: true
            }
          }
        );
      });
    });
    // hero copy drifts up and fades as the reel rises over it
    var heroInner = $('.hero__inner');
    if (heroInner) {
      gsap.to(heroInner, {
        yPercent: -16, opacity: 0, ease: 'none',
        scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: 0.5 }
      });
    }
  }

  /* videos: only play what is on screen; fall back to poster silently */
  var vids = $$('video[data-autoplay]');
  var viewerOpen = false;
  if (vids.length) {
    vids.forEach(function (v) { v.muted = true; });
    if ('IntersectionObserver' in window) {
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          // locking the body reflows the page, which re-fires this observer —
          // without the guard the reel would start again behind the viewer
          if (en.isIntersecting && !viewerOpen) { var p = en.target.play(); if (p && p.catch) p.catch(function () {}); }
          else en.target.pause();
        });
      }, { threshold: 0.15 });
      vids.forEach(function (v) { vio.observe(v); });
    } else {
      vids.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); });
    }
  }

  /* ---------------------------------------------------------
     video viewer — click a reel clip to open it large
     --------------------------------------------------------- */
  var lb = $('#lightbox');
  if (lb) {
    var frames = $$('.reel__frame');
    var lbVideo = $('.lb__video', lb);
    var lbCount = $('.lb__count', lb);
    var lbClose = $('.lb__close', lb);
    var current = 0;
    var lastFocus = null;

    var pad = function (n) { return (n < 10 ? '0' : '') + n; };

    function showClip(i) {
      current = (i + frames.length) % frames.length;
      var frame = frames[current];
      var inline = $('video', frame);
      lbVideo.setAttribute('src', frame.getAttribute('data-hd'));
      if (inline && inline.getAttribute('poster')) lbVideo.setAttribute('poster', inline.getAttribute('poster'));
      lbVideo.load();
      var p = lbVideo.play();
      if (p && p.catch) p.catch(function () {});
      if (lbCount) lbCount.textContent = pad(current + 1) + ' / ' + pad(frames.length);
    }

    function openViewer(i) {
      lastFocus = document.activeElement;
      showClip(i);
      lb.classList.add('is-open');
      document.body.classList.add('is-locked');
      if (lenis) lenis.stop();
      viewerOpen = true;
      vids.forEach(function (v) { v.pause(); });
      requestAnimationFrame(function () { lbClose.focus(); });
    }

    function closeViewer() {
      if (!lb.classList.contains('is-open')) return;
      lb.classList.remove('is-open');
      document.body.classList.remove('is-locked');
      if (lenis) lenis.start();
      viewerOpen = false;
      lbVideo.pause();
      // drop the source once the fade is done so the download stops
      window.setTimeout(function () {
        if (lb.classList.contains('is-open')) return;
        lbVideo.removeAttribute('src');
        lbVideo.load();
      }, 450);
      // the observer will not fire again for clips already on screen
      vids.forEach(function (v) {
        var r = v.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        }
      });
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    frames.forEach(function (frame, i) {
      frame.addEventListener('click', function () { openViewer(i); });
    });
    lbClose.addEventListener('click', closeViewer);
    $$('.lb__btn', lb).forEach(function (b) {
      b.addEventListener('click', function () {
        showClip(current + (parseInt(b.getAttribute('data-step'), 10) || 1));
      });
    });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeViewer(); });

    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') { closeViewer(); return; }
      if (e.key === 'ArrowLeft') { showClip(current - 1); return; }
      if (e.key === 'ArrowRight') { showClip(current + 1); return; }
      if (e.key !== 'Tab') return;
      var stops = $$('button, video', lb);
      if (!stops.length) return;
      var first = stops[0], last = stops[stops.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------------------------------------------------
     process progress bar
     --------------------------------------------------------- */
  var procList = $('.proc__list');
  var procBar = $('.proc__bar i');
  var procCount = $('.proc__count b');
  if (procList && procBar && hasGsap && !reduced) {
    var steps = $$('.step', procList).length;
    ScrollTrigger.create({
      trigger: procList, start: 'top 70%', end: 'bottom 75%',
      onUpdate: function (self) {
        var p = self.progress;
        procBar.style.width = (p * 100).toFixed(1) + '%';
        if (procCount) procCount.textContent = String(Math.min(steps, Math.max(1, Math.ceil(p * steps)))).padStart(2, '0');
      }
    });
  }

  /* ---------------------------------------------------------
     marquees — clone the track for a seamless loop
     --------------------------------------------------------- */
  $$('.marquee').forEach(function (m) {
    var track = $('.marquee__track', m);
    if (!track) return;
    var clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.classList.add('is-cloned');
    m.appendChild(clone);
  });

  /* ---------------------------------------------------------
     custom cursor
     --------------------------------------------------------- */
  if (fine && !reduced) {
    var cur = document.createElement('div');
    cur.className = 'cursor is-hidden';
    cur.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cur);
    document.body.classList.add('has-cursor');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;
    window.addEventListener('mousemove', function (e) {
      if (cx === mx && cy === my) { cx = e.clientX; cy = e.clientY; }
      mx = e.clientX; my = e.clientY;
      cur.classList.remove('is-hidden');
    });
    document.addEventListener('mouseleave', function () { cur.classList.add('is-hidden'); });
    (function loop() {
      cx += (mx - cx) * 0.18; cy += (my - cy) * 0.18;
      cur.style.transform = 'translate3d(' + cx.toFixed(2) + 'px,' + cy.toFixed(2) + 'px,0)';
      requestAnimationFrame(loop);
    })();

    var linkSel = 'a,button,input,select,textarea,label,[role="button"]';
    document.addEventListener('mouseover', function (e) {
      var media = e.target.closest('[data-cursor]');
      if (media) {
        cur.classList.add('is-media'); cur.classList.remove('is-link');
        cur.textContent = media.getAttribute('data-cursor') || '';
        return;
      }
      if (e.target.closest(linkSel)) { cur.classList.add('is-link'); cur.classList.remove('is-media'); cur.textContent = ''; return; }
      cur.classList.remove('is-link', 'is-media'); cur.textContent = '';
    });
  }

  /* ---------------------------------------------------------
     magnetic buttons
     --------------------------------------------------------- */
  if (fine && !reduced) {
    $$('[data-magnetic]').forEach(function (el) {
      var strength = parseFloat(el.getAttribute('data-magnetic')) || 0.28;
      el.addEventListener('mousemove', function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * strength;
        var y = (e.clientY - r.top - r.height / 2) * strength;
        el.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      el.addEventListener('mouseleave', function () { el.style.transform = ''; });
    });
  }

  /* ---------------------------------------------------------
     FAQ
     --------------------------------------------------------- */
  $$('.faq__i').forEach(function (item) {
    var q = $('.faq__q', item), a = $('.faq__a', item);
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var open = item.classList.contains('is-open');
      $$('.faq__i.is-open').forEach(function (o) {
        if (o === item) return;
        o.classList.remove('is-open');
        $('.faq__a', o).style.height = '0px';
        $('.faq__q', o).setAttribute('aria-expanded', 'false');
      });
      item.classList.toggle('is-open', !open);
      q.setAttribute('aria-expanded', String(!open));
      a.style.height = open ? '0px' : a.scrollHeight + 'px';
      if (hasGsap) setTimeout(function () { ScrollTrigger.refresh(); }, 600);
    });
  });

  /* ---------------------------------------------------------
     portfolio filters
     --------------------------------------------------------- */
  var chips = $$('.chip[data-filter]');
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) { c.setAttribute('aria-pressed', String(c === chip)); });
        $$('[data-tags]').forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-tags').split(' ').indexOf(f) > -1;
          card.classList.toggle('is-out', !show);
        });
        if (hasGsap) ScrollTrigger.refresh();
      });
    });
  }

  /* ---------------------------------------------------------
     estimate calculator
     --------------------------------------------------------- */
  var calc = $('#calc');
  if (calc) {
    var SQFT_PER_M2 = 10.7639;
    var RATES = { basic: 95, comfort: 185, turnkey: 310 };
    var BASE_WEEKS = { basic: 3, comfort: 6, turnkey: 9 };
    var DIVISOR = { basic: 260, comfort: 150, turnkey: 120 };
    var money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

    var areaInput = $('#calcArea', calc);
    var pkgSelect = $('#calcPkg', calc);
    var unitBtns = $$('.units button', calc);
    var addons = $$('.opt input[type=checkbox]', calc);
    var unit = 'sqft';

    function areaSqft() {
      var v = parseFloat(areaInput.value);
      if (!isFinite(v) || v <= 0) return 0;
      return unit === 'sqft' ? v : v * SQFT_PER_M2;
    }
    function render() {
      var a = areaSqft();
      var pkg = pkgSelect.value;
      var rate = RATES[pkg];
      var extra = 0;
      addons.forEach(function (c) { if (c.checked) extra += parseFloat(c.getAttribute('data-rate')) || 0; });

      var perUnit = rate + extra;
      var total = a * perUnit;
      var lo = Math.round(total * 0.92 / 500) * 500;
      var hi = Math.round(total * 1.15 / 500) * 500;

      $('#outArea', calc).textContent = a ? Math.round(a).toLocaleString('en-US') + ' sq ft' : '—';
      $('#outPkg', calc).textContent = pkgSelect.options[pkgSelect.selectedIndex].getAttribute('data-label');
      $('#outRate', calc).textContent = money.format(perUnit) + ' / sq ft';
      $('#outExtras', calc).textContent = extra ? '+' + money.format(extra) + ' / sq ft' : 'none';

      if (!a) {
        $('#outTotal', calc).textContent = 'Enter the area';
        $('#outWeeks', calc).textContent = '—';
        return;
      }
      $('#outTotal', calc).textContent = money.format(lo) + ' – ' + money.format(hi);
      var w = Math.ceil(BASE_WEEKS[pkg] + a / DIVISOR[pkg]);
      $('#outWeeks', calc).textContent = w + '–' + (w + 3) + ' weeks';
    }

    unitBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        var next = b.getAttribute('data-unit');
        if (next === unit) return;
        var v = parseFloat(areaInput.value);
        if (isFinite(v) && v > 0) {
          areaInput.value = next === 'm2' ? Math.round(v / SQFT_PER_M2) : Math.round(v * SQFT_PER_M2);
        }
        unit = next;
        unitBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        areaInput.setAttribute('aria-label', 'Area in ' + (unit === 'sqft' ? 'square feet' : 'square metres'));
        render();
      });
    });
    [areaInput, pkgSelect].forEach(function (el) { el.addEventListener('input', render); });
    addons.forEach(function (c) { c.addEventListener('change', render); });
    render();
  }

  /* ---------------------------------------------------------
     contact form — demo only, nothing is sent anywhere
     --------------------------------------------------------- */
  var form = $('#contactForm');
  if (form) {
    var msg = $('#formMsg');
    form.setAttribute('novalidate', 'novalidate');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[data-required]', form).forEach(function (f) {
        var err = f.parentElement.querySelector('.errmsg');
        var val = (f.value || '').trim();
        var bad = !val || (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val));
        f.classList.toggle('err', bad);
        if (err) err.textContent = bad ? (f.type === 'email' ? 'Enter a valid email address.' : 'This field is required.') : '';
        if (bad) ok = false;
      });
      if (!ok) { $('.err', form).focus(); return; }
      form.reset();
      if (msg) {
        msg.classList.add('is-on');
        msg.textContent = 'Thanks — your request is noted. This is a portfolio demo, so nothing was actually sent. Call +1 (212) 555-0148 to reach a real person.';
        msg.focus();
      }
    });
    $$('[data-required]', form).forEach(function (f) {
      f.addEventListener('input', function () {
        if (!f.classList.contains('err')) return;
        f.classList.remove('err');
        var err = f.parentElement.querySelector('.errmsg');
        if (err) err.textContent = '';
      });
    });
  }

  /* keep ScrollTrigger honest once images/fonts settle */
  window.addEventListener('load', function () { if (hasGsap) ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (hasGsap) ScrollTrigger.refresh(); });
  }
})();
