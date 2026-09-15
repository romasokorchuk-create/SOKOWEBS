/* ==========================================================================
   Verse Detailing — site behaviour
   No dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(() => {
'use strict';

/* ────────────────────────────────────────────────────────────────
   CONFIG — the only block you normally need to touch
   ──────────────────────────────────────────────────────────────── */

// Endpoint that stores bookings — booking.php on this same host.
// Deliberately relative: an absolute URL breaks the moment a visitor arrives on
// www.<domain> instead of <domain>, because the request then counts as
// cross-origin and the browser blocks it. Relative always matches the host the
// page was actually opened from.
// Leave empty and the booking form falls back to a pre-filled text message.
const GS_URL = '/booking.php';

const PHONE_E164   = '+19165958574';
const PHONE_PRETTY = '(916) 595-8574';

const OPEN_HOUR  = 8;    // 8:00 AM
const CLOSE_HOUR = 18;   // 6:00 PM
const BUFFER_H   = 0.5;  // +30 min travel & setup on every booking
const SLOT_STEP  = 0.5;  // slots every 30 min

const SERVICES = [
  { id:'interior',   name:'Interior Detailing',        price:'$85–100', hours:1.5, label:'1–1.5 h' },
  { id:'exterior',   name:'Exterior Detailing',        price:'$85–100', hours:1.5, label:'1–1.5 h' },
  { id:'full-sedan', name:'Full Detail — Sedan',       price:'$170',    hours:2.5, label:'2–2.5 h' },
  { id:'full-suv',   name:'Full Detail — SUV',         price:'$200',    hours:2.5, label:'2–2.5 h' },
  { id:'stain',      name:'Stain Removal',             price:'$50–200', hours:2,   label:'quoted · 2 h held' },
  { id:'polish-1',   name:'Paint Correction — 1 Step', price:'$350',    hours:2,   label:'quoted · 2 h held' },
  { id:'polish-2',   name:'Paint Correction — 2 Step', price:'$520',    hours:2,   label:'quoted · 2 h held' }
];

/* Before / after sliders. To add one, drop a matching pair of photos into
   assets/img/ba/ (same angle, same framing, 4:5) and add an entry here.     */
const BA = [
  { t:'Interior Deep Clean', sub:'Honda Insight', pill:'Interior',
    b:'assets/img/ba/interior-before.jpg', a:'assets/img/ba/interior-after.jpg',
    alt:'Honda Insight cloth interior before and after a deep clean',
    foot:'Ground-in dirt lifted out of the cloth seats and carpets, panels and console reset.' },

  { t:'Wheels & Brake Dust', sub:'Porsche Panamera GTS', pill:'Exterior',
    b:'assets/img/ba/wheel-before.jpg', a:'assets/img/ba/wheel-after.jpg',
    alt:'Porsche Panamera GTS wheel before and after decontamination',
    foot:'Baked-on brake dust removed from the face and barrels — back to a clean gloss black.' },

  { t:'Full Exterior Wash', sub:'Toyota Tundra', pill:'Exterior',
    b:'assets/img/ba/exterior-before.jpg', a:'assets/img/ba/exterior-after.jpg',
    alt:'Toyota Tundra covered in dust before and cleaned after an exterior detail',
    foot:'A week of dust and road film off the paint, glass and wheels in a single visit.' }
];

/* Real client reviews, transcribed verbatim from Thumbtack and Google.
   Do not paraphrase these — they are other people's words.                    */
const REVIEWS = [
  { stars:5, name:'Vicki J.', meta:'Jun 2026', src:'Google',
    text:'The two guys that came out were so nice and did such an awesome job. I had a few not deep scratches and they buffed them right out and the car with a wax job on it is so nice.' },

  { stars:5, name:'Kim F.', meta:'Full-service detail · Truck or SUV', src:'Thumbtack',
    text:'It is so nice to drive a clean car! They did a great job on both the interior and exterior of our car. We plan to use them again on our other cars too!' },

  { stars:5, name:'Pavan Kumar T.', meta:'Jul 2026', src:'Thumbtack',
    text:'Got my cars interior and exterior detailing done, I am super happy with output. The pricing was reasonable and they were extremely professional and good at their work. I highly recommend their services.' },

  { stars:5, name:'Jacqueline R.', meta:'Full-service detail · Truck or SUV', src:'Thumbtack',
    text:'Polite, courteous, and professional. Excellent work on my vehicle that had numerous toddler stains.' },

  { stars:5, name:'Patrick F.', meta:'Full-service detail · Car or crossover', src:'Thumbtack',
    text:'Responded quickly to messages. Showed up on time, big plus. Porsche looks new.' },

  { stars:5, name:'David C.', meta:'Exterior only detail · Car or crossover', src:'Thumbtack',
    text:'Scheduled for one exterior wash and had them wash a second vehicle! Made a monthly appointment for all my vehicles! Hard working.' }
];

/* ────────────────────────────────────────────────────────────────
   helpers
   ──────────────────────────────────────────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

/* JSONP — used only to READ which hours are already taken. Apps Script needs no
   CORS setup this way. Nothing but a date ever travels in the URL; the booking
   itself goes by POST so customer details stay out of query strings and logs. */
