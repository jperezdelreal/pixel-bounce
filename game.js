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
let powerups = [];
let activePower = null; // { type, timer }
let cameraY = 0;
let maxHeight = 0;

// --- Persistent Stats & Skins ---
const defaultStats = { totalStars: 0, totalGames: 0, totalDeaths: 0, bestScore: 0 };
let stats = JSON.parse(localStorage.getItem('pb_stats') || JSON.stringify(defaultStats));
let selectedSkin = parseInt(localStorage.getItem('pb_skin') || '0', 10);
let runStars = 0;

const SKINS = [
  { name: 'Classic', hint: 'Default', unlock: () => true,
    draw(cx, x, y, r) {
      const g = cx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#e94560'); g.addColorStop(1, '#c81e45');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Neon Green', hint: 'Score 200+', unlock: () => stats.bestScore >= 200,
    draw(cx, x, y, r) {
      cx.shadowColor = '#00ff88'; cx.shadowBlur = 18;
      cx.fillStyle = '#00ff88'; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
      cx.shadowBlur = 0;
    }},
  { name: 'Gold', hint: '50 stars total', unlock: () => stats.totalStars >= 50,
    draw(cx, x, y, r) {
      const g = cx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      g.addColorStop(0, '#fff8dc'); g.addColorStop(0.5, '#ffd700'); g.addColorStop(1, '#b8860b');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Ice', hint: 'Score 500+', unlock: () => stats.bestScore >= 500,
    draw(cx, x, y, r) {
      const g = cx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.4, '#88ddff'); g.addColorStop(1, '#0088cc');
      cx.fillStyle = g; cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Shadow', hint: 'Play 10 games', unlock: () => stats.totalGames >= 10,
    draw(cx, x, y, r) {
      cx.globalAlpha = 0.4; cx.fillStyle = '#6633aa';
      cx.beginPath(); cx.arc(x + 3, y + 3, r, 0, Math.PI * 2); cx.fill();
      cx.globalAlpha = 1; cx.fillStyle = '#9944ee';
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Pixel', hint: 'Score 100 no stars', unlock: () => stats.bestScore >= 100,
    draw(cx, x, y, r) {
      cx.fillStyle = '#e94560'; cx.fillRect(x - r, y - r, r * 2, r * 2);
    }},
  { name: 'Rainbow', hint: 'Score 1000+', unlock: () => stats.bestScore >= 1000,
    draw(cx, x, y, r) {
      const hue = (Date.now() / 10) % 360;
      cx.fillStyle = `hsl(${hue}, 100%, 60%)`;
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
    }},
  { name: 'Ghost', hint: 'Die 25 times', unlock: () => stats.totalDeaths >= 25,
    draw(cx, x, y, r) {
      cx.globalAlpha = 0.15; cx.fillStyle = '#ffffff';
      cx.beginPath(); cx.arc(x - 4, y, r, 0, Math.PI * 2); cx.fill();
      cx.globalAlpha = 0.4; cx.fillStyle = '#ccccff';
      cx.beginPath(); cx.arc(x, y, r, 0, Math.PI * 2); cx.fill();
      cx.globalAlpha = 1;
    }},
];

function saveStats() { localStorage.setItem('pb_stats', JSON.stringify(stats)); }

// --- Achievements ---
let unlockedAchievements = JSON.parse(localStorage.getItem('pb_achievements') || '[]');
let runBounces = 0;
let runStartTime = 0;
let achievementToast = null; // { text, timer }
let showAchievementOverlay = false;

const ACHIEVEMENTS = [
  { id: 'first_steps', name: 'First Steps', icon: '🐣', check: () => score >= 50 },
  { id: 'sky_climber', name: 'Sky Climber', icon: '⛰️', check: () => score >= 500 },
  { id: 'star_collector', name: 'Star Collector', icon: '⭐', check: () => runStars >= 10 },
  { id: 'star_hoarder', name: 'Star Hoarder', icon: '🌟', check: () => stats.totalStars >= 50 },
  { id: 'bouncy_castle', name: 'Bouncy Castle', icon: '🏰', check: () => runBounces >= 100 },
  { id: 'speed_demon', name: 'Speed Demon', icon: '⚡', check: () => score >= 200 && (Date.now() - runStartTime) < 60000 },
  { id: 'untouchable', name: 'Untouchable', icon: '🛡️', check: () => score >= 300 && runStars === 0 },
  { id: 'marathon', name: 'Marathon', icon: '🏃', check: () => stats.totalGames >= 25 },
  { id: 'legend', name: 'Legend', icon: '👑', check: () => score >= 1000 },
  { id: 'perfectionist', name: 'Perfectionist', icon: '💎',
    check: () => ACHIEVEMENTS.filter(a => a.id !== 'perfectionist').every(a => unlockedAchievements.includes(a.id)) },
];

function checkAchievements() {
  for (const a of ACHIEVEMENTS) {
    if (!unlockedAchievements.includes(a.id) && a.check()) {
      unlockedAchievements.push(a.id);
      achievementToast = { text: a.icon + ' ' + a.name + ' unlocked!', timer: 180 };
      playTone(1000, 0.1, 'sine', 0.15);
      setTimeout(() => playTone(1200, 0.15, 'sine', 0.12), 100);
    }
  }
  localStorage.setItem('pb_achievements', JSON.stringify(unlockedAchievements));
}

const ball = { x: W / 2, y: H / 2, vx: 0, vy: 0, r: 8 };
const keys = {};
let touchX = null;

// --- Audio (WebAudio API — procedural, zero external files) ---
let audioCtx = null;
let muted = localStorage.getItem('pb_mute') === '1';
let audioUnlocked = false;
let bgmGain = null;
let bgmTimeout = null;

function ensureAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioUnlocked = true;
  startBGM();
}

function playTone(freq, duration, type, vol) {
  if (!audioCtx || muted) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol || 0.15, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function sfxBounce(vy) {
  const pitch = 200 + Math.abs(vy) * 30;
  playTone(pitch, 0.1, 'square', 0.12);
}

function sfxStar() {
  playTone(880, 0.08, 'square', 0.1);
  setTimeout(() => playTone(1100, 0.12, 'square', 0.1), 60);
}

function sfxGameOver() {
  playTone(400, 0.15, 'sawtooth', 0.12);
  setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.12), 120);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.1), 240);
}

