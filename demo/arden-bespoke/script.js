(function () {
  "use strict";

  // ---------- Рік у футері ----------
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Мобільне меню ----------
  var burger = document.querySelector(".burger");
  var panel = document.getElementById("mobile-panel");
  if (burger && panel) {
    burger.addEventListener("click", function () {
      var isOpen = document.body.classList.toggle("is-menu-open");
      burger.setAttribute("aria-expanded", String(isOpen));
    });
    panel.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("is-menu-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ── ДЕМО ── Форма запису на сторінці kontakty.html нікуди не надсилає
  // дані. Тут лише клієнтська валідація й статичне повідомлення про успіх.
  // Місце для підключення бекенду (fetch/POST до CRM або email-сервісу).
  var contactForm = document.querySelector("[data-contact-form]");
  if (contactForm) {
    var phonePattern = /^\+?[0-9\s()-]{7,}$/;

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true;

      contactForm.querySelectorAll(".field").forEach(function (field) {
        var input = field.querySelector("input, textarea, select");
        if (!input) return;
        var value = input.value.trim();
        var ok = true;

        if (input.hasAttribute("required") && value === "") ok = false;
        if (ok && input.type === "tel" && value !== "" && !phonePattern.test(value)) ok = false;

        field.classList.toggle("has-error", !ok);
        if (!ok) valid = false;
      });

      var status = contactForm.querySelector("[data-form-status]");
      if (!valid) {
        if (status) status.classList.remove("is-visible", "is-ok");
        var firstError = contactForm.querySelector(".has-error input, .has-error textarea, .has-error select");
        if (firstError) firstError.focus();
        return;
      }

      if (status) {
        status.classList.add("is-visible", "is-ok");
      }
      contactForm.reset();
    });

    contactForm.querySelectorAll("input, textarea, select").forEach(function (input) {
      input.addEventListener("input", function () {
        var field = input.closest(".field");
        if (field) field.classList.remove("has-error");
      });
    });
  }

  // ── ДЕМО ── Форма розсилки у футері — так само без реальної відправки.
  document.querySelectorAll("[data-signup-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var input = form.querySelector("input[type=email]");
      if (!input || !input.value.trim()) return;
      var msg = form.parentElement.querySelector("[data-signup-msg]");
      if (msg) msg.classList.add("is-visible");
      form.reset();
    });
  });
})();
