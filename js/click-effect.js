// 鼠标点击特效：彩色树叶粒子
document.addEventListener('click', function(e) {
  // 树叶颜色数组（绿色、黄色、红色系）
  const colors = [
    'rgba(76, 175, 80, 0.8)',   // 绿色
    'rgba(102, 187, 106, 0.8)', // 浅绿色
    'rgba(255, 193, 7, 0.8)',   // 黄色
    'rgba(255, 152, 0, 0.8)',   // 橙黄色
    'rgba(244, 67, 54, 0.8)',   // 红色
    'rgba(233, 30, 99, 0.8)'    // 粉红色（偏红）
  ];

  // 生成5片树叶
  for (let i = 0; i < 5; i++) {
    const leaf = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 15 + 10; // 树叶大小：10-25px

    // 树叶样式（通过border-radius和transform模拟树叶形状）
    leaf.style.cssText = `
      position: fixed;
      width: ${size}px;
      height: ${size * 1.2}px; /* 高度略大于宽度，更像树叶 */
      background: ${color};
      border-radius: 10% 70% 30% 60% / 60% 30% 70% 40%; /* 不规则圆角模拟树叶轮廓 */
      transform: rotate(${Math.random() * 360}deg); /* 随机旋转角度 */
      pointer-events: none;
      z-index: 9999;
      animation: leafFall ${Math.random() * 1.5 + 1.5}s ease-in-out; /* 飘落动画 */
    `;

    // 定位到点击位置
    leaf.style.left = `${e.clientX}px`;
    leaf.style.top = `${e.clientY}px`;

    // 随机飘落方向（左右+向下）
    const dirX = (Math.random() - 0.5) * 150; // 左右偏移：-75到75px
    const dirY = Math.random() * 150 + 50;    // 向下偏移：50到200px
    leaf.style.setProperty('--dirX', `${dirX}px`);
    leaf.style.setProperty('--dirY', `${dirY}px`);

    document.body.appendChild(leaf);

    // 动画结束后移除元素
    setTimeout(() => {
      leaf.remove();
    }, 3000);
  }
});

// 定义树叶飘落动画
const style = document.createElement('style');
style.textContent = `
  @keyframes leafFall {
    0% {
      opacity: 1;
      transform: rotate(0deg) translate(0, 0);
    }
    100% {
      opacity: 0;
      transform: rotate(360deg) translate(var(--dirX), var(--dirY)); /* 旋转+飘落 */
    }
  }
`;
document.head.appendChild(style);

<script src="https://giscus.app/client.js"
        data-repo="jachinzhang1/jachinzhang1.github.io"
        data-repo-id="R_kgDONy_q0w"
        data-category="Announcements"
        data-category-id="DIC_kwDONy_q084Cmo0P"
        data-mapping="title"
        data-strict="0"
        data-reactions-enabled="1"
        data-emit-metadata="0"
        data-input-position="top"
        data-theme="preferred_color_scheme"
        data-lang="zh-CN"
        data-loading="lazy"
        crossorigin="anonymous"
        async>
</script>