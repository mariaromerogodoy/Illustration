const DPR = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const canvas = document.getElementById('view');
  const ctx = canvas.getContext('2d');
  const maskCanvas = document.createElement('canvas');
  const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });

  const CONFIG = { count: 5500, size: 8, speed: 1.1, glow: 0 };

  const PALETTE = [
    { h: 305, s: 100, l: 62 }, // neon magenta
    { h: 322, s: 95,  l: 64 }, // hot pink
    { h: 58,  s: 100, l: 63 }, // neon yellow
    { h: 95,  s: 100, l: 56 }, // lime
    { h: 130, s: 90,  l: 55 }, // electric green
    { h: 170, s: 95,  l: 58 }, // aqua/teal
  ];

  function hsla(h,s,l,a){ return `hsl(${h} ${s}% ${l}% / ${a})`; }

  let W=0, H=0, particles=[], maskImg=new Image(), maskReady=false, imageData=null;
  const DEFAULT_IMAGE_URL = 'personn.png';

  function resize() {
    const { innerWidth, innerHeight } = window;
    W = canvas.width = Math.floor(innerWidth * DPR);
    H = canvas.height = Math.floor(innerHeight * DPR);
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(DPR, DPR);
    if (maskReady) placeMaskToCanvas();
  }

  function placeMaskToCanvas() {
    const margin = 0.1;
    const availW = W / DPR * (1 - margin*2);
    const availH = H / DPR * (1 - margin*2);
    const imgW = maskImg.width;
    const imgH = maskImg.height;
    const scale = Math.min(availW / imgW, availH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (W / DPR - drawW) / 2;
    const dy = (H / DPR - drawH) / 2;

    maskCanvas.width = Math.floor(W);
    maskCanvas.height = Math.floor(H);
    maskCtx.setTransform(1,0,0,1,0,0);
    maskCtx.clearRect(0,0,maskCanvas.width, maskCanvas.height);
    maskCtx.save();
    maskCtx.scale(DPR, DPR);
    maskCtx.drawImage(maskImg, dx, dy, drawW, drawH);
    maskCtx.restore();

    imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  }

  function insideMask(x, y) {
    if (!imageData) return false;
    const ix = Math.max(0, Math.min(imageData.width - 1, x|0));
    const iy = Math.max(0, Math.min(imageData.height - 1, y|0));
    const idx = (iy * imageData.width + ix) * 4;
    const r = imageData.data[idx];
    const g = imageData.data[idx+1];
    const b = imageData.data[idx+2];
    const a = imageData.data[idx+3];
    const brightness = (r + g + b) / 2;
    return a > 10 || brightness > 5;
  }

  function randInMask() {
    let tries = 0;
    while (tries < 5000) {
      const x = Math.random() * W;
      const y = Math.random() * H;
      if (insideMask(x, y)) return { x, y };
      tries++;
    }
    return { x: W * 0.5, y: H * 0.5 };
  }

  function makeParticles(n) {
    particles = new Array(n).fill(0).map(() => {
      const p = randInMask();
      const angle = Math.random() * Math.PI * 2;
      const speed = CONFIG.speed * (0.4 + Math.random() * 0.6);
      const base = PALETTE[Math.floor(Math.random()*PALETTE.length)];
      return {
        x: p.x, y: p.y,
        vx: Math.cos(angle)*speed, vy: Math.sin(angle)*speed,
        base, t: Math.random()*Math.PI*2
      };
    });
  }

  function reflectIfOutside(p, nx, ny) {
    if (!insideMask(nx, p.y)) { p.vx *= -1; nx = p.x; }
    if (!insideMask(p.x, ny)) { p.vy *= -1; ny = p.y; }
    if (!insideMask(nx, ny)) { p.vx *= -1; p.vy *= -1; nx = p.x; ny = p.y; }
    p.x = nx; p.y = ny;
  }

  function step() {
    const glow = CONFIG.glow;
    const size = CONFIG.size;
  
    ctx.save();
  
    // hard clear to black every frame
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width / DPR, canvas.height / DPR);
  
    // draw particles (matte) or use 'lighter' for glow
    ctx.globalCompositeOperation = 'source-over';
    ctx.shadowBlur = glow;
  
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
  
      const maxV = 3.5 * CONFIG.speed * DPR;
      const vmag = Math.hypot(p.vx, p.vy);
      if (vmag > maxV) { p.vx = p.vx / vmag * maxV; p.vy = p.vy / vmag * maxV; }
  
      let nx = p.x + p.vx, ny = p.y + p.vy;
      if (!insideMask(nx, ny)) reflectIfOutside(p, nx, ny); else { p.x = nx; p.y = ny; }
  
      p.t += 0.03;
      const pulse = 6 * Math.sin(p.t);
      const l = Math.max(45, Math.min(75, p.base.l + pulse));
      const color = hsla(p.base.h, p.base.s, l, 0.9);
  
      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.rect((p.x / DPR) - size/2, (p.y / DPR) - size/2, size, size);
      ctx.fill();
    }
  
    ctx.restore();
    requestAnimationFrame(step);
  }


  function setMaskImage(img) {
    maskImg = img;
    maskReady = true;
    placeMaskToCanvas();
    makeParticles(CONFIG.count);
  }

  window.addEventListener('resize', resize);
  resize();

  const tmp = new Image();
  tmp.crossOrigin = 'anonymous';
  tmp.onload = () => setMaskImage(tmp);
  tmp.src = DEFAULT_IMAGE_URL;
  requestAnimationFrame(step);