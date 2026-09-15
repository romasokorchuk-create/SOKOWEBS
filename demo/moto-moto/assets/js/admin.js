/* moto-moto — адмінпанель: CRUD над каталогом */
(function () {
  'use strict';

  var KEY = 'mm_bikes';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : DEFAULT_BIKES.slice();
    } catch (e) { return DEFAULT_BIKES.slice(); }
  }
  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(bikes));
      return true;
    } catch (e) {
      toast('Не вмістилось у сховище браузера. Приберіть кілька завантажених фото або вкажіть шлях до файлу замість завантаження.', true);
      return false;
    }
  }
  function money(n) { return '$' + Number(n || 0).toLocaleString('en-US'); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) {
    return String(s).toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-') || ('bike-' + Date.now());
  }
  function ph(b) {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">' +
      '<rect width="300" height="300" fill="%23141410"/>' +
      '<text x="150" y="175" font-family="Georgia,serif" font-style="italic" font-size="86" fill="%238FA35C" fill-opacity="0.4" text-anchor="middle">' + (b.n || '00') + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + svg.replace(/#/g, '%23').replace(/"/g, "'");
  }

  var bikes = read();
  var editingId = null;
  var pendingPhoto = null;

  var toastEl = $('#toast'), toastTimer = null;
  function toast(msg, bad) {
    toastEl.textContent = msg;
    toastEl.classList.toggle('is-bad', !!bad);
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, bad ? 5200 : 2600);
  }

  /* ------------------------------------------------------------ рендер */

  function renumber() {
    bikes.forEach(function (b, i) { b.n = String(i + 1).padStart(2, '0'); });
  }

  function renderStats() {
    var n = bikes.length;
    $('#sCount').textContent = n;
    $('#cnt').textContent = n;
    $('#sAvg').textContent = n ? money(Math.round(bikes.reduce(function (s, b) { return s + Number(b.price || 0); }, 0) / n)) : '$0';
    $('#sPower').textContent = n ? Math.max.apply(null, bikes.map(function (b) { return Number(b.power || 0); })) : 0;
    $('#sEv').textContent = bikes.filter(function (b) { return b.type === 'electric'; }).length;
  }

  function renderList() {
    var list = $('#list');
    if (!bikes.length) {
      list.innerHTML = '<div class="arow" style="grid-template-columns:1fr;text-align:center;padding:40px">' +
        '<span style="color:var(--muted)">Каталог порожній. Додайте перший мотоцикл формою зліва.</span></div>';
      renderStats();
      return;
    }
    list.innerHTML = bikes.map(function (b) {
      return '' +
        '<div class="arow' + (b.id === editingId ? ' is-editing' : '') + '">' +
          '<div class="arow__img"><img src="' + esc(b.photo) + '" data-fb="' + ph(b) + '" alt=""></div>' +
          '<div>' +
            '<span class="arow__b">' + esc(b.n) + ' · ' + esc(b.brand) + '</span>' +
            '<div class="arow__m">' + esc(b.model) + '</div>' +
            '<div class="arow__meta">' + money(b.price) + ' · <b>' + esc(b.power) + ' к.с.</b>' +
              (b.type === 'electric' ? ' · електро' : ' · ' + esc(b.displacement || '—') + ' см³') +
              ' · ' + esc(b.category || '—') + '</div>' +
          '</div>' +
          '<div class="arow__act">' +
            '<button class="mini" data-edit="' + esc(b.id) + '">Змінити</button>' +
            '<button class="mini mini--danger" data-del="' + esc(b.id) + '">Видалити</button>' +
          '</div>' +
        '</div>';
    }).join('');

    $$('#list img[data-fb]').forEach(function (img) {
      img.addEventListener('error', function h() {
        img.removeEventListener('error', h);
        img.src = img.getAttribute('data-fb');
      });
      if (img.complete && img.naturalWidth === 0) img.src = img.getAttribute('data-fb');
    });

    renderStats();
  }

  function fillBrands() {
    $('#f-brand').innerHTML = BRANDS.map(function (b) {
      return '<option value="' + esc(b.id) + '">' + esc(b.name) + '</option>';
    }).join('');
  }

  /* ------------------------------------------------------------- форма */

  function resetForm() {
    editingId = null;
    pendingPhoto = null;
    $('#bikeForm').reset();
    $('#f-type').value = 'ice';
    $('#prev').classList.remove('is-on');
    $('#formTitle').textContent = 'Новий мотоцикл';
    $('#formMode').textContent = 'додавання';
    $('#saveBtn').querySelector('span').textContent = 'Додати мотоцикл';
    $('#cancelBtn').style.display = 'none';
    syncType();
    renderList();
  }

  function loadForm(id) {
    var b = null;
    bikes.forEach(function (x) { if (x.id === id) b = x; });
    if (!b) return;

    editingId = id;
    pendingPhoto = null;
    $('#f-brand').value = b.brandId;
    $('#f-model').value = b.model;
    $('#f-year').value = b.year;
    $('#f-price').value = b.price;
    $('#f-power').value = b.power;
    $('#f-cc').value = b.displacement || '';
    $('#f-type').value = b.type;
    $('#f-cat').value = b.category || '';
    $('#f-desc').value = b.desc || '';
    $('#f-photo').value = b.photo || '';

    if (b.photo && b.photo.indexOf('data:') === 0) {
      $('#prevImg').src = b.photo;
      $('#prev').classList.add('is-on');
      $('#f-photo').value = '';
    } else {
      $('#prev').classList.remove('is-on');
    }

    $('#formTitle').textContent = b.model;
    $('#formMode').textContent = 'редагування';
    $('#saveBtn').querySelector('span').textContent = 'Зберегти зміни';
    $('#cancelBtn').style.display = '';
    syncType();
    renderList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function syncType() {
    var ev = $('#f-type').value === 'electric';
    $('#ccWrap').style.opacity = ev ? '.35' : '1';
    $('#f-cc').disabled = ev;
    if (ev) $('#f-cc').value = '';
  }

  function invalid(el, on) {
    if (on) el.setAttribute('aria-invalid', 'true');
    else el.removeAttribute('aria-invalid');
    return on;
  }

  function submit(e) {
    e.preventDefault();

    var model = $('#f-model').value.trim();
    var price = Number($('#f-price').value);
    var power = Number($('#f-power').value);
    var year = Number($('#f-year').value) || new Date().getFullYear();

    var bad = false;
    bad = invalid($('#f-model'), !model) || bad;
    bad = invalid($('#f-price'), !(price > 0)) || bad;
    bad = invalid($('#f-power'), !(power > 0)) || bad;
    if (bad) { toast('Заповніть модель, ціну і силу.', true); return; }

    var brandId = $('#f-brand').value;
    var brand = BRANDS.filter(function (b) { return b.id === brandId; })[0];
    var type = $('#f-type').value;
    var photo = pendingPhoto || $('#f-photo').value.trim();

    var payload = {
      brand: brand ? brand.name : brandId,
      brandId: brandId,
      model: model,
      year: year,
      price: price,
      power: power,
      displacement: type === 'electric' ? null : (Number($('#f-cc').value) || null),
      type: type,
      category: $('#f-cat').value.trim() || (type === 'electric' ? 'Електро' : 'Мотоцикл'),
      desc: $('#f-desc').value.trim(),
      photo: photo || ('assets/bikes/' + slug(brandId + '-' + model) + '/main.jpg')
    };

    if (editingId) {
      bikes.forEach(function (b, i) {
        if (b.id !== editingId) return;
        bikes[i] = Object.assign({}, b, payload);
      });
      if (persist()) toast('Збережено');
    } else {
      payload.id = slug(brandId + '-' + model);
      var taken = bikes.some(function (b) { return b.id === payload.id; });
      if (taken) payload.id += '-' + Date.now().toString(36).slice(-4);
      payload.gallery = [];
      bikes.push(payload);
      renumber();
      if (persist()) toast('Додано: ' + payload.brand + ' ' + payload.model);
    }

    renumber();
    persist();
    resetForm();
  }

  /* --------------------------------------------------------- фото */

  function handleFile(file) {
    if (!file || file.type.indexOf('image/') !== 0) { toast('Це не зображення.', true); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        var max = 900;
        var w = img.width, h = img.height;
        if (w > max) { h = Math.round(h * max / w); w = max; }
        var c = document.createElement('canvas');
        c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        pendingPhoto = c.toDataURL('image/jpeg', 0.72);
        $('#prevImg').src = pendingPhoto;
        $('#prev').classList.add('is-on');
        $('#f-photo').value = '';
        toast('Фото готове — стиснуто до ' + w + '×' + h);
      };
      img.onerror = function () { toast('Не вдалося прочитати зображення.', true); };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  /* -------------------------------------------------------- події */

  function init() {
    fillBrands();
    renumber();
    renderList();
    resetForm();

    $('#bikeForm').addEventListener('submit', submit);
    $('#f-type').addEventListener('change', syncType);
    $('#cancelBtn').addEventListener('click', resetForm);

    $('#list').addEventListener('click', function (e) {
      var ed = e.target.closest('[data-edit]');
      if (ed) { loadForm(ed.getAttribute('data-edit')); return; }

      var del = e.target.closest('[data-del]');
      if (!del) return;
      var id = del.getAttribute('data-del');
      var b = bikes.filter(function (x) { return x.id === id; })[0];
      if (!b) return;
      if (!confirm('Видалити ' + b.brand + ' ' + b.model + ' з каталогу?')) return;
      bikes = bikes.filter(function (x) { return x.id !== id; });
      if (editingId === id) resetForm();
      renumber();
      persist();
      renderList();
      toast('Видалено');
    });

    var drop = $('#drop');
    $('#f-file').addEventListener('change', function (e) { handleFile(e.target.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); });
    });
    drop.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });

    $('#exportBtn').addEventListener('click', function () {
      $('#exportText').value = 'const DEFAULT_BIKES = ' + JSON.stringify(bikes, null, 2) + ';';
      $('#exportModal').classList.add('is-on');
      $('#scrim').classList.add('is-on');
      document.body.classList.add('is-locked');
    });

    function closeExport() {
      $('#exportModal').classList.remove('is-on');
      $('#scrim').classList.remove('is-on');
      document.body.classList.remove('is-locked');
    }
    $('[data-close-export]').addEventListener('click', closeExport);
    $('#scrim').addEventListener('click', closeExport);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeExport(); });

    $('#copyBtn').addEventListener('click', function () {
      var ta = $('#exportText');
      ta.select();
      try {
        if (navigator.clipboard) navigator.clipboard.writeText(ta.value);
        else document.execCommand('copy');
        toast('Скопійовано в буфер');
      } catch (err) { toast('Скопіюйте вручну: Cmd+C', true); }
    });

    $('#resetBtn').addEventListener('click', function () {
      if (!confirm('Повернути типові 10 мотоциклів? Ваші зміни зникнуть.')) return;
      bikes = DEFAULT_BIKES.slice();
      renumber();
      persist();
      resetForm();
      toast('Каталог скинуто');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
