// 鼠标点击特效：文字 + 粒子扩散
document.addEventListener('click', function(e) {
  // 文字特效（可选，如“富强”“民主”等，可自定义）
  const texts = ['富强', '民主', '文明', '和谐', '自由', '平等', '公正', '法治', '爱国', '敬业', '诚信', '友善'];
  const text = texts[Math.floor(Math.random() * texts.length)];
  const el = document.createElement('span');
  el.textContent = text;
  el.style.cssText = `
    position: fixed;
    color: #ff6b6b;
    font-size: 16px;
    pointer-events: none;
    z-index: 9999;
    animation: clickEffect 1s ease-out;
  `;
  // 定位到点击位置
  el.style.left = `${e.clientX - 10}px`;
  el.style.top = `${e.clientY - 20}px`;
  document.body.appendChild(el);
  
  // 自动移除元素
  setTimeout(() => {
    el.remove();
  }, 1000);

  // 粒子特效（可选，围绕点击位置生成小圆点）
  for (let i = 0; i < 5; i++) {
    const dot = document.createElement('span');
    dot.style.cssText = `
      position: fixed;
      width: ${Math.random() * 10 + 5}px;
      height: ${Math.random() * 10 + 5}px;
      background: rgba(255, 107, 107, 0.8);
      border-radius: 50%;
      pointer-events: none;
      z-index: 9999;
      animation: dotEffect ${Math.random() * 0.5 + 0.5}s ease-out;
    `;
    dot.style.left = `${e.clientX}px`;
    dot.style.top = `${e.clientY}px`;
    // 随机扩散方向
    dot.style.transform = `translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px)`;
    document.body.appendChild(dot);
    setTimeout(() => {
      dot.remove();
    }, 1000);
  }
});

// 定义动画（需添加到CSS中，或直接写在style里）
const style = document.createElement('style');
style.textContent = `
  @keyframes clickEffect {
    0% { opacity: 1; transform: translateY(0); }
    100% { opacity: 0; transform: translateY(-20px); }
  }
  @keyframes dotEffect {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.1) translate(var(--x), var(--y)); }
  }
`;
document.head.appendChild(style);