function sfxBouncy() { playTone(600, 0.15, 'sine', 0.15); playTone(900, 0.1, 'sine', 0.1); }
function sfxBreakable() { playTone(150, 0.2, 'sawtooth', 0.1); }
function sfxPortal() {
  playTone(500, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(800, 0.1, 'sine', 0.12), 80);
  setTimeout(() => playTone(1200, 0.15, 'sine', 0.1), 160);
}

function sfxPowerUp() {
  playTone(660, 0.08, 'square', 0.12);
  setTimeout(() => playTone(880, 0.08, 'square', 0.12), 70);
  setTimeout(() => playTone(1100, 0.12, 'square', 0.1), 140);
}

function startBGM() {
  if (!audioCtx || muted) return;
  bgmGain = audioCtx.createGain();
  bgmGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
  bgmGain.connect(audioCtx.destination);

  // Simple 8-bit arpeggio loop
  const notes = [262, 330, 392, 523, 392, 330, 262, 196];
  const noteLen = 0.18;
  function playLoop() {
    if (!audioCtx || muted) return;
    const now = audioCtx.currentTime;
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, now + i * noteLen);
      g.gain.setValueAtTime(0.04, now + i * noteLen);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * noteLen + noteLen * 0.9);
      osc.connect(g);
      g.connect(audioCtx.destination);
      osc.start(now + i * noteLen);
      osc.stop(now + i * noteLen + noteLen);
    });
    bgmTimeout = setTimeout(playLoop, notes.length * noteLen * 1000);
  }
  playLoop();
}

function stopBGM() {
  if (bgmTimeout) { clearTimeout(bgmTimeout); bgmTimeout = null; }
}

function toggleMute() {
  muted = !muted;
  localStorage.setItem('pb_mute', muted ? '1' : '0');
  if (muted) stopBGM();
  else if (audioCtx) startBGM();
}

// Cache canvas bounding rect to avoid layout thrashing on every touch move.
// Initialized immediately (script runs after body is parsed so layout is available),
// then refreshed whenever the canvas is resized or the device is rotated.
let cachedRect = canvas.getBoundingClientRect();
function updateCachedRect() { cachedRect = canvas.getBoundingClientRect(); }
new ResizeObserver(updateCachedRect).observe(canvas);
window.addEventListener('orientationchange', updateCachedRect);

