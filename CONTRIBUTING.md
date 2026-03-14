# 🛠️ Contributing Guide

Guide to understanding and extending Pixel Bounce architecture.

---

## Architecture Overview

### Game States (STATE)

```javascript
const STATE = { 
  TITLE: 0,   // Main menu
  PLAY: 1,    // Active gameplay
  OVER: 2,    // Game over screen
  DAILY: 3,   // Daily challenge mode
  EDITOR: 4,  // Level editor
  GALLERY: 5, // Community gallery browser
  LOBBY: 6    // Multiplayer lobby
};
```

Each state has dedicated render + input logic in the main loop.

### Core Game Loop

```javascript
function gameLoop() {
  update();    // Physics, collision, state transitions
  draw();      // Render canvas
  requestAnimationFrame(gameLoop);
}

update() {
  // Physics: gravity, velocity, collisions
  // AI: platform generation
  // Logic: score, power-ups, achievements
}

draw() {
  // Clear canvas
  // Draw background
  // Draw platforms, ball, stars, effects
  // Draw UI (score, buttons)
}
```

### Key Data Structures

#### Player Ball

```javascript
let ball = {
  x: 200,           // Position (pixels)
  y: 500,
  vx: 0,            // Velocity
  vy: 0,
  radius: 8,
  skin: 'default'   // Cosmetic appearance
};
```

#### Platforms

```javascript
let platforms = [
  {
    x: 100,
    y: 450,
    width: 60,
    height: 12,
    type: 'normal',         // normal, bouncy, breakable, portal
    remaining: 0,           // For breakable platforms
    color: '#4CAF50',
    active: true
  }
];
```

#### Stars (Collectibles)

```javascript
let stars = [
  {
    x: 150,
    y: 400,
    collected: false,
    scale: 1,
    spin: 0
  }
];
```

#### Power-Ups

```javascript
let powerups = [
  {
    x: 200,
    y: 350,
    type: 'shield',         // shield, magnet, slowmo, boost
    collected: false,
    icon: '🛡️'
  }
];

let activePower = {
  type: 'shield',
  timer: 300,              // Frames remaining
  maxTimer: 300
};
```

#### Achievements

```javascript
const ACHIEVEMENTS = {
  'sky_is_limit': {
    name: 'Sky is the Limit',
    desc: 'Reach height 5000',
    icon: '🚀',
    unlock: (stats) => stats.maxHeight >= 5000
  },
  'star_collector': {
    name: 'Star Collector',
    desc: 'Collect 100 stars',
    icon: '⭐',
    unlock: (stats) => stats.totalStars >= 100
  }
  // ... 18 more
};
```

---

## How to Add Features

### 1️⃣ Add a New Ball Skin

**Location:** `game.js`, search for `BALL_SKINS`

```javascript
const BALL_SKINS = {
  default: { name: 'Default', color: '#FF6B6B', emoji: '⚽' },
  fire: { name: 'Fire', color: '#FF4500', emoji: '🔥' },
  neon: { name: 'Neon', gradient: true, emoji: '⚡' },
  // Add your skin here:
  myskin: { name: 'My Skin', color: '#ABC123', emoji: '🎯' }
};
```

Then in `drawBall()`:

```javascript
function drawBall() {
  const skin = BALL_SKINS[ball.skin];
  
  if (skin.gradient) {
    // Handle gradient skins
    let grad = ctx.createRadialGradient(ball.x, ball.y, 0, ball.x, ball.y, ball.radius);
    grad.addColorStop(0, '#FFD700');
    grad.addColorStop(1, '#FF6B6B');
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = skin.color;
  }
  
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw emoji or custom shape
  if (skin.emoji) {
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(skin.emoji, ball.x, ball.y);
  }
}
```

**Unlock condition:**

```javascript
// In checkAchievements() or in editor
if (unlockedAchievements.includes('myskinuniverse')) {
  availableSkins.push('myskin');
}
```

---

### 2️⃣ Add a New Achievement

**Location:** `game.js`, search for `ACHIEVEMENTS`

```javascript
const ACHIEVEMENTS = {
  // ... existing achievements ...
  
  'my_awesome_badge': {
    name: 'Awesome Badge',
    desc: 'Do something cool',
    icon: '🏆',
    unlock: (stats) => {
      // Return true when condition is met
      return stats.consecutive_bounces >= 50;
    }
  }
};
```

**Add unlock check in update():**

```javascript
function checkAchievements() {
  Object.entries(ACHIEVEMENTS).forEach(([id, ach]) => {
    if (!unlockedAchievements.includes(id) && ach.unlock(gameStats)) {
      unlockedAchievements.push(id);
      // Show toast notification
      showAchievementUnlock(ach);
    }
  });
}
```

**Call in update():**

