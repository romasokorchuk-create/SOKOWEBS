// ТОРК — інтерактив сайту: мобільне меню, валідація форми запису, рік у футері.
(function () {
  'use strict';

  /* ---------- Мобільне меню ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');

  if (burger && nav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрити меню' : 'Відкрити меню');
      nav.classList.toggle('is-open', open);
      document.body.classList.toggle('is-menu-open', open);
    };

    burger.addEventListener('click', function () {
      setMenu(burger.getAttribute('aria-expanded') !== 'true');
    });

    // Клік по пункту меню — закриваємо (важливо для якоря #zapys на тій же сторінці)
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });

    // Esc закриває меню
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        burger.focus();
      }
    });

    // Поворот екрана / перехід на десктоп — меню не має лишатися відкритим
    window.addEventListener('resize', function () {
      if (window.innerWidth > 760 && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
  }

  /* ---------- Рік у футері ---------- */
  var year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Форма запису ---------- */
  var form = document.getElementById('booking');
  if (!form) return;

  var ok = form.querySelector('.form__ok');

  function fieldError(input) {
    return document.getElementById(input.id + '-error');
  }

  function setError(input, message) {
    var box = fieldError(input);
    input.setAttribute('aria-invalid', 'true');
    if (box) { box.textContent = message; box.classList.add('is-shown'); }
  }

  function clearError(input) {
    var box = fieldError(input);
    input.removeAttribute('aria-invalid');
    if (box) box.classList.remove('is-shown');
  }

  // Телефон: приймаємо 10 цифр (0XX…) або 12 з кодом країни (380XX…).
  function phoneIsValid(value) {
    var digits = value.replace(/\D/g, '');
    return (digits.length === 10 && digits[0] === '0') ||
           (digits.length === 12 && digits.slice(0, 3) === '380');
  }

  function validate() {
    var firstBad = null;

    var name = form.elements.name;
    if (name.value.trim().length < 2) {
      setError(name, 'Вкажіть імʼя — мінімум 2 символи.');
      firstBad = firstBad || name;
    } else clearError(name);

    var phone = form.elements.phone;
    if (!phoneIsValid(phone.value)) {
      setError(phone, 'Вкажіть телефон у форматі 067 123 45 67.');
      firstBad = firstBad || phone;
    } else clearError(phone);

    var car = form.elements.car;
    if (car.value.trim().length < 2) {
      setError(car, 'Напишіть марку й модель авто.');
      firstBad = firstBad || car;
    } else clearError(car);

    return firstBad;
  }

  // Прибираємо помилку, щойно користувач виправляє поле
  ['name', 'phone', 'car'].forEach(function (id) {
    var input = form.elements[id];
    if (input) input.addEventListener('input', function () {
      if (input.getAttribute('aria-invalid') === 'true') clearError(input);
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (ok) ok.classList.remove('is-shown');

    var bad = validate();
    if (bad) { bad.focus(); return; }

    // ── ДЕМО ─────────────────────────────────────────────────────────────
    // Це портфоліо-версія: заявка нікуди не відправляється.
    // Щоб підключити реальний прийом заявок — замініть цей блок на fetch()
    // до свого бекенду або сервісу форм (Web3Forms, Formspree тощо).
    // ─────────────────────────────────────────────────────────────────────
    if (ok) {
      ok.classList.add('is-shown');
      ok.setAttribute('tabindex', '-1');
      ok.focus();
    }
    form.reset();
  });
})();
