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

  function initPoemsPage() {
    const page = document.querySelector('.poems-page');
    if (!page) return;

    const cards = [...page.querySelectorAll('.poem-card')];
    const search = page.querySelector('#poem-search');
    const filterButtons = [...page.querySelectorAll('[data-poem-filter]')];
    const tagButtons = [...page.querySelectorAll('[data-poem-tag]')];
    const viewButtons = [...page.querySelectorAll('[data-poem-view]')];
    const empty = page.querySelector('.poem-empty');
    let activeFilter = 'all';

    const normalize = value => (value || '').toString().trim().toLowerCase();

    const applyFilter = () => {
      const query = normalize(search && search.value);
      let visible = 0;

      cards.forEach(card => {
        const haystack = normalize(card.dataset.search);
        const category = card.dataset.category;
        const favorite = card.dataset.favorite === 'true' || card.classList.contains('is-liked');
        const matchesQuery = !query || haystack.includes(query);
        const matchesFilter = activeFilter === 'all' || category === activeFilter || (activeFilter === 'favorite' && favorite) || haystack.includes(normalize(activeFilter));
        const show = matchesQuery && matchesFilter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });

      if (empty) empty.classList.toggle('is-visible', visible === 0);
    };

    if (search) search.addEventListener('input', applyFilter);

    filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.poemFilter;
        filterButtons.forEach(item => item.classList.toggle('is-active', item === button));
        tagButtons.forEach(item => item.classList.remove('is-active'));
        applyFilter();
      });
    });

    tagButtons.forEach(button => {
      button.addEventListener('click', () => {
        activeFilter = button.dataset.poemTag;
        tagButtons.forEach(item => item.classList.toggle('is-active', item === button));
        filterButtons.forEach(item => item.classList.remove('is-active'));
        applyFilter();
      });
    });

    viewButtons.forEach(button => {
      button.addEventListener('click', () => {
        const immersive = button.dataset.poemView === 'immersive';
        page.classList.toggle('is-immersive', immersive);
        viewButtons.forEach(item => item.classList.toggle('is-active', item === button));
      });
    });

    cards.forEach(card => {
      const expand = card.querySelector('.poem-expand');
      const like = card.querySelector('.poem-like');
      const bookmark = card.querySelector('.poem-bookmark');
      const read = card.querySelector('.poem-read');
      const title = card.querySelector('h2');
      const full = card.querySelector('.poem-full') || card.querySelector('.poem-excerpt');

      if (expand) {
        expand.addEventListener('click', () => {
          const expanded = card.classList.toggle('is-expanded');
          expand.querySelector('span').textContent = expanded ? '收起全文' : '展开全文';
        });
      }

      const toggleLike = () => {
        const active = card.classList.toggle('is-liked');
        card.dataset.favorite = active ? 'true' : 'false';
        if (like) like.classList.toggle('is-active', active);
        if (bookmark) bookmark.classList.toggle('is-active', active);
        applyFilter();
      };

      if (like) like.addEventListener('click', toggleLike);
      if (bookmark) bookmark.addEventListener('click', toggleLike);

      if (read) {
        read.addEventListener('click', () => {
          if (!('speechSynthesis' in window)) return;
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(`${title ? title.textContent : ''}。${full ? full.textContent : ''}`);
          utterance.lang = 'zh-CN';
          window.speechSynthesis.speak(utterance);
        });
      }
    });

    applyFilter();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initProgress();
    initCategoryToggle();
    initHeaderSearch();
    initArticleCards();
    initCodeCopy();
    initHeaderState();
    initPoemsPage();
  });
})();
