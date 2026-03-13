// Pixel Bounce — HTML5 Canvas Arcade Game
// Built by Syntax Sorcery Pipeline
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = 400;
const H = 600;
canvas.width = W;
canvas.height = H;

const STATE = { TITLE: 0, PLAY: 1, OVER: 2 };
let state = STATE.TITLE;
let score = 0;
let highScore = parseInt(localStorage.getItem('pb_hi') || '0', 10);
let stars = [];
let platforms = [];
let particles = [];
let cameraY = 0;
let maxHeight = 0;

const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 8 };
const keys = {};
let touchX = null;

// --- Input ---
document.onkeydown = e => {
  keys[e.key] = true;
  if ((e.key === ' ' || e.key === 'Enter') && state !== STATE.PLAY) startGame();
};
document.onkeyup = e => { keys[e.key] = false; };

canvas.onclick = () => { if (state !== STATE.PLAY) startGame(); };

canvas.ontouchstart = e => {
  e.preventDefault();
  if (state !== STATE.PLAY) { startGame(); return; }
  const rect = canvas.getBoundingClientRect();
  touchX = (e.touches[0].clientX - rect.left) / rect.width * W;
};
canvas.ontouchmove = e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchX = (e.touches[0].clientX - rect.left) / rect.width * W;
};
canvas.ontouchend = e => { e.preventDefault(); touchX = null; };

// --- Factories ---
function makePlatform(y) {
  const w = 60 + Math.random() * 50;
  return {
    x: Math.random() * (W - w), y, w, h: 10,
    type: Math.random() < 0.15 ? 'moving' : 'static',
    dir: Math.random() < 0.5 ? 1 : -1,
    speed: 1 + Math.random() * 1.5
  };
}

function makeStar(minY, maxY) {
  return {
    x: 20 + Math.random() * (W - 40),
    y: minY + Math.random() * (maxY - minY),
    r: 5, pulse: Math.random() * Math.PI * 2, collected: false
  };
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 20,
      color, r: 2 + Math.random() * 3
    });
  }
}

// --- Game Init ---
function startGame() {
  state = STATE.PLAY;
  score = 0;
  cameraY = 0;
  maxHeight = 0;
  ball.x = W / 2;
  ball.y = H - 100;
  ball.vx = 0;
  ball.vy = -8;
  platforms = [];
  stars = [];
  particles = [];

  // Starting platform directly under the ball
  platforms.push({ x: W / 2 - 40, y: H - 60, w: 80, h: 10, type: 'static', dir: 0, speed: 0 });
  for (let i = 0; i < 8; i++) {
    platforms.push(makePlatform(H - 120 - i * 70));
  }
  for (let i = 0; i < 4; i++) {
    stars.push(makeStar(100, H - 100));
  }
}

// --- Update ---
function update() {
  if (state !== STATE.PLAY) return;

  const accel = 0.5;
  ball.vx *= 0.92;
  ball.vy += 0.35;

  if (keys['ArrowLeft'] || keys['a'] || keys['A']) ball.vx -= accel;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) ball.vx += accel;
  if (touchX !== null) {
    if (touchX < ball.x - 10) ball.vx -= accel;
    else if (touchX > ball.x + 10) ball.vx += accel;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Horizontal wrap
  if (ball.x < -ball.r) ball.x = W + ball.r;
  if (ball.x > W + ball.r) ball.x = -ball.r;

  // Platform collision (only when falling)
  if (ball.vy > 0) {
    for (const p of platforms) {
      if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w &&
          ball.y + ball.r >= p.y && ball.y + ball.r <= p.y + p.h + ball.vy + 2) {
        ball.vy = -10 - Math.min(score * 0.02, 4);
        ball.y = p.y - ball.r;
        spawnParticles(ball.x, p.y, '#e94560', 5);
        break;
      }
    }
  }

  // Moving platforms
  for (const p of platforms) {
    if (p.type === 'moving') {
      p.x += p.speed * p.dir;
      if (p.x <= 0 || p.x + p.w >= W) p.dir *= -1;
    }
  }

  // Camera follows ball upward
  if (ball.y - cameraY < H * 0.35) {
    cameraY = ball.y - H * 0.35;
  }

  // Score based on height climbed
  const height = -(ball.y - H);
  if (height > maxHeight) {
    score += Math.floor((height - maxHeight) / 10);
    maxHeight = height;
  }

  // Spawn new platforms above
  const highestY = Math.min(...platforms.map(p => p.y));
  if (highestY > cameraY - 50) {
    const newP = makePlatform(highestY - (55 + Math.random() * 30));
    platforms.push(newP);
    if (Math.random() < 0.4) stars.push(makeStar(newP.y - 60, newP.y - 10));
  }

  // Cleanup off-screen
  platforms = platforms.filter(p => p.y < cameraY + H + 50);
  stars = stars.filter(s => !s.collected && s.y < cameraY + H + 50);

  // Star collection
  for (const s of stars) {
    if (s.collected) continue;
    const dx = ball.x - s.x, dy = ball.y - s.y;
    if (Math.sqrt(dx * dx + dy * dy) < ball.r + s.r + 4) {
      s.collected = true;
      score += 25;
      spawnParticles(s.x, s.y, '#ffd700', 10);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Game over
  if (ball.y - cameraY > H + 50) {
    state = STATE.OVER;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pb_hi', String(highScore));
    }
  }
}

