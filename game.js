// Pixel Bounce — HTML5 Canvas Arcade Game
// Built by Syntax Sorcery Pipeline
'use strict';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = 400;
const H = 600;
canvas.width = W;
canvas.height = H;

// Game states
const STATE = { TITLE: 0, PLAY: 1, OVER: 2 };
let state = STATE.TITLE;
let score = 0;
let highScore = parseInt(localStorage.getItem('pb_hi') || '0', 10);
let stars = [];
let platforms = [];
let particles = [];
let frameCount = 0;

// Ball
const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 8 };

// Input
const keys = {};
let touchX = null;

document.addEventListener('keydown', e => { keys[e.key] = true; });
document.addEventListener('keyup', e => { keys[e.key] = false; });

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state === STATE.TITLE || state === STATE.OVER) { startGame(); return; }
  const rect = canvas.getBoundingClientRect();
  touchX = (e.touches[0].clientX - rect.left) / rect.width * W;
}, { passive: false });

canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  touchX = (e.touches[0].clientX - rect.left) / rect.width * W;
}, { passive: false });

canvas.addEventListener('touchend', e => {
  e.preventDefault();
  touchX = null;
}, { passive: false });

canvas.addEventListener('click', () => {
  if (state === STATE.TITLE || state === STATE.OVER) startGame();
});

document.addEventListener('keydown', e => {
  if ((e.key === ' ' || e.key === 'Enter') && (state === STATE.TITLE || state === STATE.OVER)) {
    startGame();
  }
});

// Platform generator
function makePlatform(y) {
  const w = 60 + Math.random() * 50;
  return {
    x: Math.random() * (W - w),
    y: y,
    w: w,
    h: 10,
    type: Math.random() < 0.15 ? 'moving' : 'static',
    dir: Math.random() < 0.5 ? 1 : -1,
    speed: 1 + Math.random() * 1.5
  };
}

function makeStar(minY, maxY) {
  return {
    x: 20 + Math.random() * (W - 40),
    y: minY + Math.random() * (maxY - minY),
    r: 5,
    pulse: Math.random() * Math.PI * 2,
    collected: false
  };
}

function spawnParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      life: 20 + Math.random() * 20,
      color,
      r: 2 + Math.random() * 3
    });
  }
}

function startGame() {
  state = STATE.PLAY;
  score = 0;
  ball.x = W / 2;
  ball.y = H - 100;
  ball.vx = 0;
  ball.vy = -8;
  platforms = [];
  stars = [];
  particles = [];
  frameCount = 0;

  // Initial platforms
  for (let i = 0; i < 8; i++) {
    platforms.push(makePlatform(H - 50 - i * 70));
  }
  // Starting platform under the ball
  platforms.push({ x: W / 2 - 40, y: H - 60, w: 80, h: 10, type: 'static', dir: 0, speed: 0 });

  // Initial stars
  for (let i = 0; i < 4; i++) {
    stars.push(makeStar(100, H - 100));
  }
}

// Camera offset
let cameraY = 0;
let maxHeight = 0;