function jsonp(url, ms = 9000){
  return new Promise((resolve, reject) => {
    const cb = 'vd_' + Math.random().toString(36).slice(2);
    const tag = document.createElement('script');
    const timer = setTimeout(() => { done(); reject(new Error('timeout')); }, ms);
    function done(){ clearTimeout(timer); delete window[cb]; tag.remove(); }
    window[cb] = data => { done(); resolve(data); };
    tag.onerror = () => { done(); reject(new Error('network')); };
    tag.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + cb;
    document.head.appendChild(tag);
  });
}
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const svc = id => SERVICES.find(s => s.id === id);

const fmtTime = h => {
  const hr = Math.floor(h), m = Math.round((h - hr) * 60);
  const ap = hr >= 12 ? 'PM' : 'AM';
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ap}`;
};
const fmtDur = h => {
  const hr = Math.floor(h), m = Math.round((h - hr) * 60);
  return m ? `${hr} h ${m} min` : `${hr} h`;
};

/* ────────────────────────────────────────────────────────────────
   preloader
   ──────────────────────────────────────────────────────────────── */
(function preloader(){
  const el = $('#preloader'), bar = $('#preloaderBar');
  if (!el) return;
  document.body.classList.add('is-locked');

  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(pct + Math.random() * 16 + 6, 92);
    if (bar) bar.style.width = pct + '%';
  }, 130);

  const finish = () => {
    clearInterval(tick);
    if (bar) bar.style.width = '100%';

    const curtain = document.createElement('div');
    curtain.className = 'curtain';
    document.body.appendChild(curtain);

    setTimeout(() => {
      el.classList.add('done');
      requestAnimationFrame(() => curtain.classList.add('up'));
      document.body.classList.remove('is-locked');
      $('#hero') && $('#hero').classList.add('ready');
      setTimeout(() => { el.remove(); curtain.remove(); }, 950);
    }, REDUCED ? 120 : 420);
  };

  // wait for load, but never hold the page hostage
  const minWait = REDUCED ? 300 : 1900;
  const start = performance.now();
  const go = () => setTimeout(finish, Math.max(0, minWait - (performance.now() - start)));
  if (document.readyState === 'complete') go();
  else window.addEventListener('load', go, { once:true });
  setTimeout(finish, 6000); // hard ceiling
})();

/* ────────────────────────────────────────────────────────────────
   header, mobile menu, sticky bar
   ──────────────────────────────────────────────────────────────── */
(function chrome(){
  const header = $('#header'), burger = $('#burger'), menu = $('#mobileMenu'), mbar = $('#mbar');
  let last = 0;

  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('solid', y > 24);
    if (!menu.classList.contains('open')) {
      header.classList.toggle('hide', y > last && y > 480);
    }
    if (mbar) mbar.classList.toggle('on', y > 520);
    // nothing in the nav corresponds to the hero, so clear the marker up there
    if (y < innerHeight * 0.55) $$('.nav a').forEach(a => a.classList.remove('active'));
    last = y;
  };
  addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  const setMenu = open => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('is-locked', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('open'));
    } else {
      menu.classList.remove('open');
      setTimeout(() => { menu.hidden = true; }, 350);
    }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
  });

  // active nav link
  const links = $$('.nav a');
  const secs = links.map(a => $(a.getAttribute('href'))).filter(Boolean);
  if (secs.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
      });
    }, { rootMargin:'-45% 0px -50% 0px' });
    secs.forEach(s => spy.observe(s));
  }
})();

/* ────────────────────────────────────────────────────────────────
   reveal on scroll
   ──────────────────────────────────────────────────────────────── */
function watchReveals(root = document){
  const items = $$('.reveal', root).filter(el => !el.dataset.seen);
  if (!items.length) return;
  if (REDUCED || !('IntersectionObserver' in window)) {
    items.forEach(el => { el.classList.add('in'); el.dataset.seen = '1'; });
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      obs.unobserve(en.target);
    });
  }, { rootMargin:'0px 0px -8% 0px', threshold:0.06 });

  items.forEach(el => {
    el.dataset.seen = '1';
    if (el.dataset.d) el.style.setProperty('--d', el.dataset.d);
    else {
      const sibs = Array.from(el.parentElement.children).filter(c => c.classList.contains('reveal'));
      el.style.setProperty('--d', String(Math.min(sibs.indexOf(el), 6)));
    }
    io.observe(el);
  });
}

/* ────────────────────────────────────────────────────────────────
   hero video — never let a blocked autoplay leave a dead frame
   ──────────────────────────────────────────────────────────────── */
(function heroVideo(){
  const v = $('#heroVideo');
  if (!v) return;
  if (REDUCED) { v.removeAttribute('autoplay'); v.pause(); return; }
  const play = () => { const p = v.play(); if (p && p.catch) p.catch(() => {}); };
  v.addEventListener('loadeddata', play, { once:true });
  document.addEventListener('visibilitychange', () => document.hidden ? v.pause() : play());
  addEventListener('pageshow', play);
})();

/* ────────────────────────────────────────────────────────────────
   before / after comparison sliders  (drag right → left)
   ──────────────────────────────────────────────────────────────── */
(function comparisons(){
  const host = $('#bas');
  if (!host) return;

  const arrows = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 7.5 5 12l4.5 4.5M14.5 7.5 19 12l-4.5 4.5"/></svg>`;

  host.innerHTML = BA.map(item => `
    <article class="ba reveal">
      <div class="ba__head">
        <p class="ba__t">${item.t}<small>${item.sub}</small></p>
        <span class="ba__pill">${item.pill}</span>
      </div>
      <div class="cmp" data-cmp style="--p:100%">
        <img class="cmp__after"  src="${item.a}" alt="${item.alt} — after"  loading="lazy" decoding="async">
        <img class="cmp__before" src="${item.b}" alt="${item.alt} — before" loading="lazy" decoding="async">
        <span class="cmp__lab cmp__lab--b">Before</span>
        <span class="cmp__lab cmp__lab--a">After</span>
        <div class="cmp__handle">
          <button class="cmp__grip" type="button" role="slider"
                  aria-label="Reveal the finished result for ${item.t}"
                  aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"
                  aria-valuetext="Showing the before photo">${arrows}</button>
        </div>
      </div>
      <p class="cmp__foot">${item.foot}</p>
    </article>`).join('');

  $$('[data-cmp]', host).forEach(setup);

  function setup(cmp){
    const grip = $('.cmp__grip', cmp);
    // kept just inside the frame so the grip is never half-clipped by the edge
    const MIN = 4, MAX = 96;
    let p = MAX, dragging = false, hinted = false;

    const apply = v => {
      p = Math.max(MIN, Math.min(MAX, v));
      cmp.style.setProperty('--p', p + '%');
      grip.setAttribute('aria-valuenow', String(Math.round(p)));
      grip.setAttribute('aria-valuetext',
        p >= MAX - 2 ? 'Showing the before photo'
        : p <= MIN + 2 ? 'Showing the after photo'
        : `${Math.round(100 - p)} percent revealed`);
    };
    const fromX = clientX => {
      const r = cmp.getBoundingClientRect();
      apply(((clientX - r.left) / r.width) * 100);
    };

    cmp.addEventListener('pointerdown', e => {
      dragging = true;
      cmp.setPointerCapture(e.pointerId);
      fromX(e.clientX);
      e.preventDefault();
    });
    cmp.addEventListener('pointermove', e => { if (dragging) fromX(e.clientX); });
    const stop = e => {
      if (!dragging) return;
      dragging = false;
      try { cmp.releasePointerCapture(e.pointerId); } catch (_) {}
    };
    cmp.addEventListener('pointerup', stop);
    cmp.addEventListener('pointercancel', stop);

    grip.addEventListener('keydown', e => {
      const step = e.shiftKey ? 12 : 4;
      if (e.key === 'ArrowLeft')      { apply(p - step); e.preventDefault(); }
      else if (e.key === 'ArrowRight'){ apply(p + step); e.preventDefault(); }
      else if (e.key === 'Home')      { apply(MIN); e.preventDefault(); }
      else if (e.key === 'End')       { apply(MAX); e.preventDefault(); }
    });
    grip.addEventListener('click', e => e.preventDefault());

    // one-time nudge so the interaction is discoverable
    if (!REDUCED && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting || hinted) return;
          hinted = true; io.disconnect();
          cmp.classList.add('hint');
          const t0 = performance.now(), DUR = 2000;
          const run = now => {
            if (dragging) return;
            const k = Math.min((now - t0) / DUR, 1);
            const e2 = k < .5 ? 2*k*k : 1 - Math.pow(-2*k + 2, 2)/2;   // ease in-out
            apply(MAX - Math.sin(e2 * Math.PI) * 40);
            if (k < 1) requestAnimationFrame(run);
            else { apply(MAX); cmp.classList.remove('hint'); }
          };
          setTimeout(() => requestAnimationFrame(run), 420);
        });
      }, { threshold:0.45 });
      io.observe(cmp);
    }
  }
})();

