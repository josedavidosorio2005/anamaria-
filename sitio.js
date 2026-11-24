(() => {
  const menu = document.getElementById('mobile-nav');
  const trigger = menu.querySelector('summary');

  menu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menu.open = false;
      document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
    });
  });

  document.addEventListener('click', event => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !menu.open) return;
    menu.open = false;
    trigger.focus();
  });

  window.addEventListener('resize', () => {
    if (menu.open && trigger.getClientRects().length === 0) menu.open = false;
  });

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const photo = document.querySelector('.hero-media');
  let photoFrame = 0;

  photo.addEventListener('pointermove', event => {
    if (motion.matches || !pointer.matches || event.pointerType !== 'mouse' || photoFrame) return;
    photoFrame = requestAnimationFrame(() => {
      const { left, top, width, height } = photo.getBoundingClientRect();
      const x = (event.clientX - left - width / 2) * .03;
      const y = (event.clientY - top - height / 2) * .03;
      photo.style.setProperty('--photo-x', `${x}px`);
      photo.style.setProperty('--photo-y', `${y}px`);
      photoFrame = 0;
    });
  }, { passive: true });

  photo.addEventListener('pointerleave', () => {
    cancelAnimationFrame(photoFrame);
    photoFrame = 0;
    photo.style.removeProperty('--photo-x');
    photo.style.removeProperty('--photo-y');
  });

  if (motion.matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.replace('reveal-pending', 'reveal-visible');
      observer.unobserve(target);
    }
  }, { rootMargin: '0px 0px -24px' });

  for (const element of document.querySelectorAll('[data-reveal]')) {
    if (element.getBoundingClientRect().top < window.innerHeight) continue;
    element.classList.add('reveal-pending');
    observer.observe(element);
  }
})();