// --- Input ---
document.onkeydown = e => {
  keys[e.key] = true;
  if (e.key === 'm' || e.key === 'M') toggleMute();
  if ((e.key === 'a' || e.key === 'A') && state !== STATE.PLAY) showAchievementOverlay = !showAchievementOverlay;
  // Skin selector on title screen
  if (state === STATE.TITLE) {
    if (e.key === 'ArrowLeft') { selectedSkin = (selectedSkin - 1 + SKINS.length) % SKINS.length; localStorage.setItem('pb_skin', selectedSkin); }
    if (e.key === 'ArrowRight') { selectedSkin = (selectedSkin + 1) % SKINS.length; localStorage.setItem('pb_skin', selectedSkin); }
  }
  if ((e.key === ' ' || e.key === 'Enter') && state !== STATE.PLAY) startGame();
};
document.onkeyup = e => { keys[e.key] = false; };

canvas.onclick = () => { if (state !== STATE.PLAY) startGame(); };

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  if (state !== STATE.PLAY) { startGame(); return; }
  touchX = (e.touches[0].clientX - cachedRect.left) / cachedRect.width * W;
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  e.preventDefault();
  touchX = (e.touches[0].clientX - cachedRect.left) / cachedRect.width * W;
}, { passive: false });
canvas.addEventListener('touchend', e => { e.preventDefault(); touchX = null; }, { passive: false });

