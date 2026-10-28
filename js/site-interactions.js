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

  function initSchedulePage() {
    const page = document.querySelector('.schedule-page');
    if (!page) return;

    const monthTitle = page.querySelector('[data-schedule-month]');
    const days = page.querySelector('[data-schedule-days]');
    const select = page.querySelector('[data-schedule-select]');
    const detailDate = page.querySelector('[data-schedule-date]');
    const detailCount = page.querySelector('[data-schedule-count]');
    const tasks = page.querySelector('[data-schedule-tasks]');
    const form = page.querySelector('[data-schedule-form]');
    const taskProjectSelect = page.querySelector('[data-schedule-project-select]');
    const constellationProjectSelect = page.querySelector('[data-constellation-project]');
    const projectForm = page.querySelector('[data-schedule-project-form]');
    const completedDays = page.querySelector('[data-schedule-completed-days]');
    const completedTasks = page.querySelector('[data-schedule-completed-tasks]');
    const streak = page.querySelector('[data-schedule-streak]');
    const constellationStage = page.querySelector('[data-constellation-stage]');
    const constellationLines = page.querySelector('[data-constellation-lines]');
    const constellationNodes = page.querySelector('[data-constellation-nodes]');
    const constellationDetail = page.querySelector('[data-constellation-detail]');
    const constellationCore = page.querySelector('[data-constellation-core]');
    const constellationProgress = page.querySelector('[data-constellation-progress]');
    const now = new Date();
    const todayKey = dateKey(now);
    const records = readStorage('duck-schedule-records', {});
    const defaultProject = { id: 'daily', name: '日常事项' };
    const projects = readStorage('duck-schedule-projects', []).filter(project => project && project.id && project.name);
    let activeMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    let activeDate = todayKey;
    let selectedStarKey = '';
    let selectedProjectId = defaultProject.id;
    let taskProjectId = defaultProject.id;

    function dateKey(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    function parseDate(key) {
      const [year, month, day] = key.split('-').map(Number);
      return new Date(year, month - 1, day);
    }

    function formatMonth(date) {
      return `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
    }

    function formatDate(key) {
      return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' }).format(parseDate(key));
    }

    function lunarKey(date) {
      const parts = new Intl.DateTimeFormat('en-u-ca-chinese', { month: 'numeric', day: 'numeric' }).formatToParts(date);
      const month = parts.find(part => part.type === 'month');
      const day = parts.find(part => part.type === 'day');
      if (!month || !day) return '';
      return `${month.value.match(/\d+/)?.[0] || ''}-${day.value}`;
    }

    function qingmingDay(year) {
      return Math.floor((year % 100) * 0.2422 + 4.81) - Math.floor((year % 100) / 4);
    }

    function holidayInfo(date) {
      const fixed = {
        '1-1': ['元旦', 'legal'],
        '2-14': ['情人节', 'special'],
        '3-8': ['妇女节', 'special'],
        '3-12': ['植树节', 'special'],
        '5-1': ['劳动节', 'legal'],
        '5-4': ['青年节', 'special'],
        '6-1': ['儿童节', 'special'],
        '9-10': ['教师节', 'special'],
        '10-1': ['国庆节', 'legal'],
        '12-24': ['平安夜', 'special'],
        '12-25': ['圣诞节', 'special']
      };
      const lunar = {
        '1-1': ['春节', 'legal'],
        '1-15': ['元宵节', 'traditional'],
        '5-5': ['端午节', 'legal'],
        '7-7': ['七夕节', 'traditional'],
        '8-15': ['中秋节', 'legal'],
        '9-9': ['重阳节', 'traditional']
      };
      const solar = `${date.getMonth() + 1}-${date.getDate()}`;
      const festivals = [fixed[solar], lunar[lunarKey(date)]];
      if (date.getMonth() === 3 && date.getDate() === qingmingDay(date.getFullYear())) festivals.push(['清明节', 'legal']);
      const active = festivals.filter(Boolean);
      if (!active.length) return null;
      const priority = { legal: 3, traditional: 2, special: 1 };
      const type = active.map(item => item[1]).sort((left, right) => priority[right] - priority[left])[0];
      return { label: active.map(item => item[0]).join('·'), type };
    }

    function getTasks(key) {
      return Array.isArray(records[key]) ? records[key] : [];
    }

    function allProjects() {
      return [defaultProject, ...projects];
    }

    function projectById(id) {
      return allProjects().find(project => project.id === id) || defaultProject;
    }

    function projectIdForTask(task) {
      return projectById(task.projectId).id;
    }

    function renderProjectOptions() {
      const options = allProjects().map(project => `<option value="${project.id}">${escapeHTML(project.name)}</option>`).join('');
      taskProjectSelect.innerHTML = options;
      constellationProjectSelect.innerHTML = options;
      taskProjectId = projectById(taskProjectId).id;
      selectedProjectId = projectById(selectedProjectId).id;
      taskProjectSelect.value = taskProjectId;
      constellationProjectSelect.value = selectedProjectId;
    }

    function save() {
      writeStorage('duck-schedule-records', records);
    }

    function monthKey(date) {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    function updateSummary() {
      const key = monthKey(activeMonth);
      const monthRecords = Object.entries(records).filter(([date]) => date.startsWith(key));
      const allTasks = monthRecords.flatMap(([, items]) => items);
      const doneTasks = allTasks.filter(item => item.done).length;
      const doneDays = monthRecords.filter(([, items]) => items.some(item => item.done)).length;
      let currentStreak = 0;
      const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      while (getTasks(dateKey(cursor)).some(item => item.done)) {
        currentStreak += 1;
        cursor.setDate(cursor.getDate() - 1);
      }
      completedDays.textContent = doneDays;
      completedTasks.textContent = doneTasks;
      streak.textContent = `${currentStreak} 天`;
    }

    function renderDetail() {
      const items = getTasks(activeDate);
      detailDate.textContent = formatDate(activeDate);
      detailCount.textContent = items.length ? `${items.filter(item => item.done).length}/${items.length} 已完成` : '尚未记录';
      tasks.innerHTML = items.length ? items.map((item, index) => `
        <label class="schedule-task${item.done ? ' is-done' : ''}">
          <input type="checkbox" data-schedule-task="${index}"${item.done ? ' checked' : ''}>
          <span>${escapeHTML(item.text)}</span>
          <em class="schedule-task-project-badge">${escapeHTML(projectById(projectIdForTask(item)).name)}</em>
          <button class="schedule-task-remove" type="button" data-schedule-remove="${index}" aria-label="删除事项"><i class="fa fa-times" aria-hidden="true"></i></button>
        </label>
      `).join('') : '<p class="schedule-empty">给今天留下一条轻盈的记录吧。</p>';
    }

    function escapeHTML(value) {
      const element = document.createElement('span');
      element.textContent = value;
      return element.innerHTML;
    }

    function renderConstellation() {
      const project = projectById(selectedProjectId);
      const projectTasks = Object.entries(records)
        .flatMap(([date, items]) => items.map((item, index) => ({
          date,
          index,
          key: `${date}-${index}`,
          text: item.text,
          done: Boolean(item.done),
          projectId: projectIdForTask(item)
        })))
        .filter(item => item.projectId === project.id)
        .sort((left, right) => left.date.localeCompare(right.date));
      const visibleTasks = projectTasks.slice(0, 12);
      const doneCount = projectTasks.filter(item => item.done).length;
      const progress = projectTasks.length ? Math.round(doneCount / projectTasks.length * 100) : 0;
      constellationProgress.textContent = `${progress}%`;
      constellationCore.textContent = projectTasks.length ? `${doneCount}/${projectTasks.length} 完成` : project.name;

      if (!projectTasks.length) {
        constellationLines.innerHTML = '';
        constellationNodes.innerHTML = `<p class="constellation-empty">“${escapeHTML(project.name)}”还没有小任务。添加日程时选择该大任务，每一项都会成为一颗星。</p>`;
        constellationDetail.innerHTML = `
          <span class="constellation-detail-kicker">大任务</span>
          <h3>${escapeHTML(project.name)}</h3>
          <p class="schedule-empty">在日历中添加小任务后，可在这里查看它的日程日期、完成状态与进度。</p>
        `;
        return;
      }

      const matchingTask = projectTasks.find(item => item.key === selectedStarKey);
      const dateTask = projectTasks.find(item => item.date === activeDate);
      const selectedTask = matchingTask || dateTask || projectTasks[0];
      selectedStarKey = selectedTask.key;

      const positionedTasks = visibleTasks.map((item, index) => {
        const angle = -Math.PI / 2 + index * (Math.PI * 2 / visibleTasks.length);
        return {
          ...item,
          x: 50 + Math.cos(angle) * 39,
          y: 50 + Math.sin(angle) * 33
        };
      });
      constellationLines.innerHTML = positionedTasks.map(item => `<line class="${item.done ? 'is-complete' : ''}" x1="50" y1="50" x2="${item.x}" y2="${item.y}"></line>`).join('');
      constellationNodes.innerHTML = positionedTasks.map(item => `
        <button class="constellation-node${item.done ? ' is-complete' : ''}${item.key === selectedStarKey ? ' is-selected' : ''}" type="button" data-constellation-task="${item.key}" data-constellation-date="${item.date}" data-constellation-index="${item.index}" style="--x:${item.x}%;--y:${item.y}%" aria-label="查看任务：${escapeHTML(item.text)}">
          <i class="fa fa-star" aria-hidden="true"></i>
          <span class="constellation-node-label">${escapeHTML(item.text)}</span>
        </button>
      `).join('');
      constellationDetail.innerHTML = `
        <span class="constellation-detail-kicker">任务属性</span>
        <h3>${escapeHTML(selectedTask.text)}</h3>
        <dl class="constellation-attributes">
          <div><dt>日程日期</dt><dd>${formatDate(selectedTask.date)}</dd></div>
          <div><dt>所属大任务</dt><dd>${escapeHTML(project.name)}</dd></div>
          <div><dt>完成状态</dt><dd>${selectedTask.done ? '已完成' : '进行中'}</dd></div>
          <div><dt>任务进度</dt><dd>${selectedTask.done ? '100%' : '0%'}</dd></div>
          <div><dt>星阵节点</dt><dd>${projectTasks.length} 项</dd></div>
        </dl>
        <button class="constellation-status-toggle" type="button" data-constellation-toggle data-constellation-date="${selectedTask.date}" data-constellation-index="${selectedTask.index}">${selectedTask.done ? '标记为未完成' : '标记为完成'}</button>
      `;
    }

    function renderCalendar() {
      renderProjectOptions();
      monthTitle.textContent = formatMonth(activeMonth);
      select.value = monthKey(activeMonth);
      const first = new Date(activeMonth.getFullYear(), activeMonth.getMonth(), 1);
      const leadingDays = (first.getDay() + 6) % 7;
      const dayCount = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 0).getDate();
      const totalCells = Math.ceil((leadingDays + dayCount) / 7) * 7;
      days.innerHTML = Array.from({ length: totalCells }, (_, index) => {
        const day = index - leadingDays + 1;
        if (day < 1 || day > dayCount) return '<span class="schedule-day is-outside" aria-hidden="true"></span>';
        const key = dateKey(new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day));
        const entries = getTasks(key);
        const hasDone = entries.some(item => item.done);
        const holiday = holidayInfo(new Date(activeMonth.getFullYear(), activeMonth.getMonth(), day));
        const marker = entries.length ? `<span class="schedule-day-markers" aria-label="${entries.length} 项任务，${entries.filter(item => item.done).length} 项完成">${entries.map(item => `<i class="schedule-day-marker${item.done ? ' is-complete' : ''}" aria-hidden="true"></i>`).join('')}</span>` : '';
        const festival = holiday ? `<span class="schedule-festival-label">${holiday.label}</span>` : '';
        const description = holiday ? `${key}，${holiday.label}` : key;
        return `<button class="schedule-day${key === activeDate ? ' is-selected' : ''}${key === todayKey ? ' is-today' : ''}${holiday ? ` is-festival is-${holiday.type}` : ''}" type="button" data-schedule-day="${key}" aria-label="${description}">${festival}<span class="schedule-day-number">${day}</span>${marker}</button>`;
      }).join('');
      renderDetail();
      updateSummary();
      renderConstellation();
    }

    const options = [];
    for (let offset = -12; offset <= 12; offset += 1) {
      const optionDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      options.push(`<option value="${monthKey(optionDate)}">${formatMonth(optionDate)}</option>`);
    }
    select.innerHTML = options.join('');

    page.querySelector('[data-schedule-prev]').addEventListener('click', () => {
      activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() - 1, 1);
      activeDate = dateKey(activeMonth);
      renderCalendar();
    });
    page.querySelector('[data-schedule-next]').addEventListener('click', () => {
      activeMonth = new Date(activeMonth.getFullYear(), activeMonth.getMonth() + 1, 1);
      activeDate = dateKey(activeMonth);
      renderCalendar();
    });
    select.addEventListener('change', () => {
      const [year, month] = select.value.split('-').map(Number);
      activeMonth = new Date(year, month - 1, 1);
      activeDate = dateKey(activeMonth);
      renderCalendar();
    });
    days.addEventListener('click', event => {
      const button = event.target.closest('[data-schedule-day]');
      if (!button) return;
      activeDate = button.dataset.scheduleDay;
      renderCalendar();
    });
    taskProjectSelect.addEventListener('change', () => {
      taskProjectId = taskProjectSelect.value;
    });
    constellationProjectSelect.addEventListener('change', () => {
      selectedProjectId = constellationProjectSelect.value;
      selectedStarKey = '';
      renderConstellation();
    });
    projectForm.addEventListener('submit', event => {
      event.preventDefault();
      const input = projectForm.querySelector('input');
      const name = input.value.trim();
      if (!name) return;
      const existing = allProjects().find(project => project.name === name);
      const project = existing || { id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, name };
      if (!existing) {
        projects.push(project);
        writeStorage('duck-schedule-projects', projects);
      }
      selectedProjectId = project.id;
      taskProjectId = project.id;
      selectedStarKey = '';
      input.value = '';
      renderCalendar();
    });
    constellationStage.addEventListener('click', event => {
      const node = event.target.closest('[data-constellation-task]');
      if (!node) return;
      selectedStarKey = node.dataset.constellationTask;
      activeDate = node.dataset.constellationDate;
      renderCalendar();
    });
    constellationDetail.addEventListener('click', event => {
      const button = event.target.closest('[data-constellation-toggle]');
      if (!button) return;
      const date = button.dataset.constellationDate;
      const index = Number(button.dataset.constellationIndex);
      const task = getTasks(date)[index];
      if (!task) return;
      task.done = !task.done;
      activeDate = date;
      save();
      renderCalendar();
    });
    tasks.addEventListener('change', event => {
      const input = event.target.closest('[data-schedule-task]');
      if (!input) return;
      getTasks(activeDate)[Number(input.dataset.scheduleTask)].done = input.checked;
      save();
      renderCalendar();
    });
    tasks.addEventListener('click', event => {
      const button = event.target.closest('[data-schedule-remove]');
      if (!button) return;
      getTasks(activeDate).splice(Number(button.dataset.scheduleRemove), 1);
      if (!getTasks(activeDate).length) delete records[activeDate];
      save();
      renderCalendar();
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      const input = form.querySelector('input');
      const text = input.value.trim();
      if (!text) return;
      if (!records[activeDate]) records[activeDate] = [];
      records[activeDate].push({ text, done: false, projectId: taskProjectId });
      input.value = '';
      save();
      renderCalendar();
    });

    renderCalendar();
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
    initSchedulePage();
  });
})();
