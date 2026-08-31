(function () {
  const TELEGRAM = window.TELEGRAM_CONFIG || {};

  function isConfigured() {
    return (
      TELEGRAM.BOT_TOKEN &&
      TELEGRAM.BOT_TOKEN !== 'YOUR_BOT_TOKEN' &&
      TELEGRAM.CHAT_ID &&
      TELEGRAM.CHAT_ID !== 'YOUR_CHAT_ID'
    );
  }

  function validateName(name) {
    return name.trim().length >= 2;
  }

  function validatePhone(phone) {
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  }

  async function sendToTelegram(name, phone) {
    if (!isConfigured()) {
      throw new Error('Настройте config.js: укажите BOT_TOKEN и CHAT_ID');
    }

    const text = [
      '📋 Новая заявка с сайта СММ-СФЕРА',
      '',
      `👤 Имя: ${name.trim()}`,
      `📞 Телефон: ${phone.trim()}`,
    ].join('\n');

    const url = `https://api.telegram.org/bot${TELEGRAM.BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM.CHAT_ID,
        text,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.description || 'Ошибка отправки в Telegram');
    }

    return data;
  }

  function showMessage(el, text, type) {
    el.textContent = text;
    el.classList.add('is-visible', `form-message--${type}`);
  }

  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    const messageEl = document.getElementById('form-message');
    const nameInput = form.querySelector('[name="name"]');
    const phoneInput = form.querySelector('[name="phone"]');
    const submitBtn = form.querySelector('[type="submit"]');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      nameInput.classList.remove('is-error');
      phoneInput.classList.remove('is-error');
      messageEl.className = 'form-message';

      const name = nameInput.value;
      const phone = phoneInput.value;

      if (!validateName(name)) {
        nameInput.classList.add('is-error');
        showMessage(messageEl, 'Введите имя (минимум 2 символа)', 'error');
        return;
      }

      if (!validatePhone(phone)) {
        phoneInput.classList.add('is-error');
        showMessage(messageEl, 'Введите корректный номер телефона', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Отправка…';

      try {
        await sendToTelegram(name, phone);
        showMessage(messageEl, 'Задание отправлено в штаб! Мы свяжемся с вами.', 'success');
        form.reset();
      } catch (err) {
        showMessage(messageEl, err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Передать задание в штаб';
      }
    });
  }

  function setNavOpen(isOpen) {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-pill');
    const backdrop = document.querySelector('.nav-backdrop');

    if (!burger || !nav) return;

    burger.classList.toggle('is-active', isOpen);
    nav.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    if (backdrop) backdrop.classList.toggle('is-visible', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
  }

  function initBurger() {
    const burger = document.querySelector('.burger');
    const nav = document.querySelector('.nav-pill');
    const backdrop = document.querySelector('.nav-backdrop');
    const headerCta = document.querySelector('.header__cta');

    if (!burger || !nav) return;

    burger.addEventListener('click', () => {
      setNavOpen(!nav.classList.contains('is-open'));
    });

    if (backdrop) {
      backdrop.addEventListener('click', () => setNavOpen(false));
    }

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => setNavOpen(false));
    });

    if (headerCta) {
      headerCta.addEventListener('click', () => setNavOpen(false));
    }

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) {
        setNavOpen(false);
      }
    });
  }

  function initScrollReveal() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal, .reveal-group').forEach((el) => {
        el.classList.add('is-visible');
      });
      return;
    }

    function isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.92 && rect.bottom > 0;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal, .reveal-group').forEach((el) => {
      if (isInViewport(el)) {
        el.classList.add('is-visible');
      } else {
        observer.observe(el);
      }
    });
  }

  function initRevealStagger() {
    document.querySelectorAll('.reveal-group').forEach((group) => {
      group.querySelectorAll('.reveal-item').forEach((item, index) => {
        item.style.setProperty('--reveal-index', index);
      });
    });
  }

  let suppressScrollSpy = false;

  function setActiveNav(id) {
    document.querySelectorAll('.nav-pill__link[data-nav]').forEach((link) => {
      link.classList.toggle('is-active', link.getAttribute('data-nav') === id);
    });
  }

  function initScrollSpy() {
    const navLinks = document.querySelectorAll('.nav-pill__link[data-nav]');
    if (!navLinks.length) return;

    const sections = [...navLinks]
      .map((link) => {
        const id = link.getAttribute('data-nav');
        const el = document.getElementById(id);
        return el ? { id, el } : null;
      })
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        if (suppressScrollSpy) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNav(entry.target.id);
          }
        });
      },
      {
        rootMargin: `-${getHeaderOffset()}px 0px -55% 0px`,
        threshold: 0,
      }
    );

    sections.forEach(({ el }) => observer.observe(el));
  }

  function initHeaderScroll() {
    const header = document.querySelector('.header');
    if (!header) return;

    function onScroll() {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    }

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function initPressEffect() {
    document.querySelectorAll('.btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        btn.classList.add('is-pressed');
        setTimeout(() => btn.classList.remove('is-pressed'), 200);
      });
    });
  }

  function initTilePulse() {
    document.querySelectorAll('.mission-tile, .why-tile').forEach((tile) => {
      tile.classList.add('bento-tile--interactive');
      tile.addEventListener('click', () => {
        tile.classList.remove('is-pulsed');
        void tile.offsetWidth;
        tile.classList.add('is-pulsed');
      });
    });
  }

  function getHeaderOffset() {
    const header = document.querySelector('.header');
    return header ? header.offsetHeight + 12 : 108;
  }

  function scrollToSection(target) {
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    suppressScrollSpy = true;
    setActiveNav(target.id);
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    window.setTimeout(() => {
      suppressScrollSpy = false;
    }, 900);
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      if (anchor.classList.contains('logo-sphere')) return;

      anchor.addEventListener('click', (e) => {
        const id = anchor.getAttribute('href');
        if (id === '#') return;

        const target = document.querySelector(id);
        if (!target) return;

        e.preventDefault();
        e.stopPropagation();
        scrollToSection(target);
      });
    });
  }

  const HEART_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>';
  const THUMB_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>';

  function burstTransform(dx, dy, scale, rot, half) {
    return `translate3d(${-half + dx}px, ${-half + dy}px, 0) scale(${scale}) rotate(${rot}deg)`;
  }

  function animateBurstIcon(icon, dx, dy, rot, duration, half) {
    const frames = [
      { transform: burstTransform(0, 0, 0.2, 0, half), opacity: 0, offset: 0 },
      { transform: burstTransform(dx * 0.25, dy * 0.25, 0.5, 0, half), opacity: 0, offset: 0.18 },
      { transform: burstTransform(dx * 0.45, dy * 0.45, 0.9, 0, half), opacity: 1, offset: 0.32 },
      { transform: burstTransform(dx, dy, 1.05, rot, half), opacity: 1, offset: 0.78 },
      { transform: burstTransform(dx, dy, 0.95, rot, half), opacity: 0, offset: 1 },
    ];

    const animation = icon.animate(frames, {
      duration,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    });

    animation.addEventListener('finish', () => icon.remove());
    animation.addEventListener('cancel', () => icon.remove());
  }

  function spawnLogoBurst(sphere, mode) {
    const container = sphere.querySelector('.logo-sphere__burst');
    if (!container) return;

    const isHero = sphere.classList.contains('logo-sphere--hero');
    const isClick = mode === 'click';
    const count = isHero ? (isClick ? 15 : 10) : (isClick ? 9 : 6);

    for (let i = 0; i < count; i += 1) {
      const icon = document.createElement('span');
      icon.className = 'logo-burst-icon';
      icon.innerHTML = Math.random() > 0.45 ? HEART_SVG : THUMB_SVG;

      const angle = Math.random() * Math.PI * 2;
      const baseDist = isHero ? 120 : 55;
      const spread = isHero ? 110 : 65;
      const distance = baseDist + Math.random() * spread;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const baseSize = isHero ? 22 : 14;
      const sizeSpread = isHero ? 14 : 8;
      const size = baseSize + Math.random() * sizeSpread;
      const rot = (Math.random() - 0.5) * 70;
      const minDur = isHero ? 2000 : 1600;
      const maxDur = isHero ? 3000 : 2400;
      const duration = minDur + Math.random() * (maxDur - minDur);

      icon.style.setProperty('--size', `${size}px`);
      icon.style.width = `${size}px`;
      icon.style.height = `${size}px`;

      container.appendChild(icon);
      animateBurstIcon(icon, dx, dy, rot, duration, size / 2);
    }
  }

  function initLogoSphere() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const maxTilt = 14;

    document.querySelectorAll('.logo-sphere').forEach((sphere) => {
      const inner = sphere.querySelector('.logo-sphere__inner');
      if (!inner) return;

      let hoverBurstDone = false;

      function setTilt(clientX, clientY) {
        const rect = sphere.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const px = (clientX - cx) / (rect.width / 2);
        const py = (clientY - cy) / (rect.height / 2);
        const tiltY = px * maxTilt;
        const tiltX = -py * maxTilt;

        sphere.style.setProperty('--tilt-x', `${tiltX}deg`);
        sphere.style.setProperty('--tilt-y', `${tiltY}deg`);
      }

      function resetTilt() {
        sphere.style.setProperty('--tilt-x', '0deg');
        sphere.style.setProperty('--tilt-y', '0deg');
        sphere.style.setProperty('--lift', '0px');
      }

      sphere.addEventListener('mouseenter', () => {
        sphere.style.setProperty('--lift', '12px');
        if (!hoverBurstDone) {
          spawnLogoBurst(sphere);
          hoverBurstDone = true;
        }
      });

      sphere.addEventListener('mousemove', (e) => {
        setTilt(e.clientX, e.clientY);
      });

      sphere.addEventListener('mouseleave', () => {
        resetTilt();
        hoverBurstDone = false;
      });

      sphere.addEventListener('click', (e) => {
        e.preventDefault();
        spawnLogoBurst(sphere, 'click');
        sphere.blur();
      });

      sphere.addEventListener('focusin', () => {
        sphere.style.setProperty('--lift', '8px');
        sphere.style.setProperty('--tilt-x', '-4deg');
        sphere.style.setProperty('--tilt-y', '6deg');
        if (!hoverBurstDone) {
          spawnLogoBurst(sphere);
          hoverBurstDone = true;
        }
      });

      sphere.addEventListener('focusout', () => {
        resetTilt();
        hoverBurstDone = false;
      });
    });
  }

  function initCasesCarousel() {
    const carousel = document.querySelector('.cases-carousel');
    if (!carousel) return;

    const blocks = carousel.querySelectorAll('.case-block');
    const thumbs = carousel.querySelectorAll('.cases-carousel__thumb');
    const countEl = carousel.querySelector('.cases-carousel__count');
    const prevBtn = carousel.querySelector('.cases-carousel__arrow--prev');
    const nextBtn = carousel.querySelector('.cases-carousel__arrow--next');
    let current = 0;

    function pad(n) {
      return String(n + 1).padStart(2, '0');
    }

    function goTo(index) {
      current = (index + blocks.length) % blocks.length;

      blocks.forEach((block, i) => {
        block.classList.toggle('is-active', i === current);
      });

      thumbs.forEach((thumb, i) => {
        thumb.classList.toggle('is-active', i === current);
      });

      if (countEl) {
        countEl.textContent = `${pad(current)}/${String(blocks.length).padStart(2, '0')}`;
      }
    }

    thumbs.forEach((thumb) => {
      thumb.addEventListener('click', () => {
        goTo(Number(thumb.dataset.case));
      });
    });

    prevBtn?.addEventListener('click', () => goTo(current - 1));
    nextBtn?.addEventListener('click', () => goTo(current + 1));
  }

  function initHeroGallery() {
    const gallery = document.querySelector('.hero-mosaic__gallery');
    if (!gallery) return;

    const cards = gallery.querySelectorAll('.hero-gallery-card');
    const countEl = gallery.querySelector('.hero-gallery__count');
    const prevBtn = gallery.querySelector('.hero-gallery__arrow:first-of-type');
    const nextBtn = gallery.querySelector('.hero-gallery__arrow:last-of-type');
    let current = 0;

    function update() {
      cards.forEach((card, i) => {
        card.style.opacity = i === current ? '1' : '0.45';
        card.style.transform = i === current ? 'scale(1)' : 'scale(0.96)';
      });

      if (countEl) countEl.textContent = `${current + 1}/${cards.length}`;
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current === cards.length - 1;
    }

    cards.forEach((card, i) => {
      card.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      card.addEventListener('click', () => {
        current = i;
        update();
      });
    });

    prevBtn?.addEventListener('click', () => {
      if (current > 0) {
        current -= 1;
        update();
      }
    });

    nextBtn?.addEventListener('click', () => {
      if (current < cards.length - 1) {
        current += 1;
        update();
      }
    });

    update();
  }

  function initSignalsChecklist() {
    const canvas = document.querySelector('.signals-canvas');
    if (!canvas) return;

    const inputs = [...canvas.querySelectorAll('.signals-check__input')];
    const countEl = canvas.querySelector('[data-signals-count]');
    const fillEl = canvas.querySelector('[data-signals-fill]');
    const progressEl = canvas.querySelector('[data-signals-progress]');
    const hintEl = canvas.querySelector('[data-signals-hint]');
    const ctaEl = canvas.querySelector('[data-signals-cta]');

    const hints = [
      'Нажмите на карточки — отметьте знакомые ситуации',
      'Есть зоны роста — это нормальный этап',
      'Маркетинг даёт сбои — время системного подхода',
      'Сигнал усиливается — пора подключать штаб',
      'Критическая зона — нужна внешняя команда',
      'Максимальный сигнал — давайте разберёмся вместе',
    ];

    function getCount() {
      return inputs.filter((input) => input.checked).length;
    }

    function update() {
      const count = getCount();
      const percent = (count / inputs.length) * 100;

      if (countEl) {
        countEl.textContent = String(count);
        countEl.classList.remove('is-pulse');
        void countEl.offsetWidth;
        if (count > 0) countEl.classList.add('is-pulse');
      }

      if (fillEl) fillEl.style.width = `${percent}%`;
      if (progressEl) progressEl.setAttribute('aria-valuenow', String(count));

      if (hintEl) {
        const hintIndex = count === 0 ? 0 : Math.min(count, hints.length - 1);
        hintEl.textContent = hints[hintIndex];
        hintEl.classList.toggle('is-hot', count >= 3);
      }

      if (ctaEl) {
        ctaEl.hidden = count < 3;
      }
    }

    inputs.forEach((input) => {
      input.addEventListener('change', update);
    });

    update();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initBurger();
    initRevealStagger();
    initScrollReveal();
    initScrollSpy();
    initHeaderScroll();
    initPressEffect();
    initTilePulse();
    initSmoothAnchors();
    initContactForm();
    initLogoSphere();
    initCasesCarousel();
    initHeroGallery();
    initSignalsChecklist();
  });
})();
