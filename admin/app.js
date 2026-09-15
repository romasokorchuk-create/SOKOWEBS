/* ═══════════════════════════════════════════════════════════════════════
   SOKO · адмінка
   Уся перевірка доступу — на боці Supabase: RLS у базі + обов'язкова 2FA.
   Цей файл лише малює інтерфейс. Секретів тут немає: навіть скопійована
   адмінка без твого пароля й коду з телефона не отримає жодного рядка.
   ═══════════════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  // Не даємо вбудувати адмінку в чужу сторінку (clickjacking).
  // На Netlify / Cloudflare те саме робить frame-ancestors у _headers.
  if (window.top !== window.self) { document.body.replaceChildren(); return; }

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const HERE = location.origin + location.pathname;
  const IDLE_MS = 20 * 60 * 1000;

  // DOM без innerHTML: усе, що прийшло з бази, потрапляє на сторінку лише як текст.
  // Заявка з <script> у полі «ім'я» так і лишиться текстом.
  function h(tag, props = {}, ...kids){
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === 'text') n.textContent = v;
      else if (k === 'class') n.className = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : String(v));
    }
    for (const c of kids.flat()) if (c != null) n.append(c instanceof Node ? c : String(c));
    return n;
  }
  const VIEWS = ['setup', 'login', 'forgot', 'enroll', 'mfa', 'newpass', 'app'];
  function show(name){
    VIEWS.forEach(v => { $('#v-' + v).hidden = v !== name; });
    $('#logout').hidden = name !== 'app';
    const first = $('#v-' + name + ' input');
    if (first) first.focus();
  }
  function say(target, text = '', kind = 'err'){
    const m = typeof target === 'string' ? $(target) : target;
    m.textContent = text; m.dataset.kind = kind;
  }
  function busy(btn, on){ btn.disabled = on; btn.setAttribute('aria-busy', on ? 'true' : 'false'); }
  let toastT;
  function toast(text, bad = false){
    const t = $('#toast');
    t.textContent = text; t.dataset.kind = bad ? 'err' : 'ok'; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200);
  }
  const fmt = s => new Intl.DateTimeFormat('uk-UA', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(s));

  // ── налаштування ─────────────────────────────────────────────────────
  const cfg  = window.SOKO_CONFIG || {};
  const SURL = String(cfg.supabaseUrl || '').trim().replace(/\/+$/, '');
  const SKEY = String(cfg.supabaseAnonKey || '').trim();

  // запобіжник: секретний ключ обходить RLS, з ним адмінка не запуститься
  function secretKey(k){
    if (/^sb_secret_/i.test(k)) return true;
    const p = k.split('.');
    if (p.length !== 3) return false;
    try { return JSON.parse(atob(p[1].replace(/-/g, '+').replace(/_/g, '/'))).role === 'service_role'; }
    catch { return false; }
  }
  if (!SURL || !SKEY || !window.supabase) { show('setup'); return; }
  if (secretKey(SKEY)) {
    say('#setup-msg', 'У config.js вставлено СЕКРЕТНИЙ ключ (service_role / sb_secret). Він обходить усі правила бази. Заміни його на anon / publishable і одразу перевипусти секретний ключ у Supabase → Project Settings → API.');
    show('setup'); return;
  }
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(SURL)) {
    say('#setup-msg', 'supabaseUrl у config.js має виглядати так: https://xxxx.supabase.co');
    show('setup'); return;
  }

  const sb = window.supabase.createClient(SURL, SKEY, {
    auth: {
      storage: window.sessionStorage,       // сесія лише в цій вкладці: закрив — вийшов
      persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit'
    }
  });

  let recovery = new URLSearchParams(location.search).has('recovery');
  if (new URLSearchParams(location.hash.slice(1)).get('error_description')) {
    say('#login-msg', 'Посилання з листа недійсне або застаріло. Запроси новий лист.');
    history.replaceState(null, '', HERE);
  }

  sb.auth.onAuthStateChange(event => {
    // з цього колбека інші виклики Supabase робити не можна — відкладаємо
    if (event === 'PASSWORD_RECOVERY') { recovery = true; setTimeout(route, 0); }
    if (event === 'SIGNED_OUT') setTimeout(() => show('login'), 0);
  });

  async function route(){
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return show('login');
    const { data: aal, error } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error) { say('#login-msg', 'Помилка входу: ' + error.message); return show('login'); }
    if (aal.currentLevel !== 'aal2') return aal.nextLevel === 'aal2' ? startChallenge() : startEnroll();
    if (recovery) return show('newpass');
    openApp();
  }

  // ── вхід ─────────────────────────────────────────────────────────────
  $('#f-login').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#f-login .btn');
    busy(btn, true); say('#login-msg');
    const { error } = await sb.auth.signInWithPassword({ email: $('#login-email').value.trim(), password: $('#login-pass').value });
    $('#login-pass').value = '';
    busy(btn, false);
    // одна відповідь на будь-яку помилку: не підказуємо, чи існує така пошта
    if (error) return say('#login-msg', error.status === 429 ? 'Забагато спроб. Зачекай кілька хвилин.' : 'Невірна пошта або пароль.');
    route();
  });
  $('#to-forgot').addEventListener('click', () => { $('#forgot-email').value = $('#login-email').value; say('#forgot-msg'); show('forgot'); });
  $('#to-login').addEventListener('click', () => show('login'));

  // ── зміна пароля через пошту ─────────────────────────────────────────
  async function sendReset(email){
    return sb.auth.resetPasswordForEmail(email, { redirectTo: HERE + '?recovery=1' });
  }
  $('#f-forgot').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#f-forgot .btn');
    busy(btn, true);
    const { error } = await sendReset($('#forgot-email').value.trim());
    busy(btn, false);
    if (error && error.status === 429) return say('#forgot-msg', 'Забагато запитів. Спробуй пізніше.');
    say('#forgot-msg', 'Якщо ця пошта зареєстрована, лист уже в дорозі. Посилання одноразове й діє обмежений час.', 'ok');
  });

  // ── 2FA ──────────────────────────────────────────────────────────────
  let enrollId = null, factorId = null;
  const code = sel => $(sel).value.replace(/\D/g, '');

  async function startEnroll(){
    show('enroll'); say('#enroll-msg');
    $('#enroll-qr').removeAttribute('src'); $('#enroll-secret').textContent = '';
    const { data: list } = await sb.auth.mfa.listFactors();
    for (const f of (list && list.all) || []) {
      if (f.factor_type === 'totp' && f.status !== 'verified') await sb.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await sb.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'SOKO ' + Date.now() });
    if (error) return say('#enroll-msg', 'Не вдалося увімкнути 2FA: ' + error.message);
    enrollId = data.id;
    $('#enroll-qr').src = data.totp.qr_code;           // data:image/svg+xml — дозволено CSP
    $('#enroll-secret').textContent = data.totp.secret;
  }
  $('#f-enroll').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#f-enroll .btn');
    busy(btn, true);
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: enrollId, code: code('#enroll-code') });
    $('#enroll-code').value = '';
    busy(btn, false);
    if (error) return say('#enroll-msg', 'Код не підійшов. Перевір час на телефоні й введи свіжий код.');
    route();
  });

  async function startChallenge(){
    const { data } = await sb.auth.mfa.listFactors();
    const f = data && data.totp && data.totp[0];
    if (!f) return startEnroll();
    factorId = f.id; say('#mfa-msg'); show('mfa');
  }
  $('#f-mfa').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#f-mfa .btn');
    busy(btn, true);
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: code('#mfa-code') });
    $('#mfa-code').value = '';
    busy(btn, false);
    if (error) return say('#mfa-msg', error.status === 429 ? 'Забагато спроб. Зачекай кілька хвилин.' : 'Невірний код.');
    route();
  });

  // ── новий пароль ─────────────────────────────────────────────────────
  // Перевірка в базі витоків Have I Been Pwned за k-анонімністю: назовні йдуть
  // лише перші 5 символів SHA-1-хешу, сам пароль і повний хеш не покидають браузер.
  async function pwned(pass){
    try {
      const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(pass));
      const hex = [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
      const res = await fetch('https://api.pwnedpasswords.com/range/' + hex.slice(0, 5), { headers: { 'Add-Padding': 'true' }, referrerPolicy: 'no-referrer' });
      if (!res.ok) return false;
      return (await res.text()).split('\n').some(l => { const [s, n] = l.trim().split(':'); return s === hex.slice(5) && Number(n) > 0; });
    } catch { return false; }
  }
  function weak(pass, email){
    if (pass.length < 12) return 'Мінімум 12 символів.';
    if ([/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pass)).length < 3) return 'Змішай щонайменше три з чотирьох: малі, великі літери, цифри, символи.';
    const local = String(email || '').split('@')[0].toLowerCase();
    if (local.length >= 4 && pass.toLowerCase().includes(local)) return 'Пароль не має містити частину пошти.';
    if (/(.)\1{3,}/.test(pass) || /(0123|1234|2345|3456|4567|5678|6789|qwer|asdf|password|passw0rd|soko)/i.test(pass)) return 'Занадто передбачуваний пароль.';
    return '';
  }
  $('#f-newpass').addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('#f-newpass .btn'), p1 = $('#np-1').value, p2 = $('#np-2').value;
    const { data: { user } } = await sb.auth.getUser();
    const w = weak(p1, user && user.email);
    if (w) return say('#np-msg', w);
    if (p1 !== p2) return say('#np-msg', 'Паролі не збігаються.');
    busy(btn, true); say('#np-msg', 'Звіряю з базою витоків…', 'ok');
    if (await pwned(p1)) { busy(btn, false); return say('#np-msg', 'Цей пароль уже є в базах зламаних паролів. Обери інший.'); }
    const { error } = await sb.auth.updateUser({ password: p1 });
    $('#np-1').value = ''; $('#np-2').value = '';
    busy(btn, false);
    if (error) return say('#np-msg', error.code === 'same_password' ? 'Новий пароль збігається зі старим.' : 'Не вдалося змінити: ' + error.message);
    recovery = false; history.replaceState(null, '', HERE);
    toast('Пароль змінено'); openApp();
  });

  // ── робоча частина ───────────────────────────────────────────────────
  let idleT, idleArmed = false, current = 'leads';
  function armIdle(){
    const reset = () => {
      clearTimeout(idleT);
      idleT = setTimeout(async () => {
        await sb.auth.signOut();
        say('#login-msg', 'Сесію завершено: 20 хвилин без дій.', 'ok');
      }, IDLE_MS);
    };
    if (!idleArmed) { ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(ev => addEventListener(ev, reset, { passive: true })); idleArmed = true; }
    reset();
  }
  async function openApp(){
    const [{ data: { user } }, { data: admin }] = await Promise.all([sb.auth.getUser(), sb.rpc('is_admin')]);
    $('#who').textContent = user ? user.email : '';
    $('#not-admin').hidden = admin === true;
    show('app'); armIdle(); tab(current);
  }
  function tab(name){
    current = name;
    $$('[data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === name ? 'true' : 'false'));
    $$('.panel').forEach(p => { p.hidden = p.id !== 'p-' + name; });
    ({ leads: loadLeads, works: loadWorks, prices: loadPrices, security: loadSecurity })[name]();
  }
  $$('[data-tab]').forEach(b => b.addEventListener('click', () => tab(b.dataset.tab)));
  $('#logout').addEventListener('click', () => sb.auth.signOut());

  // ── заявки ───────────────────────────────────────────────────────────
  const STATUSES = [['new', 'Нова'], ['in_progress', 'В роботі'], ['done', 'Готово'], ['spam', 'Спам']];
  async function loadLeads(){
    const box = $('#leads'), st = $('#lead-filter').value;
    box.replaceChildren(h('p', { class: 'muted', text: 'Завантажую…' }));
    let q = sb.from('leads').select('id,created_at,name,phone,email,message,project_type,budget,addons,estimate,discount,lang,status,notes')
      .order('created_at', { ascending: false }).limit(500);
    if (st) q = q.eq('status', st);
    const { data, error } = await q;
    box.replaceChildren();
    if (error) return box.append(h('p', { class: 'msg', 'data-kind': 'err', text: 'Помилка: ' + error.message }));
    $('#lead-count').textContent = data.length ? data.length + ' шт.' : '';
    if (!data.length) return box.append(h('p', { class: 'muted', text: 'Заявок немає.' }));
    data.forEach(L => box.append(leadCard(L)));
  }
  function leadCard(L){
    const dd = (k, v) => [h('dt', { text: k }), h('dd', { text: v == null || v === '' ? '—' : String(v) })];
    const status = h('select', { 'aria-label': 'Статус' }, STATUSES.map(([v, t]) => h('option', { value: v, text: t, selected: v === L.status })));
    const notes = h('textarea', { rows: 2, maxlength: 2000, placeholder: 'Нотатка (бачиш лише ти)' });
    notes.value = L.notes || '';
    const card = h('article', { class: 'lead', 'data-status': L.status },
      h('header', {}, h('b', { text: L.name }), h('time', { text: fmt(L.created_at) })),
      h('p', { class: 'contacts' },
        h('a', { href: 'tel:' + String(L.phone).replace(/[^0-9+]/g, ''), text: L.phone }), ' · ',
        h('a', { href: 'mailto:' + encodeURIComponent(L.email).replace(/%40/g, '@'), text: L.email })),
      h('dl', {}, dd('Тип', L.project_type), dd('Бюджет', L.budget), dd('Оцінка', L.estimate ? '$' + L.estimate : ''),
        dd('Знижка за кейс', L.discount ? 'так' : 'ні'), dd('Доповнення', L.addons), dd('Мова', L.lang)),
      h('p', { class: 'brief', text: L.message }),
      h('div', { class: 'lead__act' }, status, notes,
        h('button', { type: 'button', class: 'btn ghost', text: 'Зберегти нотатку', onclick: async () => {
          const { data, error } = await sb.from('leads').update({ notes: notes.value.slice(0, 2000) }).eq('id', L.id).select('id');
          toast(error || !data.length ? 'Не збережено' : 'Нотатку збережено', !!error || !data.length);
        } }),
        h('button', { type: 'button', class: 'btn danger', text: 'Видалити', onclick: async () => {
          if (!confirm('Видалити заявку від «' + L.name + '»? Це незворотно.')) return;
          const { data, error } = await sb.from('leads').delete().eq('id', L.id).select('id');
          if (error || !data.length) return toast('Не видалено', true);
          card.remove(); toast('Заявку видалено');
        } })));
    status.addEventListener('change', async () => {
      const { data, error } = await sb.from('leads').update({ status: status.value }).eq('id', L.id).select('id');
      if (error || !data.length) return toast('Статус не збережено', true);
      card.dataset.status = status.value; toast('Статус збережено');
    });
    return card;
  }
  $('#lead-filter').addEventListener('change', loadLeads);
  $('#lead-refresh').addEventListener('click', loadLeads);

  // ── портфоліо ────────────────────────────────────────────────────────
  const WF = [['sort', 'Порядок', 'number'], ['name', 'Назва', 'text'], ['slug', 'Slug', 'text'],
    ['cat_ua', 'Категорія · UA', 'text'], ['cat_en', 'Категорія · EN', 'text'], ['cat_pl', 'Категорія · PL', 'text'],
    ['href', 'Посилання', 'text'], ['bg', 'Фон', 'color'], ['accent', 'Акцент', 'color']];
  const RE = { slug: /^[a-z0-9-]{1,40}$/, href: /^(demo\/[a-z0-9-]{1,40}\/index\.html|https:\/\/[^\s"<>']{4,300})$/, color: /^#[0-9a-f]{6}$/i };
  let worksCache = [];
  async function loadWorks(){
    const box = $('#works');
    box.replaceChildren(h('p', { class: 'muted', text: 'Завантажую…' }));
    const { data, error } = await sb.from('works').select('id,sort,visible,slug,name,cat_ua,cat_en,cat_pl,bg,accent,href').order('sort');
    box.replaceChildren();
    if (error) return box.append(h('p', { class: 'msg', 'data-kind': 'err', text: 'Помилка: ' + error.message }));
    worksCache = data;
    if (!data.length) box.append(h('p', { class: 'muted', text: 'Проєктів ще немає.' }));
    data.forEach(w => box.append(workForm(w)));
  }
  function workForm(w){
    const inputs = {};
    const fields = WF.map(([k, label, type]) => {
      const inp = h('input', { type, name: k, required: true, step: type === 'number' ? 1 : null, min: type === 'number' ? 0 : null,
        placeholder: k === 'href' ? 'demo/slug/index.html або https://…' : null, maxlength: type === 'text' ? (k === 'href' ? 300 : 80) : null });
      inp.value = w[k] == null ? '' : String(w[k]);
      inputs[k] = inp;
      return h('label', {}, h('span', { text: label }), inp);
    });
    const vis = h('input', { type: 'checkbox' }); vis.checked = !!w.visible;
    const msg = h('p', { class: 'msg', role: 'alert' });
    const save = h('button', { type: 'submit', class: 'btn', text: w.id ? 'Зберегти' : 'Додати' });
    const form = h('form', { class: 'card', novalidate: true },
      h('div', { class: 'grid' }, fields),
      h('div', { class: 'row' }, h('label', { class: 'vis' }, vis, h('span', { text: 'Показувати на сайті' })), save,
        w.id ? h('button', { type: 'button', class: 'btn danger', text: 'Видалити', onclick: async () => {
          if (!confirm('Прибрати «' + w.name + '» з портфоліо?')) return;
          const { data, error } = await sb.from('works').delete().eq('id', w.id).select('id');
          if (error || !data.length) return say(msg, 'Не видалено: ' + (error ? error.message : 'немає прав'));
          toast('Проєкт видалено'); loadWorks();
        } }) : null),
      msg);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const row = { visible: vis.checked };
      WF.forEach(([k]) => { row[k] = inputs[k].value.trim(); });
      row.sort = Number(row.sort);
      if (!Number.isInteger(row.sort) || row.sort < 0) return say(msg, 'Порядок — ціле число від 0.');
      if (!row.name) return say(msg, 'Вкажи назву.');
      if (!RE.slug.test(row.slug)) return say(msg, 'Slug: малі латинські літери, цифри, дефіс.');
      if (!RE.href.test(row.href)) return say(msg, 'Посилання: demo/slug/index.html або повна адреса https://…');
      if (!RE.color.test(row.bg) || !RE.color.test(row.accent)) return say(msg, 'Кольори у форматі #RRGGBB.');
      busy(save, true); say(msg);
      row.updated_at = new Date().toISOString();
      const q = w.id ? sb.from('works').update(row).eq('id', w.id) : sb.from('works').insert(row);
      const { data, error } = await q.select('id');
      busy(save, false);
      if (error) return say(msg, 'Не збережено: ' + error.message);
      if (!data || !data.length) return say(msg, 'Не збережено: немає прав адміна.');
      toast('Збережено'); loadWorks();
    });
    return form;
  }
  $('#work-add').addEventListener('click', () => {
    const sort = worksCache.reduce((m, w) => Math.max(m, w.sort), 0) + 10;
    $('#works').prepend(workForm({ sort, visible: true, slug: '', name: '', cat_ua: '', cat_en: '', cat_pl: '', bg: '#0a0a0c', accent: '#4ade2e', href: '' }));
    $('#works input[name=name]').focus();
  });

  // ── ціни ─────────────────────────────────────────────────────────────
  const ADDON_KEYS = ['cms', 'admin', 'pay', 'lang', 'seo', 'stats', 'bot', 'host'];
  async function loadPrices(){
    const f = $('#f-prices');
    say('#prices-msg');
    const { data, error } = await sb.from('settings').select('value').eq('key', 'pricing').maybeSingle();
    if (error || !data) return say('#prices-msg', error ? 'Помилка: ' + error.message : 'Цін у базі ще немає — виконай schema.sql.');
    const v = data.value;
    ['START', 'PRO', 'MAX'].forEach(k => { f.elements['t_' + k].value = v.tiers[k]; });
    ADDON_KEYS.forEach(k => { f.elements['a_' + k].value = v.addons[k] != null ? v.addons[k] : 0; });
    f.elements.discount.value = v.discount;
    f.elements.sup_min.value = v.support[0]; f.elements.sup_max.value = v.support[1];
  }
  $('#f-prices').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget, btn = $('#f-prices .btn');
    const num = (name, max) => { const n = Number(f.elements[name].value); return Number.isInteger(n) && n >= 0 && n <= max ? n : NaN; };
    const value = {
      tiers: { START: num('t_START', 100000), PRO: num('t_PRO', 100000), MAX: num('t_MAX', 100000) },
      addons: Object.fromEntries(ADDON_KEYS.map(k => [k, num('a_' + k, 100000)])),
      discount: num('discount', 10000),
      support: [num('sup_min', 10000), num('sup_max', 10000)]
    };
    if ([...Object.values(value.tiers), ...Object.values(value.addons), value.discount, ...value.support].some(Number.isNaN))
      return say('#prices-msg', 'Усі ціни — цілі числа від 0 (пакети й доповнення до 100 000, решта до 10 000).');
    if (value.support[0] > value.support[1]) return say('#prices-msg', 'Підтримка: «від» не може бути більшим за «до».');
    busy(btn, true);
    const { data, error } = await sb.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', 'pricing').select('key');
    busy(btn, false);
    if (error) return say('#prices-msg', 'Не збережено: ' + error.message);
    if (!data.length) return say('#prices-msg', 'Не збережено: немає прав адміна.');
    say('#prices-msg', 'Ціни збережено. На сайті оновляться при наступному відкритті сторінки.', 'ok');
  });

  // ── безпека ──────────────────────────────────────────────────────────
  async function loadSecurity(){
    const [{ data: { user } }, { data: f }] = await Promise.all([sb.auth.getUser(), sb.auth.mfa.listFactors()]);
    $('#sec-email').textContent = user ? user.email : '';
    $('#sec-2fa').textContent = f && f.totp && f.totp.length ? 'увімкнена' : 'не налаштована';
  }
  $('#sec-reset').addEventListener('click', async () => {
    const btn = $('#sec-reset');
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    busy(btn, true);
    const { error } = await sendReset(user.email);
    busy(btn, false);
    toast(error ? 'Лист не надіслано: ' + error.message : 'Лист для зміни пароля надіслано на ' + user.email, !!error);
  });
  $('#sec-global').addEventListener('click', async () => {
    if (confirm('Вийти з адмінки на всіх пристроях?')) await sb.auth.signOut({ scope: 'global' });
  });

  route();
})();