// --- Draw ---
function draw() {
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f3460');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Background stars (parallax)
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 40; i++) {
    const sx = (i * 97 + 13) % W;
    const sy = ((i * 131 + 7 - cameraY * 0.1) % H + H) % H;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  ctx.save();
  ctx.translate(0, -cameraY);

  // Platforms
  for (const p of platforms) {
    const c1 = p.type === 'moving' ? '#16c79a' : '#e94560';
    const c2 = p.type === 'moving' ? '#0e8a6d' : '#c81e45';
    const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pg.addColorStop(0, c1); pg.addColorStop(1, c2);
    ctx.fillStyle = pg;
    roundRect(ctx, p.x, p.y, p.w, p.h, 3);
    ctx.fill();
  }

  // Stars
  for (const s of stars) {
    if (s.collected) continue;
    s.pulse += 0.08;
    drawStar(s.x, s.y, s.r * (1 + Math.sin(s.pulse) * 0.2));
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r * (p.life / 40), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Ball with glow
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 15;
  const bg = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(0.5, '#e94560');
  bg.addColorStop(1, '#c81e45');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  // HUD
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 12, 28);
  ctx.textAlign = 'right';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText('Best: ' + highScore, W - 12, 28);

  if (state === STATE.TITLE) drawTitleScreen();
  if (state === STATE.OVER) drawGameOver();
}

function drawTitleScreen() {
  ctx.fillStyle = 'rgba(10,10,30,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 42px "Courier New", monospace';
  ctx.fillText('PIXEL', W / 2, H / 2 - 50);
  ctx.fillText('BOUNCE', W / 2, H / 2);
  ctx.fillStyle = '#fff';
  ctx.font = '16px "Courier New", monospace';
  ctx.fillText('Click or Tap to Start', W / 2, H / 2 + 50);
  ctx.fillStyle = '#aaa';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillText('Arrow keys / WASD / Touch', W / 2, H / 2 + 80);
  drawStar(W / 2 - 50, H / 2 - 100, 8);
  drawStar(W / 2 + 50, H / 2 - 100, 8);
  drawStar(W / 2, H / 2 - 120, 10);
}

function drawGameOver() {
  ctx.fillStyle = 'rgba(10,10,30,0.75)';
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#e94560';
  ctx.font = 'bold 36px "Courier New", monospace';
  ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
  ctx.fillStyle = '#fff';
  ctx.font = '22px "Courier New", monospace';
  ctx.fillText('Score: ' + score, W / 2, H / 2 + 10);
  if (score >= highScore && score > 0) {
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('NEW HIGH SCORE!', W / 2, H / 2 + 40);
  }
  ctx.fillStyle = '#aaa';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('Click or Tap to Restart', W / 2, H / 2 + 70);
}

function drawStar(x, y, r) {
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y); c.lineTo(x + w - r, y);
  c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r);
  c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  c.lineTo(x + r, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.closePath();
}

(function loop() { update(); draw(); requestAnimationFrame(loop); })();