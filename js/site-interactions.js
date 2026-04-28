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

  function initHeaderSearch() {
    const target = document.querySelector('.site-nav-right') || document.querySelector('.site-brand-container');
    if (!target || document.querySelector('.quick-search-trigger')) return;

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'quick-search-trigger';
    trigger.setAttribute('aria-label', 'Search articles');
    trigger.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';
    target.appendChild(trigger);

    const panel = document.createElement('div');
    panel.className = 'quick-search-panel';
    panel.innerHTML = `
      <input type="search" placeholder="Search articles" aria-label="Search articles">
      <div class="quick-search-count"></div>
    `;
    document.body.appendChild(panel);

    const input = panel.querySelector('input');
    const count = panel.querySelector('.quick-search-count');
    const cards = [...document.querySelectorAll('.article-card')];

    const setCount = value => {
      if (!cards.length) {
        count.textContent = 'Open the home page to search the latest articles.';
        return;
      }
      const visible = cards.filter(card => !card.classList.contains('is-hidden')).length;
      count.textContent = value ? `${visible} result${visible === 1 ? '' : 's'}` : 'Type to filter the latest articles.';
    };

    const filter = () => {
      const value = input.value.trim().toLowerCase();
      cards.forEach(card => {
        const haystack = card.textContent.toLowerCase();
        card.classList.toggle('is-hidden', Boolean(value) && !haystack.includes(value));
      });
      setCount(value);
    };

    trigger.addEventListener('click', () => {
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) {
        setCount(input.value.trim());
        input.focus();
      }
    });

    input.addEventListener('input', filter);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        panel.classList.remove('is-open');
        trigger.focus();
      }
    });

    document.addEventListener('click', event => {
      if (panel.contains(event.target) || trigger.contains(event.target)) return;
      panel.classList.remove('is-open');
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
    initHeaderSearch();
    initArticleCards();
    initCodeCopy();
    initHeaderState();
  });
})();