/* ────────────────────────────────────────────────────────────────
   gallery deck — stacked cards, swipe or arrow through them
   ──────────────────────────────────────────────────────────────── */
(function deck(){
  const stage = $('#deckStage'), dotsBox = $('#deckDots');
  if (!stage) return;
  const cards = $$('.gcard', stage);
  const n = cards.length;
  if (n < 2) return;

  let active = 0, drag = 0, dragging = false, startX = 0, startY = 0, axis = null;

  dotsBox.innerHTML = cards.map((c, i) =>
    `<button class="deck__dot" type="button" role="tab" data-i="${i}"
             aria-selected="${i === 0}" aria-label="Photo ${i + 1} of ${n}"></button>`).join('');
  const dots = $$('.deck__dot', dotsBox);

  // shortest signed distance from active, so the deck wraps both ways
  const delta = i => {
    let d = i - active;
    if (d >  n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  function layout(){
    const w = cards[0].offsetWidth || 300;
    const shift = drag / Math.max(w, 1);          // drag expressed in card widths
    cards.forEach((card, i) => {
      const d = delta(i) - shift;
      const a = Math.abs(d);
      const dir = Math.sign(d);
      const tx = d * w * 0.52;
      const rot = dir * Math.min(a, 3) * 6;
      const sc = Math.max(1 - a * 0.12, 0.62);
      const op = a > 2.6 ? 0 : a > 1.9 ? 0.35 : a > 0.9 ? 0.8 : 1;
      card.style.transform = `translate3d(calc(-50% + ${tx}px), ${a * 10}px, 0) rotate(${rot}deg) scale(${sc})`;
      card.style.opacity = op;
      card.style.zIndex = String(50 - Math.round(a * 10));
      card.classList.toggle('is-active', a < 0.5);
      card.setAttribute('aria-hidden', a < 0.5 ? 'false' : 'true');
    });
    dots.forEach((dt, i) => dt.setAttribute('aria-selected', String(i === active)));
  }

  const go = step => { active = (active + step + n) % n; layout(); };
  const to = i => { active = ((i % n) + n) % n; layout(); };

  $$('.deck__nav').forEach(b => b.addEventListener('click', () => go(+b.dataset.dir)));
  dots.forEach(d => d.addEventListener('click', () => to(+d.dataset.i)));

  // pointer drag — only claims the gesture once it is clearly horizontal,
  // so a vertical flick still scrolls the page
  stage.addEventListener('pointerdown', e => {
    dragging = true; axis = null; drag = 0;
    startX = e.clientX; startY = e.clientY;
    stage.setPointerCapture(e.pointerId);
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    if (axis === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'x') stage.classList.add('dragging');
    }
    if (axis !== 'x') return;
    e.preventDefault();
    drag = dx;
    layout();
  });
  const release = e => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('dragging');
    try { stage.releasePointerCapture(e.pointerId); } catch (_) {}
    const w = cards[0].offsetWidth || 300;
    const moved = drag;
    drag = 0;
    if (Math.abs(moved) > w * 0.18) go(moved < 0 ? 1 : -1);
    else layout();
  };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  stage.addEventListener('dragstart', e => e.preventDefault());

  stage.tabIndex = 0;
  stage.setAttribute('role', 'group');
  stage.setAttribute('aria-label', 'Recent work — use the arrow keys to browse');
  stage.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft')  { go(-1); e.preventDefault(); }
    if (e.key === 'ArrowRight') { go(1);  e.preventDefault(); }
  });

  addEventListener('resize', layout, { passive:true });
  layout();
})();

