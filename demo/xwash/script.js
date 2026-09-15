(function () {
  'use strict';

  /* ============ I18N ============ */
  var translations = {
    en: {
      'nav.services': 'Services', 'nav.pricing': 'Pricing', 'nav.gallery': 'Gallery',
      'nav.reviews': 'Reviews', 'nav.contact': 'Contact', 'nav.book': 'Book Now',
      'nav.call': 'Call', 'nav.home': 'Home',

      'hero.eyebrow': 'SACRAMENTO, CALIFORNIA',
      'hero.title1': 'EVERY CAR', 'hero.title2': 'DESERVES XWASH',
      'hero.subtitle': "Mobile detailing that turns heads. We come to you — full wash, interior detail, polish and ceramic-grade finish, done right the first time.",
      'hero.cta1': 'Book Your Wash', 'hero.cta2': 'Call Now',
      'hero.scrollMouse': 'MOVE YOUR CURSOR — SEE IT SHINE',
      'hero.scrollTouch': 'TOUCH &amp; DRAG — SEE IT SHINE',

      'stats.years': 'Years serving Sacramento', 'stats.cars': 'Cars detailed',
      'stats.rating': 'Average rating', 'stats.arrival': 'Average arrival window',

      'services.eyebrow': 'WHAT WE DO', 'services.title': 'Services & Pricing',
      'services.subtitle': 'Every service is performed on-site with premium products. Prices shown are typical for a sedan/mid-size SUV — final quote depends on vehicle size and condition.',
      'services.bookThis': 'Add to booking', 'services.added': 'Added', 'services.popular': 'MOST POPULAR',

      'svc.wash.name': 'Basic Wash', 'svc.wash.desc': 'Hand wash, foam bath, wheels & tires, streak-free windows, spot-free rinse.',
      'svc.express.name': 'Express Wash', 'svc.express.desc': "Quick exterior rinse & dry when you're short on time. In and out in 15 minutes.",
      'svc.interior.name': 'Interior Detailing', 'svc.interior.desc': 'Deep steam clean, upholstery & carpet shampoo, leather conditioning, odor removal.',
      'svc.polish.name': 'Machine Polishing', 'svc.polish.desc': 'Swirl & light-scratch removal, paint correction, restored gloss and depth.',
      'svc.bugtar.name': 'Bug & Tar Removal', 'svc.bugtar.desc': 'Safe chemical treatment to lift baked-on bugs, tar and road grime from paint.',
      'svc.wax.name': 'Wax Protection', 'svc.wax.desc': 'Hand-applied carnauba wax layer for deep shine and weather protection.',
      'svc.tire.name': 'Tire & Trim Dressing', 'svc.tire.desc': 'Deep-black tire shine and trim restoration for a fresh-off-the-lot look.',
      'svc.full.name': 'Full Detail Package', 'svc.full.desc': 'Everything above, combined: exterior wash, interior deep clean, polish, wax, tire dressing, bug & tar removal. Our most popular package.',

      'gallery.eyebrow': 'THE PROOF', 'gallery.title': 'Before & After',
      'gallery.subtitle': 'Drag the slider to see the difference. Real cars, real results.',
      'gallery.before': 'BEFORE', 'gallery.after': 'AFTER',
      'gallery.comingsoon2': 'More results on @xwash.sacramento — new photos added weekly',

      'reviews.eyebrow': 'CLIENTS SAY', 'reviews.title': 'Reviews',
      'reviews.r1.text': '"Booked the full detail package before a road trip — the car looked better than the day I bought it. The tech showed up right on time and was meticulous with the interior."',
      'reviews.r1.name': 'Michael R.', 'reviews.r1.meta': 'Sacramento, CA · Full Detail',
      'reviews.r2.text': '"Express wash on my lunch break, in and out fast and my car was spotless. The tire shine alone made it look brand new. Will be a regular."',
      'reviews.r2.name': 'Jasmine T.', 'reviews.r2.meta': 'Elk Grove, CA · Express Wash',
      'reviews.r3.text': "\"Had bad water spots and swirl marks from a previous wash place. XWASH's polish service brought back the gloss completely. Super professional crew.\"",
      'reviews.r3.name': 'David K.', 'reviews.r3.meta': 'Roseville, CA · Machine Polish',
      'reviews.viewAll': 'See all reviews', 'reviews.pageTitle': 'All Reviews', 'reviews.pageSubtitle': "Every review below is from a real Sacramento-area booking. Can't find yours? It's probably still on Google — we're adding more here every month.",
      'reviews.backHome': 'Back to home',
      'reviews.r4.text': '"Our minivan hadn\'t seen a real clean in two years — three kids and a dog will do that. The interior detail team didn\'t even flinch. It smells like new again."',
      'reviews.r4.name': 'Priya S.', 'reviews.r4.meta': 'Folsom, CA · Interior Detailing',
      'reviews.r5.text': '"I run a small real estate business and need my car looking sharp for showings. XWASH comes to the office parking lot on Fridays — genuinely the easiest part of my week."',
      'reviews.r5.name': 'Marcus L.', 'reviews.r5.meta': 'Rancho Cordova, CA · Full Detail',
      'reviews.r6.text': '"Hit a swarm of bugs on I-5 and the front end was a mess. Bug and tar removal took care of it in like 20 minutes, paint looked untouched underneath."',
      'reviews.r6.name': 'Anthony B.', 'reviews.r6.meta': 'Davis, CA · Bug & Tar Removal',
      'reviews.r7.text': '"Wax protection before a long summer road trip was worth every dollar — bugs and road film wiped off with a damp cloth at every gas stop instead of scrubbing."',
      'reviews.r7.name': 'Courtney W.', 'reviews.r7.meta': 'Citrus Heights, CA · Wax Protection',
      'reviews.r8.text': '"Booked last-minute for a wedding the next morning. They fit me in same day and the car looked like a showroom model. Saved me from a stressful morning."',
      'reviews.r8.name': 'Daniel H.', 'reviews.r8.meta': 'West Sacramento, CA · Full Detail Package',
      'reviews.r9.text': '"Tire and trim dressing made the biggest visual difference for the price. My all-black SUV looks aggressive again instead of dusty grey."',
      'reviews.r9.name': 'Samantha O.', 'reviews.r9.meta': 'Rocklin, CA · Tire & Trim Dressing',

      'booking.eyebrow': 'RESERVE YOUR SLOT', 'booking.title': 'Book Your Detail',
      'booking.subtitle': "Pick a date and time that works for you. We'll confirm by phone or email within a few hours.",
      'booking.perk1': 'We come to your home, office or driveway',
      'booking.perk2': 'No hidden fees — price confirmed before we start',
      'booking.perk3': 'Satisfaction guaranteed or we make it right',
      'booking.callInstead': 'Call instead',
      'booking.name': 'Full name', 'booking.phone': 'Phone number', 'booking.service': 'Service',
      'booking.selectService': 'Select a service…', 'booking.date': 'Date', 'booking.time': 'Time',
      'booking.selectTime': 'Pick a date first…', 'booking.slotBooked': 'booked',
      'booking.slotsLoading': 'Checking availability…', 'booking.slotsError': "Couldn't check availability — please call us to confirm your time.",
      'booking.slotsFull': 'Fully booked that day — please pick another date.', 'booking.slotTaken': 'That time was just booked by someone else — pick another slot.',
      'booking.address': 'Address (where we should come)', 'booking.addressPlaceholder': 'Street, city — Sacramento area',
      'booking.notes': 'Notes (optional)', 'booking.submit': 'Request Booking',
      'booking.success': "Thanks! Your request was sent — we'll confirm shortly by phone or email.",
      'booking.error': "Couldn't send automatically — please call or message us instead, we'd love to get you booked.",
      'booking.ratingText': 'average rating from 4,200+ Sacramento drivers',
      'booking.formBadge': 'XWASH',

      'cart.empty': "No services selected yet — pick one or more above and they'll show up here.",
      'cart.total': 'Estimated total', 'cart.addMore': '+ Add another service',
      'cart.errorEmpty': 'Please select at least one service above before booking.',

      'contact.eyebrow': 'FIND US', 'contact.title': 'Serving Sacramento & Nearby',
      'contact.area': 'Sacramento, CA — mobile service, we come to you',
      'contact.hours': 'Mon–Sun, 8:00 AM – 7:00 PM',
      'contact.radarLabel': 'SACRAMENTO, CA — SERVICE RADIUS',

      'footer.contactLink': "Let's talk", 'footer.privacy': 'Privacy Policy', 'footer.terms': 'Terms of Use',
      'footer.rights': 'All rights reserved', 'footer.backToTop': 'Back to top ↑'
    },
    uk: {
      'nav.services': 'Послуги', 'nav.pricing': 'Ціни', 'nav.gallery': 'Галерея',
      'nav.reviews': 'Відгуки', 'nav.contact': 'Контакти', 'nav.book': 'Записатись',
      'nav.call': 'Дзвінок', 'nav.home': 'Головна',

      'hero.eyebrow': 'САКРАМЕНТО, КАЛІФОРНІЯ',
      'hero.title1': 'КОЖНЕ АВТО', 'hero.title2': 'ГІДНЕ XWASH',
      'hero.subtitle': 'Виїзний детейлінг, після якого озираються. Приїжджаємо до вас — миття, хімчистка салону, полірування та захисне покриття з першого разу.',
      'hero.cta1': 'Записатись на мийку', 'hero.cta2': 'Подзвонити',
      'hero.scrollMouse': 'РУХАЙТЕ КУРСОР — ПОБАЧТЕ БЛИСК',
      'hero.scrollTouch': 'ТОРКНІТЬСЯ ТА ВЕДІТЬ — ПОБАЧТЕ БЛИСК',

      'stats.years': 'Років роботи в Сакраменто', 'stats.cars': 'Авто оброблено',
      'stats.rating': 'Середній рейтинг', 'stats.arrival': 'Середній час прибуття, хв',

      'services.eyebrow': 'ЩО МИ РОБИМО', 'services.title': 'Послуги та ціни',
      'services.subtitle': 'Кожну послугу виконуємо на місці преміальними засобами. Ціни вказані орієнтовно для седана/кросовера — фінальна вартість залежить від розміру та стану авто.',
      'services.bookThis': 'Додати до запису', 'services.added': 'Додано', 'services.popular': 'НАЙПОПУЛЯРНІШЕ',

      'svc.wash.name': 'Базова мийка', 'svc.wash.desc': 'Ручне миття, піна, диски й шини, миття скла без розводів, фінальне ополіскування.',
      'svc.express.name': 'Експрес мийка', 'svc.express.desc': 'Швидке зовнішнє миття та сушка, коли часу обмаль. Всього 15 хвилин.',
      'svc.interior.name': 'Хімчистка салону', 'svc.interior.desc': 'Глибоке парове очищення, шампунь для оббивки та килимів, догляд за шкірою, усунення запахів.',
      'svc.polish.name': 'Полірування', 'svc.polish.desc': 'Видалення павутинки та дрібних подряпин, корекція лакофарбового покриття, повернення глибокого блиску.',
      'svc.bugtar.name': 'Антижук та смола', 'svc.bugtar.desc': 'Безпечна хімічна обробка для видалення комах, смоли та дорожнього бруду з кузова.',
      'svc.wax.name': 'Воскове покриття', 'svc.wax.desc': 'Ручне нанесення воску карнауба для глибокого блиску та захисту від негоди.',
      'svc.tire.name': 'Затемнення гуми', 'svc.tire.desc': 'Глибокий чорний блиск шин та відновлення пластикових елементів — як з салону.',
      'svc.full.name': 'Повний пакет', 'svc.full.desc': 'Все перелічене разом: зовнішнє миття, глибока хімчистка салону, полірування, віск, затемнення гуми, антижук. Наш найпопулярніший пакет.',

      'gallery.eyebrow': 'ДОКАЗИ', 'gallery.title': 'До та після',
      'gallery.subtitle': 'Перетягніть повзунок, щоб побачити різницю. Реальні авто, реальний результат.',
      'gallery.before': 'ДО', 'gallery.after': 'ПІСЛЯ',
      'gallery.comingsoon2': 'Більше результатів у @xwash.sacramento — нові фото щотижня',

      'reviews.eyebrow': 'ВІДГУКИ КЛІЄНТІВ', 'reviews.title': 'Відгуки',
      'reviews.r1.text': '«Замовив повний пакет перед довгою поїздкою — авто виглядало краще, ніж у день покупки. Майстер приїхав вчасно і ретельно почистив салон».',
      'reviews.r1.name': 'Michael R.', 'reviews.r1.meta': 'Sacramento, CA · Повний пакет',
      'reviews.r2.text': '«Експрес-мийка в обідню перерву — швидко і бездоганно чисто. Блиск шин особливо порадував. Тепер буду постійним клієнтом».',
      'reviews.r2.name': 'Jasmine T.', 'reviews.r2.meta': 'Elk Grove, CA · Експрес мийка',
      'reviews.r3.text': '«Були розводи та павутинка після іншої мийки. Полірування від XWASH повністю повернуло блиск. Дуже професійна команда».',
      'reviews.r3.name': 'David K.', 'reviews.r3.meta': 'Roseville, CA · Полірування',
      'reviews.viewAll': 'Всі відгуки', 'reviews.pageTitle': 'Всі відгуки', 'reviews.pageSubtitle': 'Кожен відгук нижче — від реального клієнта в Сакраменто. Не знайшли свій? Він, ймовірно, ще на Google — ми додаємо нові щомісяця.',
      'reviews.backHome': 'На головну',
      'reviews.r4.text': '«Наш мінівен не бачив нормального прибирання два роки — троє дітей і собака своє роблять. Команда хімчистки салону впоралась без проблем. Пахне як новий».',
      'reviews.r4.name': 'Priya S.', 'reviews.r4.meta': 'Folsom, CA · Хімчистка салону',
      'reviews.r5.text': '«У мене невеликий рієлторський бізнес, і авто має виглядати бездоганно для показів. XWASH приїжджає на паркінг офісу щоп\'ятниці — це найпростіша частина мого тижня».',
      'reviews.r5.name': 'Marcus L.', 'reviews.r5.meta': 'Rancho Cordova, CA · Повний пакет',
      'reviews.r6.text': '«Влетів у рій мошки на трасі I-5, перед капота був жах. Антижук та смола прибрали все хвилин за 20, фарба під низом виявилась неушкодженою».',
      'reviews.r6.name': 'Anthony B.', 'reviews.r6.meta': 'Davis, CA · Антижук та смола',
      'reviews.r7.text': '«Воскове покриття перед довгою літньою поїздкою окупилось повністю — комахи й дорожній наліт змивались вологою ганчіркою на кожній заправці, без тертя».',
      'reviews.r7.name': 'Courtney W.', 'reviews.r7.meta': 'Citrus Heights, CA · Воскове покриття',
      'reviews.r8.text': '«Записався в останній момент перед весіллям наступного ранку. Встигли того ж дня, авто виглядало як з автосалону. Врятували мій ранок від стресу».',
      'reviews.r8.name': 'Daniel H.', 'reviews.r8.meta': 'West Sacramento, CA · Повний пакет',
      'reviews.r9.text': '«Затемнення гуми й пластику дало найбільшу візуальну різницю за ці гроші. Мій чорний позашляховик знову виглядає агресивно, а не запилено-сірим».',
      'reviews.r9.name': 'Samantha O.', 'reviews.r9.meta': 'Rocklin, CA · Затемнення гуми',

      'booking.eyebrow': 'ЗАБРОНЮЙТЕ ЧАС', 'booking.title': 'Запис на детейлінг',
      'booking.subtitle': 'Оберіть зручну дату і час. Ми підтвердимо запис телефоном або поштою протягом кількох годин.',
      'booking.perk1': 'Приїжджаємо додому, в офіс або на парковку',
      'booking.perk2': 'Без прихованих платежів — ціна узгоджується заздалегідь',
      'booking.perk3': 'Гарантія якості або ми виправимо все безкоштовно',
      'booking.callInstead': 'Подзвонити',
      'booking.name': "Ім'я", 'booking.phone': 'Номер телефону', 'booking.service': 'Послуга',
      'booking.selectService': 'Оберіть послугу…', 'booking.date': 'Дата', 'booking.time': 'Час',
      'booking.selectTime': 'Спершу оберіть дату…', 'booking.slotBooked': 'зайнято',
      'booking.slotsLoading': 'Перевіряємо наявність…', 'booking.slotsError': 'Не вдалось перевірити наявність — зателефонуйте, щоб підтвердити час.',
      'booking.slotsFull': 'На цей день всі години зайняті — оберіть іншу дату.', 'booking.slotTaken': 'Цей час щойно зайняв інший клієнт — оберіть інший.',
      'booking.address': 'Адреса (куди приїхати)', 'booking.addressPlaceholder': 'Вулиця, місто — район Сакраменто',
      'booking.notes': 'Коментар (необов’язково)', 'booking.submit': 'Надіслати заявку',
      'booking.success': 'Дякуємо! Заявку надіслано — ми зв’яжемось телефоном або поштою найближчим часом.',
      'booking.error': 'Не вдалось надіслати автоматично — зателефонуйте або напишіть нам напряму, ми з радістю запишемо вас.',
      'booking.ratingText': 'середній рейтинг від 4 200+ водіїв Сакраменто',
      'booking.formBadge': 'XWASH',

      'cart.empty': 'Ще нічого не обрано — оберіть одну чи кілька послуг вище, і вони з’являться тут.',
      'cart.total': 'Орієнтовна сума', 'cart.addMore': '+ Додати ще послугу',
      'cart.errorEmpty': 'Оберіть хоча б одну послугу вище перед записом.',

      'contact.eyebrow': 'ДЕ НАС ЗНАЙТИ', 'contact.title': 'Працюємо в Сакраменто та околицях',
      'contact.area': 'Sacramento, CA — виїзний сервіс, приїжджаємо самі',
      'contact.hours': 'Пн–Нд, 8:00 – 19:00',
      'contact.radarLabel': 'САКРАМЕНТО, CA — ЗОНА ОБСЛУГОВУВАННЯ',

      'footer.contactLink': "Зв'язатись", 'footer.privacy': 'Політика конфіденційності', 'footer.terms': 'Умови використання',
      'footer.rights': 'Всі права захищено', 'footer.backToTop': 'Нагору ↑'
    }
  };

  var currentLang = localStorage.getItem('xwash-lang') || 'en';
  var isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;

  function t(key) {
    return (translations[currentLang] && translations[currentLang][key] !== undefined)
      ? translations[currentLang][key]
      : (translations.en[key] || '');
  }

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = t(key);
      if (val) el.innerHTML = val;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-placeholder');
      var val = t(key);
      if (val) el.setAttribute('placeholder', val);
    });
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-lang') === lang);
    });
    updateHeroCue();
    if (typeof renderCart === 'function') renderCart();
    if (typeof renderTimeOptions === 'function') renderTimeOptions();
    localStorage.setItem('xwash-lang', lang);
  }

  document.querySelectorAll('.lang-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { applyLanguage(btn.getAttribute('data-lang')); });
  });

  function updateHeroCue() {
    var el = document.getElementById('hero-cue-text');
    if (!el) return;
    el.innerHTML = t(isTouch ? 'hero.scrollTouch' : 'hero.scrollMouse');
  }

  /* ============ HEADER SCROLL STATE ============ */
  var header = document.getElementById('site-header');
  function onScrollHeader() {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ============ MOBILE NAV ============ */
  var navToggle = document.getElementById('nav-toggle');
  var mainNav = document.getElementById('main-nav');
  navToggle.addEventListener('click', function () {
    var open = mainNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mainNav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      mainNav.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ============ HERO CURSOR REVEAL (dirty -> clean) ============ */
  var heroStage = document.getElementById('hero-stage');
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function setReveal(xPct, yPct) {
    heroStage.style.setProperty('--mx', xPct + '%');
    heroStage.style.setProperty('--my', yPct + '%');
  }

  function sizeReveal() {
    var rect = heroStage.getBoundingClientRect();
    var r = Math.max(rect.width, rect.height) * 0.4;
    r = Math.min(Math.max(r, 260), 520);
    heroStage.style.setProperty('--reveal-r', r + 'px');
  }

  if (heroStage && !reduceMotion) {
    sizeReveal();
    window.addEventListener('resize', sizeReveal);

    if (!isTouch) {
      heroStage.addEventListener('mousemove', function (e) {
        var rect = heroStage.getBoundingClientRect();
        var xPct = ((e.clientX - rect.left) / rect.width) * 100;
        var yPct = ((e.clientY - rect.top) / rect.height) * 100;
        heroStage.classList.add('active');
        setReveal(xPct, yPct);
      });
      heroStage.addEventListener('mouseleave', function () {
        heroStage.classList.remove('active');
      });
      heroStage.addEventListener('mouseenter', function () {
        heroStage.classList.add('active');
      });
    } else {
      var touchActive = false;
      heroStage.addEventListener('touchstart', function (e) {
        touchActive = true;
        heroStage.classList.add('active');
        moveFromTouch(e);
      }, { passive: true });
      heroStage.addEventListener('touchmove', function (e) {
        if (touchActive) moveFromTouch(e);
      }, { passive: true });
      heroStage.addEventListener('touchend', function () {
        touchActive = false;
        heroStage.classList.remove('active');
      });
      function moveFromTouch(e) {
        var touch = e.touches[0];
        if (!touch) return;
        var rect = heroStage.getBoundingClientRect();
        var xPct = ((touch.clientX - rect.left) / rect.width) * 100;
        var yPct = ((touch.clientY - rect.top) / rect.height) * 100;
        setReveal(xPct, yPct);
      }
    }
  } else if (reduceMotion && heroStage) {
    heroStage.style.setProperty('--reveal-r', '3000px');
  }

  /* ============ SCROLL REVEAL ANIMATIONS ============ */
  document.querySelectorAll('.section > .container').forEach(function (el) {
    el.setAttribute('data-reveal', '');
  });
  document.querySelectorAll('.services-grid, .reviews-grid, .stats-grid').forEach(function (el) {
    el.setAttribute('data-reveal-stagger', '');
  });

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('[data-reveal], [data-reveal-stagger]').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ============ STATS COUNT-UP ============ */
  var statEls = document.querySelectorAll('.stat-num');
  var statsObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var target = parseInt(el.getAttribute('data-count'), 10) || 0;
      var duration = 1400;
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var progress = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      statsObserver.unobserve(el);
    });
  }, { threshold: 0.5 });
  statEls.forEach(function (el) { statsObserver.observe(el); });

  /* ============ BEFORE / AFTER SLIDERS ============ */
  document.querySelectorAll('.ba-slider').forEach(function (slider) {
    var range = slider.querySelector('.ba-range');
    var beforeWrap = slider.querySelector('.ba-before-wrap');
    var handle = slider.querySelector('.ba-handle');
    if (!range || !beforeWrap || !handle) return;
    function update(val) {
      beforeWrap.style.clipPath = 'inset(0 ' + (100 - val) + '% 0 0)';
      handle.style.left = val + '%';
    }
    range.addEventListener('input', function () { update(range.value); });
    update(range.value);
  });

  /* ============ SERVICES: SPOTLIGHT + MAGNETIC PRICE ============ */
  var servicesWrap = document.querySelector('.services-grid-wrap');
  var bookingSection = document.getElementById('booking');

  if (servicesWrap && !isTouch && !reduceMotion) {
    servicesWrap.addEventListener('mousemove', function (e) {
      var rect = servicesWrap.getBoundingClientRect();
      servicesWrap.style.setProperty('--sx', (e.clientX - rect.left) + 'px');
      servicesWrap.style.setProperty('--sy', (e.clientY - rect.top) + 'px');
      servicesWrap.classList.add('spotlight-active');
    });
    servicesWrap.addEventListener('mouseleave', function () {
      servicesWrap.classList.remove('spotlight-active');
    });
  }

  document.querySelectorAll('.service-card').forEach(function (card) {
    var price = card.querySelector('.service-price');
    if (price && !isTouch && !reduceMotion) {
      card.addEventListener('mousemove', function (e) {
        var r = card.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        price.style.transition = 'none';
        price.style.transform = 'translate(' + (dx * 8) + 'px, ' + (dy * 8) + 'px)';
        price.classList.add('glow');
      });
      card.addEventListener('mouseleave', function () {
        price.style.transition = 'transform .5s cubic-bezier(.16,.8,.24,1)';
        price.style.transform = 'translate(0,0)';
        price.classList.remove('glow');
      });
    }
  });

  /* ============ CART ============ */
  var SERVICE_META = {};
  document.querySelectorAll('.service-card').forEach(function (card) {
    var name = card.getAttribute('data-service');
    var heading = card.querySelector('h3');
    SERVICE_META[name] = {
      min: parseInt(card.getAttribute('data-price-min'), 10) || 0,
      max: parseInt(card.getAttribute('data-price-max'), 10) || 0,
      i18nKey: heading ? heading.getAttribute('data-i18n') : null
    };
  });

  var cart = [];
  var cartBox = document.getElementById('cart-box');
  var cartList = document.getElementById('cart-list');
  var cartTotalRow = document.getElementById('cart-total-row');
  var cartTotalAmount = document.getElementById('cart-total-amount');
  var cartHiddenInput = document.getElementById('f-services');
  var cartFab = document.getElementById('cart-fab');
  var cartFabCount = document.getElementById('cart-fab-count');
  var cartFabTotal = document.getElementById('cart-fab-total');
  var cartError = document.getElementById('cart-error');

  function serviceLabel(name) {
    var meta = SERVICE_META[name];
    return (meta && meta.i18nKey && t(meta.i18nKey)) ? t(meta.i18nKey) : name;
  }

  function priceRangeText(min, max) {
    return min === max ? ('$' + min) : ('$' + min + ' – $' + max);
  }

  function renderCart() {
    if (!cartBox) return;
    var hasItems = cart.length > 0;
    cartBox.classList.toggle('has-items', hasItems);
    cartList.innerHTML = '';
    var min = 0, max = 0;

    cart.forEach(function (name) {
      var meta = SERVICE_META[name] || { min: 0, max: 0 };
      min += meta.min; max += meta.max;
      var li = document.createElement('li');
      li.className = 'cart-item';

      var nameSpan = document.createElement('span');
      nameSpan.className = 'cart-item-name';
      nameSpan.textContent = serviceLabel(name);

      var rightWrap = document.createElement('span');
      rightWrap.className = 'cart-item-right';

      var priceSpan = document.createElement('span');
      priceSpan.className = 'cart-item-price';
      priceSpan.textContent = priceRangeText(meta.min, meta.max);

      var removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'cart-item-remove';
      removeBtn.setAttribute('aria-label', 'Remove ' + serviceLabel(name));
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', function () { toggleCart(name); });

      rightWrap.appendChild(priceSpan);
      rightWrap.appendChild(removeBtn);
      li.appendChild(nameSpan);
      li.appendChild(rightWrap);
      cartList.appendChild(li);
    });

    if (cartTotalRow) cartTotalRow.hidden = !hasItems;
    if (cartTotalAmount && hasItems) cartTotalAmount.textContent = priceRangeText(min, max);
    if (cartHiddenInput) cartHiddenInput.value = cart.map(serviceLabel).join(', ');

    if (cartFab) {
      cartFab.hidden = !hasItems;
      if (hasItems) {
        cartFabCount.textContent = cart.length;
        cartFabTotal.textContent = min === max ? ('$' + min) : ('$' + min + '–$' + max);
      }
    }

    document.querySelectorAll('.service-card').forEach(function (card) {
      var name = card.getAttribute('data-service');
      var selected = cart.indexOf(name) !== -1;
      card.classList.toggle('selected', selected);
      card.setAttribute('aria-pressed', selected ? 'true' : 'false');
      var dot = card.querySelector('.service-select-dot');
      if (dot) dot.setAttribute('aria-pressed', selected ? 'true' : 'false');
      var label = card.querySelector('.service-cta-label');
      if (label) label.textContent = selected ? t('services.added') : t('services.bookThis');
      var icon = card.querySelector('.service-cta-icon');
      if (icon) icon.textContent = selected ? '✓' : '+';
    });

    if (hasItems && cartError) cartError.classList.remove('visible');
  }

  function toggleCart(name) {
    var idx = cart.indexOf(name);
    if (idx === -1) cart.push(name); else cart.splice(idx, 1);
    renderCart();
  }

  document.querySelectorAll('.service-card').forEach(function (card) {
    var serviceName = card.getAttribute('data-service');
    var heading = card.querySelector('h3');

    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', (heading ? heading.textContent.trim() : 'Service') + ' — add to booking');

    card.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      toggleCart(serviceName);
    });
    card.addEventListener('keydown', function (e) {
      if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('a')) {
        e.preventDefault();
        toggleCart(serviceName);
      }
    });
  });

  if (cartFab && bookingSection) {
    cartFab.addEventListener('click', function () {
      bookingSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ============ DATE MIN = TODAY ============ */
  var dateInput = document.getElementById('f-date');
  var timeSelect = document.getElementById('f-time');
  var slotStatus = document.getElementById('slot-status');
  var todayStr = '';
  if (dateInput) {
    var today = new Date();
    var yyyy = today.getFullYear();
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var dd = String(today.getDate()).padStart(2, '0');
    todayStr = yyyy + '-' + mm + '-' + dd;
    dateInput.setAttribute('min', todayStr);
  }

  /* ============ HOURLY SLOTS + LIVE AVAILABILITY ============ */
  var SLOT_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
  var currentBooked = [];

  function slotLabel(hour) {
    var h = hour % 24;
    var period = h < 12 ? 'AM' : 'PM';
    var h12 = h % 12 === 0 ? 12 : h % 12;
    return h12 + ':00 ' + period;
  }

  function renderTimeOptions() {
    if (!timeSelect) return;
    var prevValue = timeSelect.value;
    timeSelect.innerHTML = '';
    var placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = t('booking.selectTime');
    timeSelect.appendChild(placeholder);

    SLOT_HOURS.forEach(function (hour) {
      var value = String(hour).padStart(2, '0') + ':00';
      var opt = document.createElement('option');
      opt.value = value;
      opt.textContent = slotLabel(hour);
      if (currentBooked.indexOf(value) !== -1) {
        opt.disabled = true;
        opt.textContent += ' — ' + t('booking.slotBooked');
      }
      timeSelect.appendChild(opt);
    });

    if (prevValue && currentBooked.indexOf(prevValue) === -1) timeSelect.value = prevValue;
  }

  function setSlotStatus(text, isError) {
    if (!slotStatus) return;
    slotStatus.textContent = text || '';
    slotStatus.classList.toggle('is-error', !!isError);
  }

  function refreshAvailability() {
    if (!dateInput || !dateInput.value || !timeSelect) return;
    timeSelect.disabled = true;
    setSlotStatus(t('booking.slotsLoading'), false);

    fetch('/api/availability?date=' + encodeURIComponent(dateInput.value))
      .then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (result) {
        timeSelect.disabled = false;
        if (!result.ok) {
          currentBooked = [];
          renderTimeOptions();
          setSlotStatus(t('booking.slotsError'), true);
          return;
        }
        currentBooked = result.data.booked || [];
        renderTimeOptions();
        var freeCount = SLOT_HOURS.length - currentBooked.length;
        if (freeCount <= 0) setSlotStatus(t('booking.slotsFull'), true);
        else setSlotStatus('', false);
      })
      .catch(function () {
        timeSelect.disabled = false;
        currentBooked = [];
        renderTimeOptions();
        setSlotStatus(t('booking.slotsError'), true);
      });
  }

  if (dateInput) {
    renderTimeOptions();
    dateInput.addEventListener('change', refreshAvailability);
  }

  /* ============ BOOKING FORM SUBMIT ============ */
  var bookingForm = document.getElementById('booking-form');
  var formSuccess = document.getElementById('form-success');
  if (bookingForm) {
    bookingForm.addEventListener('submit', function (e) {
      e.preventDefault();

      if (!cart.length) {
        if (cartError) cartError.classList.add('visible');
        if (cartBox) cartBox.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        return;
      }

      var submitBtn = bookingForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      formSuccess.classList.remove('visible');

      var payload = {
        name: document.getElementById('f-name').value,
        phone: document.getElementById('f-phone').value,
        services: cartHiddenInput ? cartHiddenInput.value : cart.join(', '),
        date: dateInput.value,
        time: timeSelect.value,
        address: document.getElementById('f-address').value,
        notes: document.getElementById('f-notes').value
      };

      fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (res.status === 201) {
          formSuccess.textContent = t('booking.success');
          formSuccess.classList.add('visible');
          bookingForm.reset();
          cart = [];
          renderCart();
          renderTimeOptions();
          setSlotStatus('', false);
        } else if (res.status === 409) {
          setSlotStatus(t('booking.slotTaken'), true);
          refreshAvailability();
        } else {
          formSuccess.textContent = t('booking.error');
          formSuccess.classList.add('visible');
        }
      }).catch(function () {
        formSuccess.textContent = t('booking.error');
        formSuccess.classList.add('visible');
      }).finally(function () {
        submitBtn.disabled = false;
      });
    });
  }

  applyLanguage(currentLang);
  renderCart();

})();
