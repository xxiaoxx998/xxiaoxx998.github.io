(() => {
  if (window.__duckMinimalUI) return;
  window.__duckMinimalUI = true;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function readStorage(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // localStorage can be unavailable in private or restricted contexts.
    }
  }

  function normalize(value) {
    return (value || '').toString().trim().toLowerCase();
  }

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
    trigger.setAttribute('aria-label', '搜索文章');
    trigger.title = '搜索文章';
    trigger.innerHTML = '<i class="fa fa-search" aria-hidden="true"></i>';
    target.appendChild(trigger);

    const panel = document.createElement('div');
    panel.className = 'quick-search-panel';
    panel.innerHTML = `
      <input type="search" placeholder="搜索文章、分类或标签" aria-label="搜索文章">
      <div class="quick-search-count"></div>
      <div class="quick-search-results"></div>
    `;
    document.body.appendChild(panel);

    const input = panel.querySelector('input');
    const count = panel.querySelector('.quick-search-count');
    const results = panel.querySelector('.quick-search-results');
    let searchData = null;

    const fallbackCards = [...document.querySelectorAll('.article-card')].map(card => {
      const link = card.querySelector('.article-card-link');
      const title = card.querySelector('h3');
      const date = card.querySelector('.article-date');
      return {
        title: title ? title.textContent.trim() : '未命名',
        path: link ? link.getAttribute('href') : '#',
        date: date ? date.textContent.trim() : '',
        categories: [...card.querySelectorAll('.article-categories span')].map(item => item.textContent.trim()),
        tags: [],
        excerpt: ''
      };
    });

    const loadSearchData = async () => {
      if (searchData) return searchData;
      try {
        const response = await fetch('/search.json', { cache: 'no-store' });
        if (!response.ok) throw new Error('search json not available');
        searchData = await response.json();
      } catch {
        searchData = fallbackCards;
      }
      return searchData;
    };

    const render = async () => {
      const value = normalize(input.value);
      const data = await loadSearchData();
      const matches = value
        ? data.filter(item => normalize([
          item.title,
          item.date,
          (item.categories || []).join(' '),
          (item.tags || []).join(' '),
          item.excerpt
        ].join(' ')).includes(value)).slice(0, 8)
        : data.slice(0, 6);

      count.textContent = value ? `找到 ${matches.length} 条结果` : '输入关键词，快速跳到文章';
      results.innerHTML = matches.length
        ? matches.map(item => `
          <a class="quick-search-result" href="${item.path}">
            <strong>${item.title}</strong>
            <span>${[item.date, ...(item.categories || [])].filter(Boolean).join(' · ')}</span>
            ${item.excerpt ? `<em>${item.excerpt}</em>` : ''}
          </a>
        `).join('')
        : '<div class="quick-search-empty">没有找到匹配内容</div>';
    };

    trigger.addEventListener('click', async () => {
      panel.classList.toggle('is-open');
      if (panel.classList.contains('is-open')) {
        input.focus();
        await render();
      }
    });

    input.addEventListener('input', render);

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

  function initPostTools() {
    const body = document.querySelector('.main-post .post-body');
    const header = document.querySelector('.main-post .post-header');
    if (!body || !header || document.querySelector('.post-reading-tools')) return;

    const tools = document.createElement('div');
    tools.className = 'post-reading-tools';
    tools.innerHTML = `
      <button type="button" data-post-font="smaller" aria-label="减小字号" title="减小字号"><i class="fa fa-minus"></i></button>
      <button type="button" data-post-font="larger" aria-label="增大字号" title="增大字号"><i class="fa fa-plus"></i></button>
      <button type="button" data-post-copy aria-label="复制链接" title="复制链接"><i class="fa fa-link"></i></button>
    `;
    header.after(tools);

    tools.querySelector('[data-post-font="larger"]').addEventListener('click', () => {
      body.classList.add('is-large-text');
    });

    tools.querySelector('[data-post-font="smaller"]').addEventListener('click', () => {
      body.classList.remove('is-large-text');
    });

    tools.querySelector('[data-post-copy]').addEventListener('click', async event => {
      const button = event.currentTarget;
      try {
        await navigator.clipboard.writeText(window.location.href);
        button.classList.add('is-copied');
        setTimeout(() => button.classList.remove('is-copied'), 1200);
      } catch {
        button.classList.remove('is-copied');
      }
    });
  }

  function initPoemsPage() {
    const page = document.querySelector('.poems-page');
    if (!page) return;

    const cards = [...page.querySelectorAll('.poem-card')];
    const search = page.querySelector('#poem-search');
    const filterButtons = [...page.querySelectorAll('[data-poem-filter]')];
    const tagButtons = [...page.querySelectorAll('[data-poem-tag]')];
    const viewButtons = [...page.querySelectorAll('[data-poem-view]')];
    const randomButton = page.querySelector('[data-poem-random]');
    const empty = page.querySelector('.poem-empty');
    const storedFavorites = readStorage('duck-poem-favorites', {});
    let activeFilter = 'all';

    const syncFavoriteUI = card => {
      const id = card.dataset.poemId;
      const active = storedFavorites[id] ?? (card.dataset.favorite === 'true');
      card.dataset.favorite = active ? 'true' : 'false';
      card.classList.toggle('is-liked', active);
      card.querySelectorAll('.poem-like, .poem-bookmark').forEach(button => {
        button.classList.toggle('is-active', active);
      });
    };

    const applyFilter = () => {
      const query = normalize(search && search.value);
      let visible = 0;

      cards.forEach(card => {
        const haystack = normalize(card.dataset.search);
        const category = card.dataset.category;
        const favorite = card.dataset.favorite === 'true';
        const matchesQuery = !query || haystack.includes(query);
        const matchesFilter = activeFilter === 'all' || category === activeFilter || (activeFilter === 'favorite' && favorite) || haystack.includes(normalize(activeFilter));
        const show = matchesQuery && matchesFilter;
        card.classList.toggle('is-hidden', !show);
        if (show) visible += 1;
      });

      if (empty) empty.classList.toggle('is-visible', visible === 0);
    };

    cards.forEach(syncFavoriteUI);

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

    if (randomButton) {
      randomButton.addEventListener('click', () => {
        const visibleCards = cards.filter(card => !card.classList.contains('is-hidden'));
        const pool = visibleCards.length ? visibleCards : cards;
        const card = pool[Math.floor(Math.random() * pool.length)];
        if (!card) return;
        card.classList.add('is-featured-now');
        card.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
        setTimeout(() => card.classList.remove('is-featured-now'), 1600);
      });
    }

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
          const label = expand.querySelector('span');
          if (label) label.textContent = expanded ? '收起全文' : '展开全文';
        });
      }

      const toggleLike = () => {
        const id = card.dataset.poemId;
        const active = !(card.dataset.favorite === 'true');
        storedFavorites[id] = active;
        writeStorage('duck-poem-favorites', storedFavorites);
        syncFavoriteUI(card);
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
    initPostTools();
    initPoemsPage();
  });
})();