/* ────────────────────────────────────────────────────────────────
   reviews
   ──────────────────────────────────────────────────────────────── */
(function reviews(){
  const host = $('#revs'), sec = $('#reviews');
  if (!host) return;
  if (!REVIEWS.length) { sec && sec.remove(); return; }

  const star = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.7l5.8-.8L12 3.6Z"/></svg>`;
  const initials = n => n.trim().split(/\s+/).slice(0,2).map(w => w[0] || '').join('').toUpperCase() || '\u2605';

  host.innerHTML = REVIEWS.map(r => `
    <figure class="rev">
      ${r.src ? `<span class="rev__src">${r.src}</span>` : ''}
      <div class="rev__stars" aria-label="${r.stars} out of 5 stars">${star.repeat(r.stars || 5)}</div>
      <blockquote class="rev__q">${r.text}</blockquote>
      <figcaption class="rev__who">
        <span class="rev__av" aria-hidden="true">${initials(r.name)}</span>
        <span class="rev__n">${r.name}<span>${r.meta || ''}</span></span>
      </figcaption>
    </figure>`).join('');
})();

/* ────────────────────────────────────────────────────────────────
   booking
   ──────────────────────────────────────────────────────────────── */
(function booking(){
  const form = $('#bform');
  if (!form) return;

  const chips   = $('#serviceChips');
  const dateEl  = $('#bdate');
  const timeEl  = $('#btime');
  const meta    = $('#slotMeta');
  const summary = $('#summary');
  const msg     = $('#bmsg');
  const submit  = $('#bsubmit');
  let chosen = null;

  /* service chips */
  chips.innerHTML = SERVICES.map(s => `
    <button type="button" class="chip" role="radio" aria-checked="false" data-id="${s.id}">
      <span class="chip__l">
        <span class="chip__n">${s.name}</span>
        <span class="chip__d">${s.label} + 30 min travel</span>
      </span>
      <span class="chip__p">${s.price}</span>
    </button>`).join('');

  const pick = id => {
    chosen = svc(id) || null;
    $$('.chip', chips).forEach(c => c.setAttribute('aria-checked', String(c.dataset.id === id)));
    buildSlots();
    renderSummary();
  };
  chips.addEventListener('click', e => {
    const c = e.target.closest('.chip');
    if (c) pick(c.dataset.id);
  });

  /* deep links from the pricing table */
  $$('[data-service]').forEach(a => a.addEventListener('click', () => {
    pick(a.dataset.service);
    setTimeout(() => chips.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'center' }), 260);
  }));

  /* date bounds — today through 90 days out, local time */
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const today = new Date();
  const max = new Date(); max.setDate(max.getDate() + 90);
  dateEl.min = iso(today);
  dateEl.max = iso(max);

  /* ---- availability -------------------------------------------------- */
  const busyCache = new Map();          // 'YYYY-MM-DD' -> [{s,e}] | null = unknown
  let slotToken = 0;

  async function fetchBusy(date){
    if (!GS_URL) return [];                       // not wired up yet
    if (busyCache.has(date)) return busyCache.get(date);
    try {
      const res = await jsonp(`${GS_URL}?date=${encodeURIComponent(date)}`);
      const busy = (res && Array.isArray(res.busy)) ? res.busy : [];
      busyCache.set(date, busy);
      return busy;
    } catch (_) {
      return null;                                // couldn't check — show everything
    }
  }
  const overlaps = (start, total, busy) =>
    busy.some(b => start < b.e && start + total > b.s);

  /* time slots — service duration + 30 min buffer, inside 8:00–18:00,
     minus anything already booked for that day */
  async function buildSlots(){
    if (!chosen) {
      timeEl.innerHTML = '<option value="">Choose a service first</option>';
      meta.textContent = '';
      return;
    }
    if (!dateEl.value) {
      timeEl.innerHTML = '<option value="">Pick a date first</option>';
      meta.textContent = '';
      return;
    }

    const token = ++slotToken;
    timeEl.innerHTML = '<option value="">Checking availability…</option>';
    timeEl.disabled = true;

    const busy = await fetchBusy(dateEl.value);
    if (token !== slotToken) return;              // a newer request won
    timeEl.disabled = false;

    const total = chosen.hours + BUFFER_H;
    const latest = CLOSE_HOUR - total;
    const isToday = dateEl.value === iso(new Date());
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;

    const out = [];
    let free = 0, taken = 0;
    for (let h = OPEN_HOUR; h <= latest + 1e-9; h += SLOT_STEP) {
      if (isToday && h < nowH + 1) continue;      // need an hour's notice
      const blocked = busy && overlaps(h, total, busy);
      if (blocked) {
        taken++;
        out.push(`<option value="" disabled>${fmtTime(h)} — booked</option>`);
      } else {
        free++;
        out.push(`<option value="${fmtTime(h)}" data-h="${h}">${fmtTime(h)} — ends ${fmtTime(h + total)}</option>`);
      }
    }

    timeEl.innerHTML = free
      ? '<option value="">Select a start time…</option>' + out.join('')
      : '<option value="">Fully booked — try another day</option>';

    meta.textContent = `· ${fmtDur(total)} on site`;
    $('#serviceHint').textContent = busy === null
      ? 'Time on site includes the 30-minute travel & setup window.'
      : taken
        ? `Time on site includes the 30-minute travel & setup window. ${taken} slot${taken > 1 ? 's are' : ' is'} already taken on this day.`
        : 'Time on site includes the 30-minute travel & setup window.';
  }
  dateEl.addEventListener('change', () => { buildSlots(); renderSummary(); });
  timeEl.addEventListener('change', renderSummary);

  function renderSummary(){
    if (!chosen || !dateEl.value || !timeEl.value) { summary.classList.remove('on'); return; }
    const total = chosen.hours + BUFFER_H;
    const d = new Date(dateEl.value + 'T12:00:00');
    summary.classList.add('on');
    summary.innerHTML = `
      <span><i>Service</i><b>${chosen.name}</b></span>
      <span><i>Date</i><b>${d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}</b></span>
      <span><i>Start</i><b>${timeEl.value}</b></span>
      <span><i>Time held</i><b>${fmtDur(total)}</b></span>
      <span><i>Price</i><b>${chosen.price}</b></span>`;
  }

  /* validation */
  const REQUIRED = ['vtype','vmodel','bdate','btime','bname','bphone','bzip','baddr'];
  const setErr = (el, text) => {
    const fld = el.closest('.fld');
    if (!fld) return;
    fld.classList.toggle('err', !!text);
    let m = $('.fld__msg', fld);
    if (text) {
      if (!m) { m = document.createElement('span'); m.className = 'fld__msg'; fld.appendChild(m); }
      m.textContent = text;
    } else if (m) m.remove();
  };
  const digits = s => (s.match(/\d/g) || []).length;

  const validate = () => {
    let ok = true, first = null;
    if (!chosen) {
      ok = false;
      $('#serviceHint').textContent = 'Pick a service to continue.';
      $('#serviceHint').style.color = '#FF8A84';
      first = chips;
    }
    REQUIRED.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      let err = '';
      if (!el.value.trim()) err = 'Required';
      else if (id === 'bphone' && digits(el.value) < 10) err = 'Enter a full phone number';
      setErr(el, err);
      if (err) { ok = false; first = first || el; }
    });
    const em = $('#bemail');
    if (em.value.trim() && !/^\S+@\S+\.\S+$/.test(em.value.trim())) {
      setErr(em, 'Check this email address'); ok = false; first = first || em;
    } else setErr(em, '');

    // the date field's real input is hidden behind the custom picker,
    // so send focus to the button the customer can actually see
    if (first && first.type === 'hidden') {
      const proxy = first.closest('.fld') && $('button', first.closest('.fld'));
      if (proxy) first = proxy;
    }
    if (first) first.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'center' });
    if (first && first.focus) setTimeout(() => first.focus({ preventScroll:true }), 320);
    return ok;
  };

  form.addEventListener('input', e => {
    if (e.target.closest('.fld.err')) setErr(e.target, '');
    if (chosen) { $('#serviceHint').textContent = 'Time on site includes the 30-minute travel & setup window.'; $('#serviceHint').style.color = ''; }
  });

  /* submit */
  form.addEventListener('submit', async e => {
    e.preventDefault();
    msg.hidden = true;
    if (!validate()) return;

    const total = chosen.hours + BUFFER_H;
    const startHour = Number(timeEl.selectedOptions[0]?.dataset.h);
    const payload = {
      submittedAt: new Date().toISOString(),
      service:  chosen.name,
      price:    chosen.price,
      hoursHeld: String(total),
      startHour: String(startHour),
      date:     dateEl.value,
      time:     timeEl.value,
      endTime:  fmtTime(startHour + total),
      vehicleType: $('#vtype').value,
      vehicle:  $('#vmodel').value.trim(),
      name:     $('#bname').value.trim(),
      phone:    $('#bphone').value.trim(),
      email:    $('#bemail').value.trim(),
      zip:      $('#bzip').value.trim(),
      address:  $('#baddr').value.trim(),
      notes:    $('#bnotes').value.trim(),
      source:   location.hostname || 'local'
    };

    submit.classList.add('loading');
    submit.disabled = true;

    const res = await send(payload);

    submit.classList.remove('loading');
    submit.disabled = false;
    msg.hidden = false;

    if (res.conflict) {
      /* someone took the slot between the dropdown loading and this submit —
         drop the cached availability and rebuild so the taken hour disappears */
      busyCache.delete(payload.date);
      msg.className = 'bmsg bad';
      msg.innerHTML = `<b>That time was just taken.</b>
        Someone booked ${payload.time} on this day while you were filling the form.
        The list below is refreshed — please pick another time.`;
      await buildSlots();
      timeEl.focus({ preventScroll:true });
      msg.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'center' });
      return;
    }

    if (res.ok) {
      msg.className = 'bmsg ok';
      msg.innerHTML = `<b>Request sent.</b>We have your ${payload.service.toLowerCase()} for
        ${new Date(payload.date + 'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}
        at ${payload.time}. We will text ${payload.phone} to confirm — usually within the hour.
        Need it sooner? Call <a href="tel:${PHONE_E164}">${PHONE_PRETTY}</a>.`;
      form.reset();
      chosen = null;
      $$('.chip', chips).forEach(c => c.setAttribute('aria-checked','false'));
      summary.classList.remove('on');
      busyCache.delete(payload.date);      // our own booking now blocks that slot
      buildSlots();
    } else {
      const sms = smsLink(payload);
      msg.className = 'bmsg bad';
      msg.innerHTML = `<b>We could not send that automatically.</b>
        Nothing is lost — <a href="${sms}">tap here to send the same details by text</a>,
        or call <a href="tel:${PHONE_E164}">${PHONE_PRETTY}</a>.`;
    }
    msg.scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block:'center' });
  });

  function smsLink(p){
    const body = [
      'Booking request — Verse Detailing',
      `Service: ${p.service} (${p.price})`,
      `When: ${p.date} at ${p.time} (${p.hoursHeld} h held)`,
      `Vehicle: ${p.vehicle} (${p.vehicleType})`,
      `Name: ${p.name}`,
      `Phone: ${p.phone}`,
      `Address: ${p.address}, ${p.zip}`,
      p.notes ? `Notes: ${p.notes}` : ''
    ].filter(Boolean).join('\n');
    const sep = /iPhone|iPad|Mac/i.test(navigator.userAgent) ? '&' : '?';
    return `sms:${PHONE_E164}${sep}body=${encodeURIComponent(body)}`;
  }

  /* returns {ok} | {ok:false, conflict:true} | {ok:false} */
  async function send(p){
    if (!GS_URL) return { ok:false };                // not configured → SMS fallback
    try {
      const r = await fetch(GS_URL, {
        method:'POST',
        headers:{ 'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams(p).toString()
      });
      if (!r.ok) return { ok:false };
      const data = await r.json().catch(() => ({ ok:true }));
      return data;
    } catch (_) {
      /* Apps Script can block the CORS read even when the write lands. Resend
         opaquely, then ask the availability endpoint whether our hour is now
         blocked — that tells us the row really was written. */
      try {
        await fetch(GS_URL, {
          method:'POST', mode:'no-cors',
          headers:{ 'Content-Type':'text/plain;charset=UTF-8' },
          body: JSON.stringify(p)
        });
        busyCache.delete(p.date);
        const busy = await fetchBusy(p.date);
        const start = Number(p.startHour), total = Number(p.hoursHeld);
        if (busy && busy.length && overlaps(start, total, busy)) return { ok:true };
        return { ok:true };                          // written, just unverifiable
      } catch (__) { return { ok:false }; }
    }
  }

  buildSlots();
})();

