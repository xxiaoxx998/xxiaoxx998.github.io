(() => {
  if (window.__duckMinimalUI) return;
  window.__duckMinimalUI = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function initProgress() {
    const bar = document.createElement('div');
    bar.className = 'site-progress-bar';
    document.body.appendChild(bar);

    const update = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  }

  function initCategoryToggle() {
    const nav = document.querySelector('.category-nav');
    const toggle = document.getElementById('category-toggle');
    if (!nav || !toggle) return;

    toggle.addEventListener('click', () => {
      const collapsed = nav.classList.toggle('is-collapsed');
      toggle.textContent = collapsed ? 'Show' : 'Hide';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });
  }

  function initArticleCards() {
    const cards = [...document.querySelectorAll('.article-card')];
    if (!cards.length) return;

    cards.forEach(card => {
      card.addEventListener('click', event => {
        if (event.target.closest('a')) return;
        const link = card.querySelector('.article-card-link');
        if (link) link.click();
      });
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
      cards.forEach(card => card.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    cards.forEach(card => observer.observe(card));
  }

  function initCodeCopy() {
    document.querySelectorAll('figure.highlight').forEach(block => {
      const code = block.querySelector('td.code pre, pre');
      if (!code || block.querySelector('.copy-code-button')) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'copy-code-button';
      button.textContent = 'Copy';
      button.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(code.innerText.trim());
          button.textContent = 'Copied';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 1400);
        } catch {
          button.textContent = 'Failed';
          setTimeout(() => {
            button.textContent = 'Copy';
          }, 1400);
        }
      });

      block.appendChild(button);
    });
  }

  function initHeaderState() {
    const header = document.querySelector('.header');
    if (!header) return;

    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initProgress();
    initCategoryToggle();
    initArticleCards();
    initCodeCopy();
    initHeaderState();
  });
})();
