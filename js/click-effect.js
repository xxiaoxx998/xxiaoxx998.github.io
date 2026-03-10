// 鼠标点击特效：彩色树叶粒子 + 堆积效果
(() => {
  // 创建底部堆叠容器
  const floor = document.createElement('div');
  floor.id = 'leaf-floor';
  document.body.appendChild(floor);

  const colors = [
    'rgba(76, 175, 80, 0.85)',   // 绿色
    'rgba(102, 187, 106, 0.85)', // 浅绿色
    'rgba(255, 193, 7, 0.85)',   // 黄色
    'rgba(255, 152, 0, 0.85)',   // 橙黄色
    'rgba(244, 67, 54, 0.85)',   // 红色
    'rgba(233, 30, 99, 0.85)'    // 粉红色
  ];

  const columns = 12;
  const columnHeights = new Array(columns).fill(0);
  const maxPileHeight = 120; // 最大堆高

  const getColumnIndex = x => {
    const colW = window.innerWidth / columns;
    return Math.min(columns - 1, Math.max(0, Math.floor(x / colW)));
  };

  const getFallDistance = y => Math.max(window.innerHeight - y + 40, 160);

  document.addEventListener('click', function (e) {
    // 生成 5 片树叶
    for (let i = 0; i < 5; i++) {
      const leaf = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 16 + 10; // 10-26px

      // 随机旋转、抖动
      const rotate = Math.random() * 360;
      const sway = (Math.random() - 0.5) * 60; // 左右摆动幅度

      leaf.className = 'leaf-particle';
      const fallDistance = getFallDistance(e.clientY);

      leaf.style.cssText = `
        width: ${size}px;
        height: ${size * 1.25}px;
        background: ${color};
        border-radius: 18% 72% 35% 65% / 60% 25% 75% 40%;
        transform: rotate(${rotate}deg);
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        --sway: ${sway}px;
        --fall-distance: ${fallDistance}px;
        --fall-duration: ${Math.random() * 1.5 + 2.8}s;
        --fall-delay: ${Math.random() * 0.1}s;
      `;

      document.body.appendChild(leaf);

      // 结束后落到堆积区
      leaf.addEventListener('animationend', () => {
        const col = getColumnIndex(e.clientX);
        const offset = columnHeights[col];
        columnHeights[col] = Math.min(columnHeights[col] + size * 0.75, maxPileHeight);

        leaf.style.position = 'absolute';
        leaf.style.top = 'auto';
        leaf.style.bottom = `${offset}px`;
        leaf.style.left = `${Math.min(Math.max(e.clientX + sway * 0.7, 10), window.innerWidth - size - 10)}px`;
        leaf.style.transform = `rotate(${rotate + (Math.random() * 40 - 20)}deg)`;
        leaf.style.animation = 'none';
        leaf.style.transition = 'transform 0.4s ease, bottom 0.4s ease, opacity 1s ease';
        leaf.style.opacity = '0.95';
        leaf.classList.add('leaf-landed');

        // 10s 后渐隐并移除
        setTimeout(() => {
          leaf.style.opacity = '0';
          setTimeout(() => leaf.remove(), 1000);
        }, 10000);

        // 维护堆高，不超过最大高度（缓慢回落）
        if (columnHeights[col] >= maxPileHeight) {
          columnHeights[col] = Math.max(columnHeights[col] - size * 0.4, maxPileHeight * 0.6);
        }

        floor.appendChild(leaf);
      });

      // 保护性清理：如果叶子动画未完成但已存在于页面太久，则移除
      setTimeout(() => {
        if (leaf.parentNode && leaf.parentNode !== floor) {
          leaf.remove();
        }
      }, 15000);
    }
  });

  // 定义树叶飘落动画 + 堆栈样式
  const style = document.createElement('style');
  style.textContent = `
    #leaf-floor {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      height: 120px;
      pointer-events: none;
      overflow: visible;
      z-index: 9998;
    }

    .leaf-particle {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      animation: leafFloat var(--fall-duration) ease-in var(--fall-delay) forwards;
    }

    .leaf-landed {
      opacity: 0.95;
    }

    @keyframes leafFloat {
      0% {
        opacity: 1;
        transform: translate(0, 0) rotate(0deg);
      }
      30% {
        transform: translate(calc(var(--sway) * 0.7), 40px) rotate(70deg);
      }
      60% {
        transform: translate(calc(var(--sway) * 0.4), 80px) rotate(140deg);
      }
      90% {
        transform: translate(calc(var(--sway) * 0.2), var(--fall-distance)) rotate(220deg);
        opacity: 0.6;
      }
      100% {
        opacity: 0.5;
        transform: translate(calc(var(--sway) * 0.1), var(--fall-distance)) rotate(260deg);
      }
    }
  `;
  document.head.appendChild(style);
})();

