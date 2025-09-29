const customCursor = document.querySelector('.custom-cursor');

document.addEventListener('mousemove', (e) => {
  const cursorWidth = customCursor.offsetWidth;
  const cursorHeight = customCursor.offsetHeight;

  customCursor.style.left = `${e.clientX - cursorWidth / 1}px`;
  customCursor.style.top = `${e.clientY - cursorHeight / 1}px`;
});



const container = document.querySelector('.collision');
const canvas = document.getElementById('collisionCanvas');
const c = canvas.getContext('2d');


const mouse = { x: 0, y: 0 };


const sprite = new Image();
sprite.src = 'man.png';   
let spriteReady = false;
sprite.onload = () => { spriteReady = true; };


const colors = [
  { r: 78, g: 252, b: 2 },
  { r: 244, g: 11, b: 242 },
  { r: 255, g: 250, b: 27 },
];


function sizeCanvasToContainer() {
  const rect = container.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width  = Math.floor(rect.width  * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
}
sizeCanvasToContainer();

addEventListener('mousemove', (e) => {
  const rect = container.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;
});

addEventListener('resize', () => {
  sizeCanvasToContainer();
  init();
});


function randomIntFromRange(min, max) { return Math.floor(Math.random() * (max - min + 1) + min); }
function randomColor(colors) { return colors[Math.floor(Math.random() * colors.length)]; }
function distance(x1, y1, x2, y2) { const dx = x2 - x1, dy = y2 - y1; return Math.hypot(dx, dy); }
function rotateVelocities(v, t){ return { x: v.x*Math.cos(t)-v.y*Math.sin(t), y: v.x*Math.sin(t)+v.y*Math.cos(t) }; }


function Particle(x, y, radius, rgb) {
  this.x = x; this.y = y;
  this.velocity = { x: (Math.random()-0.5)*3, y: (Math.random()-0.5)*3 };
  this.radius = radius; 
  this.mass = 1; this.opacity = 1;
  this.r = rgb.r; this.g = rgb.g; this.b = rgb.b;

  this.spriteSize = this.radius * 2;

  this.update = particles => {
    this.draw();

  
    for (let i=0;i<particles.length;i++){
      const other = particles[i];
      if (this === other) continue;
      if (distance(this.x,this.y,other.x,other.y) - this.radius*2 < 0) {
        const rel = { x: this.velocity.x - other.velocity.x, y: this.velocity.y - other.velocity.y };
        if (rel.x*(other.x-this.x) + rel.y*(other.y-this.y) >= 0) {
          const t = -Math.atan2(other.y - this.y, other.x - this.x);
          const u1 = rotateVelocities(this.velocity, t);
          const u2 = rotateVelocities(other.velocity, t);
          const m1 = this.mass, m2 = other.mass;
          const vx1 = u1.x*(m1-m2)/(m1+m2) + u2.x*(2*m2)/(m1+m2);
          const vx2 = u2.x*(m1-m2)/(m1+m2) + u1.x*(2*m2)/(m1+m2);
          const v1 = rotateVelocities({x:vx1,y:u1.y}, -t);
          const v2 = rotateVelocities({x:vx2,y:u2.y}, -t);
          this.velocity = v1; other.velocity = v2;
        }
      }
    }

    
    if (distance(this.x, this.y, mouse.x, mouse.y) - this.radius*2 < 100) {
      if (this.opacity > 0.0) {   
        this.opacity -= 0.02;
      }
    } else {
      if (this.opacity < 1) {
        this.opacity += 0.02;
      }
    }

    
    if (this.x + this.radius >= canvas.width || this.x - this.radius <= 0)  this.velocity.x *= -1;
    if (this.y + this.radius >= canvas.height || this.y - this.radius <= 0) this.velocity.y *= -1;

    this.x += this.velocity.x;
    this.y += this.velocity.y;
  };

  this.draw = () => {
    if (!spriteReady) {
      c.beginPath();
      c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      c.fillStyle = `rgba(${this.r}, ${this.g}, ${this.b}, ${this.opacity})`;
      c.fill();
      return;
    }

    const half = this.spriteSize / 2;
    c.save();
    c.globalAlpha = Math.max(0.001, this.opacity); 
    c.drawImage(sprite, this.x - half, this.y - half, this.spriteSize, this.spriteSize);
    c.restore();
  };
}

let particles = [];
function init() {
  particles = [];
  const radius = 25; 
  for (let i = 0; i < 100; i++) {
    let x = randomIntFromRange(radius, canvas.width  - radius);
    let y = randomIntFromRange(radius, canvas.height - radius);

    for (let j = 0; j < particles.length; j++) {
      if (distance(x, y, particles[j].x, particles[j].y) - radius*2 < 0) {
        x = randomIntFromRange(radius, canvas.width  - radius);
        y = randomIntFromRange(radius, canvas.height - radius);
        j = -1;
      }
    }
    particles.push(new Particle(x, y, radius, randomColor(colors)));
  }
}

function animate() {
  requestAnimationFrame(animate);
  c.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach(p => p.update(particles));
}

init();
animate();