```javascript
if (state === STATE.PLAY) {
  // ... game logic ...
  checkAchievements();
}
```

---

### 3️⃣ Add a New Power-Up Type

**Location:** `game.js`, search for `POWER_UP_TYPES`

```javascript
const POWER_UP_TYPES = {
  shield: {
    name: 'Shield',
    icon: '🛡️',
    duration: 300,          // Frames
    effect: () => { /* applied in update() */ }
  },
  magnet: {
    name: 'Magnet',
    icon: '🧲',
    duration: 300,
    effect: () => { /* auto-collect stars */ }
  },
  
  // Add your power-up:
  freeze: {
    name: 'Freeze',
    icon: '❄️',
    duration: 200,
    effect: () => {
      // Freeze all moving platforms
      platforms.forEach(p => p.frozen = true);
    }
  }
};
```

**Add rendering in drawPowerup():**

```javascript
function drawPowerup(pu) {
  const type = POWER_UP_TYPES[pu.type];
  
  ctx.fillStyle = '#FFD700';  // Gold
  ctx.beginPath();
  ctx.arc(pu.x, pu.y, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // Icon
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(type.icon, pu.x, pu.y + 5);
}
```

**Add pickup logic in update():**

```javascript
function checkPowerupCollision() {
  powerups.forEach((pu, i) => {
    if (dist(ball, pu) < ball.radius + 12) {
      activatePowerup(pu.type);
      powerups.splice(i, 1);
    }
  });
}
```

---

### 4️⃣ Add a New Platform Type

**Location:** `game.js`, search for `PLATFORM_TYPES`

```javascript
const PLATFORM_TYPES = {
  normal: {
    name: 'Normal',
    bounceFactor: 1.0,
    color: '#4CAF50',
    breakable: false
  },
  bouncy: {
    name: 'Bouncy',
    bounceFactor: 2.0,
    color: '#FF9800',
    breakable: false
  },
  
  // Add your platform:
  slippery: {
    name: 'Slippery',
    bounceFactor: 0.8,
    color: '#87CEEB',  // Sky blue (icy)
    breakable: false,
    friction: 0.1      // Low friction
  }
};
```

**Add rendering in drawPlatform():**

```javascript
function drawPlatform(p) {
  const type = PLATFORM_TYPES[p.type];
  
  ctx.fillStyle = type.color;
  
  if (type.name === 'Slippery') {
    // Add visual indicator (diagonal stripes)
    ctx.globalAlpha = 0.8;
  }
  
  ctx.fillRect(p.x, p.y, p.width, p.height);
  
  if (type.name === 'Slippery') {
    // Draw ice pattern
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    for (let i = 0; i < p.width; i += 10) {
      ctx.beginPath();
      ctx.moveTo(p.x + i, p.y);
      ctx.lineTo(p.x + i + 5, p.y + p.height);
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  }
  
  ctx.fillStyle = '#000';
}
```

**Add bounce logic in collideWithPlatform():**

```javascript
function collideWithPlatform(ball, platform) {
  // ... existing collision code ...
  
  const type = PLATFORM_TYPES[platform.type];
  
  // Apply bounce
  ball.vy = -Math.abs(ball.vy) * type.bounceFactor;
  
  // Apply friction if slippery
  if (type.friction) {
    ball.vx *= (1 - type.friction);
  }
}
```

---

### 5️⃣ Add a New Daily Challenge Modifier

**Location:** `game.js`, search for `DAILY_MODIFIERS`

```javascript
const DAILY_MODIFIERS = {
  double_gravity: {
    name: '2x Gravity',
    icon: '⬇️',
    apply: () => { GRAVITY = 0.6; }  // Default: 0.3
  },
  star_rain: {
    name: 'Star Rain',
    icon: '⭐',
    apply: () => { STAR_SPAWN_RATE = 0.5; }  // More stars
  },
  
  // Add your modifier:
  neon_lights: {
    name: 'Neon Lights',
    icon: '💡',
    apply: () => {
      document.body.style.background = 'radial-gradient(circle, #FF00FF, #00FFFF)';
      // Add neon styling
    }
  }
};
```

---

## Code Style Guidelines

### Naming Conventions

```javascript
// Constants: UPPER_SNAKE_CASE
const GRAVITY = 0.3;
const MAX_HEIGHT = 9999;
const POWER_UP_TYPES = { /* ... */ };

// Variables: camelCase
let ballVelocity = 0;
let currentScore = 0;
let isGameOver = false;

// Functions: camelCase
function drawBall() { /* ... */ }
function checkPlatformCollision() { /* ... */ }
function updatePhysics() { /* ... */ }

// Objects/Classes: PascalCase
let Game = { /* ... */ };
let Player = { /* ... */ };
```

### Function Organization

