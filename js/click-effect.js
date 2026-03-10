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

  let pileCount = 0;
  const maxPile = 40;

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
      leaf.style.cssText = `
        width: ${size}px;
        height: ${size * 1.25}px;
        background: ${color};
        border-radius: 18% 72% 35% 65% / 60% 25% 75% 40%;
        transform: rotate(${rotate}deg);
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        --sway: ${sway}px;
        --fall-duration: ${Math.random() * 1.2 + 1.4}s;
        --fall-delay: ${Math.random() * 0.15}s;
      `;

      document.body.appendChild(leaf);

      // 结束后落到堆积区
      leaf.addEventListener('animationend', () => {
        // 计算堆积位置
        pileCount = Math.min(pileCount + 1, maxPile);
        const offset = pileCount * 1.8; // 堆高

        leaf.style.position = 'absolute';
        leaf.style.top = 'auto';
        leaf.style.bottom = `${offset}px`;
        leaf.style.left = `${Math.min(Math.max(e.clientX + sway * 0.7, 10), window.innerWidth - size - 10)}px`;
        leaf.style.transform = `rotate(${rotate + (Math.random() * 40 - 20)}deg)`;
        leaf.style.animation = 'none';
        leaf.style.transition = 'transform 0.4s ease, bottom 0.4s ease, opacity 1s ease';
        leaf.style.opacity = '0.95';
        leaf.classList.add('leaf-landed');

        // 保持堆积：当堆叠过高时，逐渐清理最早的叶片
        if (pileCount >= maxPile) {
          const oldest = floor.querySelector('.leaf-landed');
          if (oldest) {
            oldest.style.transition = 'opacity 1s ease';
            oldest.style.opacity = '0';
            setTimeout(() => oldest.remove(), 1000);
          }
        }

        floor.appendChild(leaf);
      });

      // 移除过旧的叶子，避免内存累积
      setTimeout(() => {
        if (leaf.parentNode && leaf.parentNode !== floor) {
          leaf.remove();
        }
      }, 7000);
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
      40% {
        transform: translate(var(--sway), 40px) rotate(80deg);
      }
      70% {
        transform: translate(calc(var(--sway) * 0.6), 90px) rotate(160deg);
      }
      100% {
        opacity: 0.4;
        transform: translate(calc(var(--sway) * 0.3), 160px) rotate(260deg);
      }
    }
  `;
  document.head.appendChild(style);
})();

