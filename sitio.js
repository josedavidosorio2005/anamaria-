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
  if (motion.matches || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(entries => {
    for (const { target, isIntersecting } of entries) {
      if (!isIntersecting) continue;
      target.classList.replace('reveal-pending', 'reveal-visible');
      observer.unobserve(target);
    }
  }, { rootMargin: '0px 0px 64px' });

  for (const element of document.querySelectorAll('[data-reveal]')) {
    if (element.getBoundingClientRect().top < window.innerHeight + 64) continue;
    element.classList.add('reveal-pending');
    observer.observe(element);
  }
})();