```javascript
// Main loop first
function gameLoop() { /* ... */ }

// State updates
function update() { /* ... */ }

// Rendering
function draw() { /* ... */ }

// Collision helpers
function checkCollisions() { /* ... */ }

// UI/Input handlers
function handleInput() { /* ... */ }
```

### Comments

```javascript
// Only comment complex logic or "why", not "what"

// ❌ Bad: Obvious from code
let x = ball.x; // Set x to ball x

// ✅ Good: Explains intent
// Apply client-side prediction for <100ms latency
let predictedX = ball.x + ball.vx * (latency / 16);

// ❌ Too much
function collide() {
  // Check if ball hits platform
  if (ball.y + ball.radius >= p.y) {
    // Bounce
    ball.vy = -ball.vy;
  }
}

// ✅ Clear, minimal
function collide() {
  if (isBallOnPlatform()) {
    ball.vy = -ball.vy; // Bounce physics
  }
}
```

---

## Project Structure

```
pixel-bounce/
├── index.html           # UI layout (title, game, editor, gallery, lobby)
├── game.js              # ALL game logic (3500 lines)
│   ├── Initialization
│   ├── Game loop
│   ├── State machines
│   ├── Physics + collision
│   ├── Rendering
│   ├── Level editor
│   ├── Community gallery
│   ├── Multiplayer (WebSocket)
│   ├── Achievements + daily
│   └── UI handlers
├── style.css            # Styling (responsive, dark mode)
├── server/
│   ├── index.js         # Express + Socket.io server
│   └── package.json
├── README.md            # User guide
├── roadmap.md           # v2.0 features & phases
├── DEPLOYMENT.md        # Deploy guide
└── CONTRIBUTING.md      # This file
```

---

## Testing During Development

### Manual Testing Checklist

- [ ] **Gameplay:** Ball bounces, platforms generate, score increases
- [ ] **Editor:** Can place/delete platforms, stars, export JSON
- [ ] **Gallery:** Can browse, rate levels, play community levels
- [ ] **Multiplayer:** Can join lobby, see other players, race syncs
- [ ] **Achievements:** Badges unlock, toast notifications appear
- [ ] **Daily:** Challenge loads with correct modifier, leaderboard appears
- [ ] **Mobile:** Touch controls work, responsive layout
- [ ] **Performance:** 60fps maintained, no lag spikes

### Browser Console (`F12`)

Check for errors:
```javascript
// Console should be clean
// If errors appear:
// 1. Check WebSocket connection: `console.log(socket.connected)`
// 2. Check state: `console.log(state)`
// 3. Check ball position: `console.log(ball)`
```

### Network Tab (`F12` → Network)

For multiplayer testing:
- Watch WebSocket messages in real-time
- Check message size (should be <500 bytes per frame)
- Look for dropped connections

---

## Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Ball falls through platform | Collision detection too loose | Tighten radius check: `< ball.radius` not `<=` |
| Score jumps randomly | Achievement unlock adds points | Separate achievement score from game score |
| Editor crashes on export | Circular reference in level JSON | Validate all objects before `JSON.stringify()` |
| Multiplayer desync | Client prediction mismatch | Use server-authoritative position every 5 frames |
| Memory leak on long play | Particles/stars never removed | Clear old arrays: `particles = particles.filter(p => p.active)` |
| Mobile touch unresponsive | Event listeners not registered | Use `touchstart`/`touchmove`, not just `click` |

---

## Performance Tips

### Optimize Rendering

```javascript
// ❌ Bad: Redraw everything every frame
ctx.clearRect(0, 0, W, H);
// Redraw all platforms...

// ✅ Good: Only clear/redraw visible area
ctx.clearRect(0, 0, W, H);
// Use dirty rect optimization for large games
```

### Optimize Physics

```javascript
// ❌ Bad: Check all collision pairs
for (let i = 0; i < platforms.length; i++) {
  for (let j = 0; j < stars.length; j++) {
    checkCollision(platforms[i], stars[j]);
  }
}

// ✅ Good: Spatial partitioning (for 100+ objects)
let grid = createSpatialGrid();
let nearbyObjects = grid.query(ball.x, ball.y, 100);
```

### Optimize Events

```javascript
// ❌ Bad: Listen to every mousemove
document.addEventListener('mousemove', (e) => {
  // Heavy logic
});

// ✅ Good: Throttle or use requestAnimationFrame
let lastInputTime = 0;
document.addEventListener('mousemove', (e) => {
  if (Date.now() - lastInputTime > 16) {  // ~60fps
    lastInputTime = Date.now();
    // Handle input
  }
});
```

---

## Questions?

Check existing code for examples:
- **How do I add a UI button?** Search for `drawButton` in game.js
- **How does multiplayer sync work?** Search for `socket.emit` in game.js
- **How are levels saved?** Search for `export_level()` in game.js

Feel free to open GitHub issues for architecture questions!
