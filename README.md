# 🎮 Pixel Bounce — v2.0

**HTML5 multiplayer platformer with level editor, community gallery, and achievements.** Bounce your ball upward, climb endless platforms, create custom levels, and compete with players worldwide.

## 🕹️ Play Now

**[▶ Play Pixel Bounce](https://jperezdelreal.github.io/pixel-bounce/)**

---

## 🎮 How to Play

### Keyboard Controls

| Action | Keys |
|--------|------|
| Move Left/Right | `Arrow Keys` or `WASD` |
| Editor Mode | `E` |
| Community Gallery | `C` |
| Multiplayer Lobby | `M` |
| Achievements | `A` |
| Preview Level | `P` (in Editor) |
| Goal | **Bounce higher, collect ⭐ stars, beat your high score** |
| Game Over | Don't fall off the bottom of the screen! |

### Mobile Controls

- **Touch left side** — move left
- **Touch right side** — move right
- **Full screen** — responsive touch UI

---

## ✨ Features

### Gameplay
- 🏃 **Endless climbing** — procedurally generated platforms
- ⭐ **Star collectibles** — +25 points each
- 🎨 **Particle effects** — visual feedback on bounces & collects
- 📊 **High score tracking** — persistent storage (localStorage)
- 🎯 **60fps smooth gameplay** — optimized Canvas rendering

### Editor & Community
- ✏️ **Level Editor** — drag-and-drop platform placement, star/spawn points
- 🎨 **Visual themes** — neon, retro, nature, space platform styles
- 📦 **Import/Export** — JSON-based level sharing
- 🏆 **Community Gallery** — browse, rate, play user-created levels
- 🏅 **Level metadata** — author, difficulty, plays, ratings

### Progression & Challenges
- 🎖️ **Achievement system** — 20+ badges (height, stars, skill-based)
- 📅 **Daily challenges** — seeded modifier runs with unique rules
- 💪 **Power-ups** — Shield (1 forgiveness), Magnet (auto-collect), Slow-Mo (50% gravity), Boost (super jump)
- 🎪 **Special platforms** — Bouncy (2× bounce), Breakable (1 use), Portal (teleport)
- 🎨 **Custom skins** — 15+ ball cosmetics, unlocked via achievements

### Multiplayer
- 👥 **Live multiplayer races** — 2-4 players, WebSocket real-time sync
- 👻 **Ghost trails** — see other players' positions
- 🏁 **Instant leaderboards** — post-race rankings
- 🎮 **Matchmaking lobby** — quick match or private rooms

---

## 🏗️ Architecture

### Frontend (Client)
- **Framework:** Vanilla JavaScript (ES6)
- **Rendering:** HTML5 Canvas (60fps)
- **Network:** WebSocket API (multiplayer)
- **Storage:** LocalStorage (high scores, cosmetics, settings)
- **Deployment:** GitHub Pages (static)

### Backend (Server)
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Realtime:** Socket.io (WebSocket server)
- **Database:** MongoDB/Supabase (levels, user data)
- **Deployment:** Render (free tier) or Heroku

### Tech Stats
- **~3500 lines** of game logic, editor, multiplayer, UI
- **Zero build step** — plain HTML/JS/CSS
- **Zero client dependencies** — pure Canvas API
- **Instant load** — single page app

---

## 🚀 How to Play Online

Visit **[GitHub Pages](https://jperezdelreal.github.io/pixel-bounce/)** to play immediately. No installation required.

---

## 💻 How to Run Locally

### Prerequisites
- Node.js 18+ (for multiplayer server only)
- A modern web browser

### Single-Player (No Server)

```bash
git clone https://github.com/jperezdelreal/pixel-bounce.git
cd pixel-bounce
open index.html  # or drag index.html into your browser
```

### Multiplayer (With Server)

```bash
git clone https://github.com/jperezdelreal/pixel-bounce.git
cd pixel-bounce

# Terminal 1: Start the WebSocket server
cd server
npm install
npm start
# Server runs on http://localhost:3000

# Terminal 2: Open the game
cd ..
open index.html
# Visit http://localhost:5500 (if using Live Server) or serve via any HTTP server
```

For full deployment instructions (staging, production), see [**DEPLOYMENT.md**](./DEPLOYMENT.md).

---

## 🎯 Project Structure

```
pixel-bounce/
├── index.html          # Main game UI, multiplayer lobby, editor
├── game.js             # Core game engine, editor, gallery, achievements
├── style.css           # Styling (responsive, themes)
├── server/             # WebSocket multiplayer server
│   ├── index.js        # Express + Socket.io server
│   └── package.json
├── README.md           # This file
├── roadmap.md          # v2.0 feature roadmap & phases
├── DEPLOYMENT.md       # Deployment guide
└── CONTRIBUTING.md     # Architecture & extension guide
```

---

## 🛠️ Development

### Code Style
- ES6+ syntax
- Vanilla JS (no frameworks in client)
- Clear function names, minimal comments
- Canvas drawing in `draw()`, game logic in `update()`

### How to Extend
- **Add power-ups:** Edit `POWER_UP_TYPES` in game.js, add pickup logic to `update()`
- **Add achievements:** Add badge definition to `ACHIEVEMENTS`, unlock logic to `checkAchievements()`
- **Add platform types:** Edit `PLATFORM_TYPES`, add rendering to `drawPlatform()`
- **Add ball skins:** Edit `BALL_SKINS`, add rendering to `drawBall()`

See [**CONTRIBUTING.md**](./CONTRIBUTING.md) for detailed architecture guide.

---

## 🚁 Phase 3 (v2.0) — Complete ✅

All features shipped:
- ✅ Level Editor & Community Gallery
- ✅ Multiplayer Race Mode
- ✅ Achievement System & Daily Challenges
- ✅ Power-ups & Special Platforms
- ✅ Custom Ball Skins & Themes
- ✅ Multiplayer Lobby & Matchmaking
- ✅ Community Leaderboards
- ✅ WebSocket Server

See [**roadmap.md**](./roadmap.md) for detailed feature breakdown.

---

## 📄 License

MIT — Feel free to fork, modify, and redistribute.

---

## 🙏 Credits

Built by **[Syntax Sorcery](https://github.com/jperezdelreal/Syntax-Sorcery)** — Autonomous AI software development pipeline.

Produced by the Syntax Sorcery Proposal→Prototype→Polish workflow. Showcases full-stack game development: gameplay, editor, social features, multiplayer architecture. 🚀