// --- Factories ---
function makePlatform(y) {
  const w = 60 + Math.random() * 50;
  const roll = Math.random();
  let type;
  if (roll < 0.03 && score > 300) type = 'portal';
  else if (roll < 0.11 && score > 100) type = 'breakable';
  else if (roll < 0.21) type = 'bouncy';
  else if (roll < 0.36) type = 'moving';
  else type = 'static';
  return {
    x: Math.random() * (W - w), y, w, h: 10,
    type,
    dir: Math.random() < 0.5 ? 1 : -1,
    speed: 1 + Math.random() * 1.5,
    broken: false,
    pulse: Math.random() * Math.PI * 2
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

const POWER_TYPES = ['shield', 'magnet', 'boost'];
const POWER_COLORS = { shield: '#4488ff', magnet: '#ffdd00', boost: '#ff4444' };
const POWER_ICONS = { shield: '🛡', magnet: '🧲', boost: '🚀' };
let lastPowerUpHeight = 0;

function makePowerUp(x, y) {
  const type = POWER_TYPES[Math.floor(Math.random() * POWER_TYPES.length)];
  return { x, y: y - 30, type, r: 10, pulse: Math.random() * Math.PI * 2, collected: false };
}

// --- Game Init ---
function startGame() {
  ensureAudio();
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
  powerups = [];
  activePower = null;
  lastPowerUpHeight = 0;
  runStars = 0;
  runBounces = 0;
  runStartTime = Date.now();
  stats.totalGames++;
  saveStats();

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
      if (p.broken) continue;
      if (ball.x + ball.r > p.x && ball.x - ball.r < p.x + p.w &&
          ball.y + ball.r >= p.y && ball.y + ball.r <= p.y + p.h + ball.vy + 2) {
        const baseVy = -10 - Math.min(score * 0.02, 4);
        runBounces++;
        // Boost power-up: amplify next bounce
        const boostMul = (activePower && activePower.type === 'boost') ? 2.5 : 1;
        if (boostMul > 1) activePower = null;
        if (p.type === 'bouncy') {
          ball.vy = baseVy * 2 * boostMul;
          sfxBouncy();
          spawnParticles(ball.x, p.y, '#00ff88', 8);
        } else if (p.type === 'breakable') {
          ball.vy = baseVy * boostMul;
          p.broken = true;
          sfxBreakable();
          spawnParticles(ball.x, p.y, '#ff8c00', 12);
        } else if (p.type === 'portal') {
          const highest = Math.min(...platforms.filter(q => !q.broken && q !== p).map(q => q.y));
          ball.y = highest - ball.r - 20;
          ball.vy = baseVy * boostMul;
          sfxPortal();
          spawnParticles(ball.x, p.y, '#b44dff', 15);
          spawnParticles(ball.x, ball.y, '#b44dff', 10);
        } else {
          ball.vy = baseVy * boostMul;
          sfxBounce(ball.vy);
          spawnParticles(ball.x, p.y, '#e94560', 5);
        }
        ball.y = p.type === 'portal' ? ball.y : p.y - ball.r;
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

  // Spawn new platforms above — spacing scales with jump capability
  let highestY = Math.min(...platforms.map(p => p.y));
  while (highestY > cameraY - 100) {
    const bounceVy = 10 + Math.min(score * 0.02, 4);
    const maxJump = (bounceVy * bounceVy) / (2 * 0.35);
    const safeGap = maxJump * 0.4;
    const gap = 50 + Math.random() * Math.max(safeGap - 50, 10);
    const newP = makePlatform(highestY - gap);
    platforms.push(newP);
    if (Math.random() < 0.4) stars.push(makeStar(newP.y - 60, newP.y - 10));
    // Spawn power-up every ~200 height units
    const currentHeight = -(newP.y - H);
    if (currentHeight - lastPowerUpHeight >= 200) {
      powerups.push(makePowerUp(newP.x + newP.w / 2, newP.y));
      lastPowerUpHeight = currentHeight;
    }
    highestY = newP.y;
  }

  // Cleanup off-screen + broken platforms
  platforms = platforms.filter(p => !p.broken && p.y < cameraY + H + 50);
  stars = stars.filter(s => !s.collected && s.y < cameraY + H + 50);
  powerups = powerups.filter(pu => !pu.collected && pu.y < cameraY + H + 50);

  // Magnet timer countdown
  if (activePower && activePower.type === 'magnet') {
    activePower.timer--;
    if (activePower.timer <= 0) activePower = null;
  }

  // Star collection (magnet expands radius)
  const magnetRadius = (activePower && activePower.type === 'magnet') ? 80 : 0;
  for (const s of stars) {
    if (s.collected) continue;
    const dx = ball.x - s.x, dy = ball.y - s.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < ball.r + s.r + 4 + magnetRadius) {
      s.collected = true;
      score += 25;
      runStars++;
      stats.totalStars++;
      sfxStar();
      spawnParticles(s.x, s.y, '#ffd700', 10);
    }
  }

  // Power-up collection
  for (const pu of powerups) {
    if (pu.collected) continue;
    const dx = ball.x - pu.x, dy = ball.y - pu.y;
    if (Math.sqrt(dx * dx + dy * dy) < ball.r + pu.r) {
      pu.collected = true;
      if (pu.type === 'magnet') {
        activePower = { type: 'magnet', timer: 300 }; // ~5 seconds at 60fps
      } else {
        activePower = { type: pu.type, timer: -1 }; // single-use
      }
      sfxPowerUp();
      spawnParticles(pu.x, pu.y, POWER_COLORS[pu.type], 12);
    }
  }

  // Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) particles.splice(i, 1);
  }

  // Game over (shield intercepts once)
  if (ball.y - cameraY > H + 50) {
    if (activePower && activePower.type === 'shield') {
      // Shield saves: bounce back up
      ball.vy = -12;
      ball.y = cameraY + H - 20;
      activePower = null;
      playTone(700, 0.2, 'sine', 0.15);
      spawnParticles(ball.x, ball.y, '#4488ff', 20);
    } else {
      state = STATE.OVER;
      sfxGameOver();
      stats.totalDeaths++;
      if (score > stats.bestScore) stats.bestScore = score;
      saveStats();
      checkAchievements();
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('pb_hi', String(highScore));
      }
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
    if (p.broken) continue;
    let c1, c2;
    switch (p.type) {
      case 'bouncy':
        p.pulse += 0.06;
        c1 = '#00ff88'; c2 = '#00cc66';
        break;
      case 'breakable':
        c1 = '#ff8c00'; c2 = '#cc6600';
        break;
      case 'portal':
        p.pulse += 0.08;
        c1 = '#b44dff'; c2 = '#8800cc';
        break;
      case 'moving':
        c1 = '#16c79a'; c2 = '#0e8a6d';
        break;
      default:
        c1 = '#e94560'; c2 = '#c81e45';
    }
    const pg = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.h);
    pg.addColorStop(0, c1); pg.addColorStop(1, c2);
    ctx.fillStyle = pg;
    // Bouncy platforms pulse in size
    const scaleW = p.type === 'bouncy' ? 1 + Math.sin(p.pulse) * 0.03 : 1;
    const drawX = p.x - (p.w * scaleW - p.w) / 2;
    roundRect(ctx, drawX, p.y, p.w * scaleW, p.h, 3);
    ctx.fill();
    // Breakable crack lines
    if (p.type === 'breakable') {
      ctx.strokeStyle = '#553300';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(p.x + p.w * 0.3, p.y);
      ctx.lineTo(p.x + p.w * 0.5, p.y + p.h);
      ctx.moveTo(p.x + p.w * 0.7, p.y);
      ctx.lineTo(p.x + p.w * 0.55, p.y + p.h);
      ctx.stroke();
    }
    // Portal shimmer
    if (p.type === 'portal') {
      ctx.globalAlpha = 0.3 + Math.sin(p.pulse) * 0.2;
      ctx.fillStyle = '#e0aaff';
      roundRect(ctx, p.x, p.y, p.w, p.h, 3);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Stars
  for (const s of stars) {
    if (s.collected) continue;
    s.pulse += 0.08;
    drawStar(s.x, s.y, s.r * (1 + Math.sin(s.pulse) * 0.2));
  }

  // Power-ups
  for (const pu of powerups) {
    if (pu.collected) continue;
    pu.pulse += 0.05;
    const bobY = pu.y + Math.sin(pu.pulse) * 4;
    const color = POWER_COLORS[pu.type];
    // Glow
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pu.x, bobY, pu.r, 0, Math.PI * 2);
    ctx.fill();
    // Icon
    ctx.shadowBlur = 0;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(POWER_ICONS[pu.type], pu.x, bobY + 4);
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

  // Ball — render with selected skin
  const skinIdx = SKINS[selectedSkin].unlock() ? selectedSkin : 0;
  ctx.shadowColor = '#e94560';
  ctx.shadowBlur = 15;
  SKINS[skinIdx].draw(ctx, ball.x, ball.y, ball.r);
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
  // Mute indicator
  ctx.textAlign = 'center';
  ctx.font = '12px "Courier New", monospace';
  ctx.fillStyle = muted ? '#e94560' : '#555';
  ctx.fillText(muted ? '🔇 M' : '🔊 M', W / 2, 18);
  // Active power-up indicator
  if (activePower) {
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    ctx.fillStyle = POWER_COLORS[activePower.type];
    const label = POWER_ICONS[activePower.type] + ' ' + activePower.type.toUpperCase();
    ctx.fillText(label, 12, 48);
    if (activePower.type === 'magnet') {
      // Duration bar
      const barW = 60 * (activePower.timer / 300);
      ctx.fillRect(12, 52, barW, 3);
    }
  }

  if (state === STATE.TITLE) drawTitleScreen();
  if (state === STATE.OVER) drawGameOver();

  // Achievement toast
  if (achievementToast && achievementToast.timer > 0) {
    achievementToast.timer--;
    const alpha = Math.min(achievementToast.timer / 30, 1);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#1a1a2e';
    roundRect(ctx, W / 2 - 120, H - 60, 240, 35, 6);
    ctx.fill();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1;
    roundRect(ctx, W / 2 - 120, H - 60, 240, 35, 6);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 13px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(achievementToast.text, W / 2, H - 38);
    ctx.globalAlpha = 1;
  }

  // Achievement overlay
  if (showAchievementOverlay) {
    ctx.fillStyle = 'rgba(10,10,30,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText('ACHIEVEMENTS', W / 2, 40);
    ctx.font = '10px "Courier New", monospace';
    ctx.fillStyle = '#aaa';
    ctx.fillText('Press A to close', W / 2, 58);
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
      const a = ACHIEVEMENTS[i];
      const unlocked = unlockedAchievements.includes(a.id);
      const y = 85 + i * 50;
      ctx.textAlign = 'left';
      ctx.font = '18px sans-serif';
      ctx.fillText(unlocked ? a.icon : '🔒', 30, y + 4);
      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = unlocked ? '#fff' : '#555';
      ctx.fillText(a.name, 60, y);
      ctx.font = '11px "Courier New", monospace';
      ctx.fillStyle = unlocked ? '#16c79a' : '#444';
      ctx.fillText(unlocked ? '✓ Unlocked' : '???', 60, y + 16);
    }
    ctx.fillStyle = '#aaa';
    ctx.textAlign = 'center';
    ctx.font = '12px "Courier New", monospace';
    ctx.fillText(unlockedAchievements.length + '/' + ACHIEVEMENTS.length, W / 2, H - 20);
  }
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
  // Skin selector
  const skin = SKINS[selectedSkin];
  const unlocked = skin.unlock();
  ctx.fillStyle = unlocked ? '#fff' : '#555';
  ctx.font = '14px "Courier New", monospace';
  ctx.fillText('◀  ' + skin.name + '  ▶', W / 2, H / 2 + 110);
  ctx.font = '10px "Courier New", monospace';
  ctx.fillStyle = unlocked ? '#16c79a' : '#e94560';
  ctx.fillText(unlocked ? '✓ Unlocked' : '🔒 ' + skin.hint, W / 2, H / 2 + 126);
  // Preview ball
  if (unlocked) {
    skin.draw(ctx, W / 2, H / 2 + 150, 12);
  } else {
    ctx.fillStyle = '#333';
    ctx.beginPath(); ctx.arc(W / 2, H / 2 + 150, 12, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#666'; ctx.font = '14px sans-serif';
    ctx.fillText('?', W / 2, H / 2 + 155);
  }
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