function update() {
  if (state !== STATE.PLAY) return;
  frameCount++;

  // Horizontal input
  const accel = 0.5;
  const friction = 0.92;

  if (keys['ArrowLeft'] || keys['a'] || keys['A']) ball.vx -= accel;
  if (keys['ArrowRight'] || keys['d'] || keys['D']) ball.vx += accel;

  if (touchX !== null) {
    if (touchX < ball.x - 10) ball.vx -= accel;
    else if (touchX > ball.x + 10) ball.vx += accel;
  }

  ball.vx *= friction;
  ball.vy += 0.35; // gravity

  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wrap horizontally
  if (ball.x < -ball.r) ball.x = W + ball.r;
  if (ball.x > W + ball.r) ball.x = -ball.r;

  // Platform collision (only when falling)
  if (ball.vy > 0) {
    for (const p of platforms) {
      if (
        ball.x + ball.r > p.x &&
        ball.x - ball.r < p.x + p.w &&
        ball.y + ball.r >= p.y &&
        ball.y + ball.r <= p.y + p.h + ball.vy + 2
      ) {
        ball.vy = -10 - Math.min(score * 0.02, 4);
        ball.y = p.y - ball.r;
        spawnParticles(ball.x, p.y, '#e94560', 5);
        break;
      }
    }
  }

  // Update moving platforms
  for (const p of platforms) {
    if (p.type === 'moving') {
      p.x += p.speed * p.dir;
      if (p.x <= 0 || p.x + p.w >= W) p.dir *= -1;
    }
  }

  // Camera: track the ball going up
  const screenY = ball.y - cameraY;
  if (screenY < H * 0.35) {
    cameraY = ball.y - H * 0.35;
  }

  // Track height for score
  const height = -(ball.y - H);
  if (height > maxHeight) {
    score += Math.floor((height - maxHeight) / 10);
    maxHeight = height;
  }

  // Generate new platforms and stars as camera moves up
  const topEdge = cameraY - 50;
  const highestPlatform = Math.min(...platforms.map(p => p.y));
  if (highestPlatform > topEdge) {
    const gap = 55 + Math.random() * 30;
    const newP = makePlatform(highestPlatform - gap);
    platforms.push(newP);
    if (Math.random() < 0.4) {
      stars.push(makeStar(newP.y - 60, newP.y - 10));
    }
  }

  // Remove off-screen platforms and stars
  platforms = platforms.filter(p => p.y < cameraY + H + 50);
  stars = stars.filter(s => !s.collected && s.y < cameraY + H + 50);

  // Star collection
  for (const s of stars) {
    if (s.collected) continue;
    const dx = ball.x - s.x;
    const dy = ball.y - s.y;
    if (Math.sqrt(dx * dx + dy * dy) < ball.r + s.r + 4) {
      s.collected = true;
      score += 25;
      spawnParticles(s.x, s.y, '#ffd700', 10);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Game over: ball fell off bottom of screen
  if (ball.y - cameraY > H + 50) {
    state = STATE.OVER;
    if (score > highScore) {
      highScore = score;
      localStorage.setItem('pb_hi', String(highScore));
    }
  }
}

function draw() {
  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0f3460');
  grad.addColorStop(1, '#1a1a2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Decorative bg stars (parallax)
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 40; i++) {
    const sx = ((i * 97 + 13) % W);
    const sy = ((i * 131 + 7 - cameraY * 0.1) % H + H) % H;
    ctx.fillRect(sx, sy, 1.5, 1.5);
  }

  ctx.save();
  ctx.translate(0, -cameraY);

  // Platforms
  for (const p of platforms) {
    const pGrad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pGrad.addColorStop(0, p.type === 'moving' ? '#16c79a' : '#e94560');
    pGrad.addColorStop(1, p.type === 'moving' ? '#0e8a6d' : '#c81e45');
    ctx.fillStyle = pGrad;
    roundRect(ctx, p.x, p.y, p.w, p.h, 3);
    ctx.fill();
  }

  // Stars
  for (const s of stars) {
    if (s.collected) continue;
    s.pulse += 0.08;
    const scale = 1 + Math.sin(s.pulse) * 0.2;
    drawStar(s.x, s.y, s.r * scale);
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

  // Ball
  const ballGrad = ctx.createRadialGradient(ball.x - 2, ball.y - 2, 1, ball.x, ball.y, ball.r);
  ballGrad.addColorStop(0, '#ffffff');
  ballGrad.addColorStop(0.5, '#e94560');
  ballGrad.addColorStop(1, '#c81e45');
  ctx.fillStyle = ballGrad;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Ball glow
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 15;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.restore();

  // HUD
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 18px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText(`Score: ${score}`, 12, 28);
  ctx.textAlign = 'right';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillStyle = '#aaa';
  ctx.fillText(`Best: ${highScore}`, W - 12, 28);

  // Title screen
  if (state === STATE.TITLE) {
    drawOverlay();
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 42px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PIXEL', W / 2, H / 2 - 50);
    ctx.fillText('BOUNCE', W / 2, H / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px "Courier New", monospace';
    ctx.fillText('Click or Tap to Start', W / 2, H / 2 + 50);
    ctx.fillStyle = '#aaa';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText('Arrow keys / WASD / Touch to move', W / 2, H / 2 + 80);
    drawStar(W / 2 - 50, H / 2 - 100, 8);
    drawStar(W / 2 + 50, H / 2 - 100, 8);
    drawStar(W / 2, H / 2 - 120, 10);
  }

  // Game over screen
  if (state === STATE.OVER) {
    drawOverlay();
    ctx.fillStyle = '#e94560';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', W / 2, H / 2 - 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = '22px "Courier New", monospace';
    ctx.fillText(`Score: ${score}`, W / 2, H / 2 + 10);
    if (score >= highScore && score > 0) {
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.fillText('NEW HIGH SCORE!', W / 2, H / 2 + 40);
    }
    ctx.fillStyle = '#aaa';
    ctx.font = '14px "Courier New", monospace';
    ctx.fillText('Click or Tap to Restart', W / 2, H / 2 + 70);
  }
}

function drawOverlay() {
  ctx.fillStyle = 'rgba(10, 10, 30, 0.75)';
  ctx.fillRect(0, 0, W, H);
}

function drawStar(x, y, r) {
  ctx.fillStyle = '#ffd700';
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function roundRect(c, x, y, w, h, radius) {
  c.beginPath();
  c.moveTo(x + radius, y);
  c.lineTo(x + w - radius, y);
  c.quadraticCurveTo(x + w, y, x + w, y + radius);
  c.lineTo(x + w, y + h - radius);
  c.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  c.lineTo(x + radius, y + h);
  c.quadraticCurveTo(x, y + h, x, y + h - radius);
  c.lineTo(x, y + radius);
  c.quadraticCurveTo(x, y, x + radius, y);
  c.closePath();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

// Reset camera/height tracking on start
const _origStart = startGame;
const wrappedStart = function() {
  cameraY = 0;
  maxHeight = 0;
  _origStart();
};
// Overwrite startGame
// (handled inline — cameraY/maxHeight reset added to startGame directly)

// Actually, let's fix startGame to include resets
const originalStartGame = startGame;

// Patch done: startGame already sets all state. Add camera resets.
(function() {
  const _start = startGame;
  window._pixelBounceStart = _start;
})();

// Override with camera reset
function startGamePatched() {
  cameraY = 0;
  maxHeight = 0;
  state = STATE.PLAY;
  score = 0;
  ball.x = W / 2;
  ball.y = H - 100;
  ball.vx = 0;
  ball.vy = -8;
  platforms = [];
  stars = [];
  particles = [];
  frameCount = 0;
  for (let i = 0; i < 8; i++) {
    platforms.push(makePlatform(H - 50 - i * 70));
  }
  platforms.push({ x: W / 2 - 40, y: H - 60, w: 80, h: 10, type: 'static', dir: 0, speed: 0 });
  for (let i = 0; i < 4; i++) {
    stars.push(makeStar(100, H - 100));
  }
}

// Use the patched version for all event handlers
canvas.removeEventListener('click', () => {});
// Re-bind with corrected startGame
canvas.onclick = () => {
  if (state === STATE.TITLE || state === STATE.OVER) startGamePatched();
};

document.onkeydown = (e) => {
  keys[e.key] = true;
  if ((e.key === ' ' || e.key === 'Enter') && (state === STATE.TITLE || state === STATE.OVER)) {
    startGamePatched();
  }
};
document.onkeyup = (e) => { keys[e.key] = false; };

canvas.ontouchstart = (e) => {
  e.preventDefault();
  if (state === STATE.TITLE || state === STATE.OVER) { startGamePatched(); return; }
  const rect = canvas.getBoundingClientRect();
  touchX = (e.touches[0].clientX - rect.left) / rect.width * W;
};

loop();