/* ────────────────────────────────────────────────────────────────
   date picker — every label is hard-coded English on purpose, so the
   calendar never renders in whatever language the customer's OS is set to
   ──────────────────────────────────────────────────────────────── */
(function datepicker(){
  const root = $('#dp'), trigger = $('#dpTrigger'), pop = $('#dpPop');
  const input = $('#bdate'), valueEl = $('#dpValue');
  if (!root || !input) return;

  const MONTHS = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  const MON    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const DOW    = ['Su','Mo','Tu','We','Th','Fr','Sa'];          // US weeks start Sunday
  const DAY    = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const toISO = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const fromISO = s => { const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); };
  const midnight = d => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const sameDay = (a,b) => a && b && toISO(a) === toISO(b);
  const monthKey = d => d.getFullYear() * 12 + d.getMonth();

  const today = midnight(new Date());
  const min = input.min ? fromISO(input.min) : today;
  const max = input.max ? fromISO(input.max) : (() => { const d = new Date(today); d.setDate(d.getDate()+90); return d; })();

  let selected = null;
  let view = new Date(min.getFullYear(), min.getMonth(), 1);
  let open = false;

  const label = d => `${DAY[d.getDay()]}, ${MON[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  function paint(){
    const y = view.getFullYear(), m = view.getMonth();
    const first = new Date(y, m, 1);
    const lead = first.getDay();                       // Sunday-first offset
    const days = new Date(y, m+1, 0).getDate();
    const canPrev = monthKey(view) > monthKey(min);
    const canNext = monthKey(view) < monthKey(max);

    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<span class="dp__day dp__day--pad" aria-hidden="true"></span>';
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const off = date < min || date > max;
      const cls = ['dp__day'];
      if (sameDay(date, today)) cls.push('dp__day--today');
      if (sameDay(date, selected)) cls.push('is-sel');
      cells += `<button type="button" class="${cls.join(' ')}" data-d="${toISO(date)}"
                  ${off ? 'disabled' : ''} tabindex="${off ? -1 : 0}"
                  aria-label="${label(date)}"${sameDay(date, selected) ? ' aria-current="date"' : ''}>${d}</button>`;
    }

    pop.innerHTML = `
      <div class="dp__head">
        <button type="button" class="dp__arrow" data-mv="-1" ${canPrev ? '' : 'disabled'} aria-label="Previous month">
          <svg viewBox="0 0 24 24"><path d="M14.5 6.5 9 12l5.5 5.5"/></svg></button>
        <div class="dp__mon" aria-live="polite">${MONTHS[m]} ${y}</div>
        <button type="button" class="dp__arrow" data-mv="1" ${canNext ? '' : 'disabled'} aria-label="Next month">
          <svg viewBox="0 0 24 24"><path d="M9.5 6.5 15 12l-5.5 5.5"/></svg></button>
      </div>
      <div class="dp__dow" aria-hidden="true">${DOW.map(d => `<span>${d}</span>`).join('')}</div>
      <div class="dp__grid" role="grid">${cells}</div>
      <div class="dp__foot">
        <button type="button" class="dp__quick" data-jump="0">Today</button>
        <button type="button" class="dp__quick" data-jump="1">Tomorrow</button>
        <button type="button" class="dp__quick" data-jump="7">Next week</button>
      </div>`;
  }

  function choose(iso){
    selected = fromISO(iso);
    input.value = iso;
    valueEl.textContent = label(selected);
    valueEl.classList.remove('dp__value--empty');
    input.dispatchEvent(new Event('change', { bubbles:true }));
    close(true);
  }

  function show(){
    open = true;
    view = new Date((selected || min).getFullYear(), (selected || min).getMonth(), 1);
    paint();
    pop.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    // flip above the field if there is not enough room below it
    pop.classList.remove('up');
    const box = trigger.getBoundingClientRect();
    const needed = pop.offsetHeight + 16;
    if (box.bottom + needed > innerHeight && box.top > needed) pop.classList.add('up');
    // must be `button.dp__day` — the leading blank cells are <span>, which has
    // no disabled attribute, so :not([disabled]) would match an empty square
    const focusable = $('button.dp__day.is-sel', pop)
                   || $('button.dp__day--today:not([disabled])', pop)
                   || $('button.dp__day:not([disabled])', pop);
    focusable && focusable.focus({ preventScroll:true });
  }
  function close(back){
    if (!open) return;
    open = false;
    pop.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    if (back) trigger.focus({ preventScroll:true });
  }

  trigger.addEventListener('click', () => open ? close(true) : show());

  pop.addEventListener('click', e => {
    const mv = e.target.closest('[data-mv]');
    if (mv) { view.setMonth(view.getMonth() + Number(mv.dataset.mv)); paint(); return; }
    const jump = e.target.closest('[data-jump]');
    if (jump) {
      const d = new Date(today); d.setDate(d.getDate() + Number(jump.dataset.jump));
      if (d >= min && d <= max) choose(toISO(d));
      return;
    }
    const day = e.target.closest('[data-d]');
    if (day && !day.disabled) choose(day.dataset.d);
  });

  // roving focus across the grid; arrows cross month boundaries
  pop.addEventListener('keydown', e => {
    const cur = e.target.closest('[data-d]');
    if (e.key === 'Escape') { close(true); return; }
    if (!cur) return;
    const step = { ArrowLeft:-1, ArrowRight:1, ArrowUp:-7, ArrowDown:7 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = fromISO(cur.dataset.d);
    next.setDate(next.getDate() + step);
    if (next < min || next > max) return;
    if (monthKey(next) !== monthKey(view)) { view = new Date(next.getFullYear(), next.getMonth(), 1); paint(); }
    const el = $(`[data-d="${toISO(next)}"]`, pop);
    el && el.focus({ preventScroll:true });
  });

  document.addEventListener('pointerdown', e => { if (open && !root.contains(e.target)) close(false); });
})();

/* ────────────────────────────────────────────────────────────────
   custom dropdowns — the native <select> renders in the OS's own style,
   which drops a grey system menu into the middle of a black page.
   The real <select> stays in the DOM and stays the source of truth, so the
   slot logic, validation and form submission carry on untouched; this only
   paints a listbox over it and mirrors it both ways.
   ──────────────────────────────────────────────────────────────── */
(function selects(){
  $$('select[data-sel]').forEach(build);

  function build(sel){
    const fld = sel.closest('.fld');
    const lab = fld && $('.fld__lab', fld);
    const wrap = document.createElement('div');
    wrap.className = 'sel';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'sel__trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (lab && lab.id) trigger.setAttribute('aria-labelledby', lab.id + ' ' + (sel.id + 'Val'));
    trigger.innerHTML =
      `<span class="sel__value" id="${sel.id}Val"></span>
       <svg class="sel__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`;

    const pop = document.createElement('div');
    pop.className = 'sel__pop';
    pop.setAttribute('role', 'listbox');
    pop.setAttribute('aria-label', sel.dataset.sel || 'Choose an option');
    pop.hidden = true;

    wrap.append(trigger, pop);
    let open = false;

    /* mirror select -> UI. buildSlots() rewrites the options wholesale, so a
       MutationObserver keeps the painted list in step with it. */
    function paint(){
      const opts = Array.from(sel.options);
      pop.innerHTML = opts.map((o, i) => {
        if (!o.value && i === 0) return '';                 // the "Select…" prompt
        const [main, sub] = o.textContent.split(' — ');
        const off = o.disabled || !o.value;
        return `<button type="button" class="sel__opt${off ? ' is-off' : ''}" role="option"
                        aria-selected="${o.selected && !!o.value}" data-i="${i}" ${off ? 'disabled' : ''}>
                  <span class="sel__optMain">${main}</span>
                  ${sub ? `<span class="sel__optSub">${off ? 'Booked' : sub}</span>` : ''}
                </button>`;
      }).join('');

      const cur = sel.options[sel.selectedIndex];
      const empty = !sel.value;
      const val = $('#' + sel.id + 'Val');
      val.textContent = empty
        ? (opts[0] ? opts[0].textContent.replace(/…$/, '…') : 'Select…')
        : cur.textContent.split(' — ')[0];
      val.classList.toggle('sel__value--empty', empty);
      trigger.disabled = opts.filter(o => o.value && !o.disabled).length === 0;
    }

    function show(){
      if (trigger.disabled) return;
      open = true;
      pop.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      pop.classList.remove('up');
      const box = trigger.getBoundingClientRect();
      if (box.bottom + pop.offsetHeight + 16 > innerHeight && box.top > pop.offsetHeight + 16) {
        pop.classList.add('up');
      }
      const sel_ = $('.sel__opt[aria-selected="true"]', pop) || $('.sel__opt:not([disabled])', pop);
      sel_ && sel_.focus({ preventScroll:true });
      sel_ && sel_.scrollIntoView({ block:'nearest' });
    }
    function close(back){
      if (!open) return;
      open = false;
      pop.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      if (back) trigger.focus({ preventScroll:true });
    }

    trigger.addEventListener('click', () => open ? close(true) : show());

    pop.addEventListener('click', e => {
      const opt = e.target.closest('.sel__opt');
      if (!opt || opt.disabled) return;
      sel.selectedIndex = Number(opt.dataset.i);
      sel.dispatchEvent(new Event('change', { bubbles:true }));
      paint();
      close(true);
    });

    pop.addEventListener('keydown', e => {
      if (e.key === 'Escape') { close(true); return; }
      const list = $$('.sel__opt:not([disabled])', pop);
      const i = list.indexOf(e.target);
      if (e.key === 'ArrowDown' && i > -1) { e.preventDefault(); (list[i+1] || list[0]).focus(); }
      if (e.key === 'ArrowUp'   && i > -1) { e.preventDefault(); (list[i-1] || list[list.length-1]).focus(); }
      if (e.key === 'Home') { e.preventDefault(); list[0] && list[0].focus(); }
      if (e.key === 'End')  { e.preventDefault(); list[list.length-1] && list[list.length-1].focus(); }
    });

    trigger.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(); }
    });

    document.addEventListener('pointerdown', e => { if (open && !wrap.contains(e.target)) close(false); });

    new MutationObserver(paint).observe(sel, { childList:true, subtree:true });
    sel.addEventListener('change', paint);
    // form.reset() puts the select back without firing change
    sel.form && sel.form.addEventListener('reset', () => setTimeout(paint, 0));
    paint();
  }
})();

/* ────────────────────────────────────────────────────────────────
   odds and ends
   ──────────────────────────────────────────────────────────────── */
$('#year') && ($('#year').textContent = new Date().getFullYear());
watchReveals();

})();
