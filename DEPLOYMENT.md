# 📦 Deployment Guide

Complete guide for running Pixel Bounce locally and deploying to production.

---

## Prerequisites

- **Node.js:** 18.x or higher (for multiplayer server)
- **npm:** 8.x or higher
- **Git:** for cloning the repository
- **Modern browser:** Chrome, Firefox, Safari, Edge (last 2 versions)

---

## Local Development

### Single-Player Mode (No Backend)

Fastest setup — just the client, no server:

```bash
# Clone the repository
git clone https://github.com/jperezdelreal/pixel-bounce.git
cd pixel-bounce

# Open in browser (macOS)
open index.html

# Open in browser (Windows)
start index.html

# Or use VS Code Live Server
# Install: Live Server extension in VS Code
# Right-click index.html → "Open with Live Server"
```

**Server URL fallback:** Client auto-detects if multiplayer server is offline and disables multiplayer features gracefully.

### Multiplayer Mode (With Server)

Full setup for local testing of multiplayer features:

#### Terminal 1: Start WebSocket Server

```bash
cd pixel-bounce/server
npm install
npm start
```

Output:
```
Server running on http://localhost:3000
WebSocket ready for connections
```

**Environment variables** (optional, defaults work for local):

```bash
# .env (create in server/ directory)
PORT=3000
CORS_ORIGINS=http://localhost:5500,http://localhost:3000,file://
LOG_LEVEL=debug
```

#### Terminal 2: Start Client

```bash
# In pixel-bounce/ root directory
open index.html  # macOS
# or
start index.html  # Windows
# or
python -m http.server 5500  # Python 3
# or use Live Server in VS Code
```

Visit `http://localhost:5500` (or wherever your dev server runs).

### Testing Multiplayer Locally

1. Open two browser tabs/windows to `http://localhost:5500`
2. Click **Multiplayer (M)** in both tabs
3. Click **Quick Match** to enter the same lobby
4. Both players should sync in real-time

**Common issues:**

| Issue | Solution |
|-------|----------|
| "Connection refused" | Verify server is running: `npm start` in server/ folder |
| Cross-origin errors | Check `CORS_ORIGINS` in server/.env includes your dev URL |
| Ghost trails not showing | Confirm both clients connected to same WebSocket server |
| Desync in races | Check network latency — intentional client-side prediction for <100ms lag |

---

## Production Deployment

### Option A: GitHub Pages (Client Only)

Recommended for single-player + gallery browsing.

**Benefits:**
- Free hosting
- Automatic deployments from `main` branch
- Zero server costs
- Instant CDN

**Setup:**

1. **Enable GitHub Pages:**
   - Go to repo Settings → Pages
   - Source: Deploy from branch
   - Branch: `main` / root
   - Save

2. **Configure client:**

   Edit `game.js` line ~14:
   ```javascript
   const GAME_SERVER_URL = '';  // Disable multiplayer
   ```

3. **Push to main:**
   ```bash
   git add -A
   git commit -m "Deploy to GitHub Pages"
   git push origin main
   ```

4. **Access:**
   Your game is live at `https://YOUR_USERNAME.github.io/pixel-bounce/`

---

### Option B: Full Stack (Client + Server)

For full multiplayer support.

#### Client: GitHub Pages

Same as Option A, but keep `GAME_SERVER_URL` pointing to production server.

#### Server: Render (Free Tier)

Free Node.js hosting with WebSocket support.

**Step 1: Push server to GitHub**

```bash
# Ensure server/ is committed to git
git add server/
git commit -m "Add multiplayer server"
git push origin main
```

**Step 2: Create Render service**

1. Go to [render.com](https://render.com) and sign up
2. Click **New** → **Web Service**
3. Connect GitHub repository
4. Select `pixel-bounce` repository
5. Configure:
   - **Name:** `pixel-bounce-server`
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install`
   - **Start Command:** `cd server && npm start`
   - **Region:** US (East) or your closest region

6. **Environment Variables:**

   Click **Environment** → Add:
   ```
   PORT=10000  (Render assigns this automatically)
   CORS_ORIGINS=https://YOUR_USERNAME.github.io,https://pixel-bounce-server.render.com
   LOG_LEVEL=production
   NODE_ENV=production
   ```

7. Click **Create Web Service**

Render will deploy automatically. Wait ~5 minutes for build.

**Step 3: Update client**

Once server is live on Render:

```javascript
// game.js, line ~14
const GAME_SERVER_URL = 'https://pixel-bounce-server.render.com';
```

Push to GitHub:
```bash
git add game.js
git commit -m "Point to production WebSocket server"
git push origin main
```

GitHub Pages redeploys automatically.

**Verify deployment:**

1. Open https://YOUR_USERNAME.github.io/pixel-bounce/
2. Click **Multiplayer (M)**
3. Click **Quick Match**
4. Should connect to `pixel-bounce-server.render.com`

---

### Option C: Vercel (Full Stack)

Alternative to Render — slightly faster deploys, same free tier.

**Step 1: Create vercel.json**

```json
{
  "buildCommand": "cd server && npm install",
  "functions": {
    "server/index.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

**Step 2: Deploy**

```bash
npm install -g vercel
vercel login
vercel
```

Follow prompts. Vercel auto-deploys on `git push origin main`.

**Update client:**

```javascript
const GAME_SERVER_URL = 'https://YOUR_PROJECT.vercel.app';
```

---

## Environment Variables

### Server (server/.env)

```bash
# Port for WebSocket server
PORT=3000

# Comma-separated list of origins that can connect
# Example: http://localhost:5500,https://yourgame.com
CORS_ORIGINS=*

# Log level (development, debug, info, warn, error)
LOG_LEVEL=info

# Node environment
NODE_ENV=development

# Optional: Database URL (future use)
DATABASE_URL=

# Optional: Rate limiting
RATE_LIMIT_WINDOW=60000  # milliseconds
RATE_LIMIT_MAX_REQUESTS=1000
```

### Client (game.js)

```javascript
// Line ~14: WebSocket server URL
const GAME_SERVER_URL = 'http://localhost:3000';  // Local
const GAME_SERVER_URL = '';                       // Disable multiplayer
const GAME_SERVER_URL = 'https://your-server.com'; // Production
```

---

## Monitoring & Troubleshooting

### Server Health Checks

**Render dashboard:**
- Go to render.com → Your service
- Check logs in **Logs** tab
- Check metrics in **Metrics** tab

**Manual test:**

```bash
# Test WebSocket connection
node -e "
const io = require('socket.io-client');
const socket = io('https://your-server.com');
socket.on('connect', () => console.log('✅ Connected'));
socket.on('error', (e) => console.log('❌ Error:', e));
setTimeout(() => process.exit(), 3000);
"
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Multiplayer fails to connect | Server offline or wrong URL | Check `GAME_SERVER_URL` in game.js |
| "CORS blocked" error | Origin not whitelisted | Add origin to `CORS_ORIGINS` env var |
| Server crashes on cold start | Missing Node version | Set `NODE_ENV=18.x` in Render/Vercel |
| Races desync mid-game | High latency (>200ms) | Check network, consider server region |
| Levels don't persist | No database connected | Set `DATABASE_URL` (future feature) |

### View Server Logs

**Render:**
```bash
# In Render dashboard, click "Logs" tab
# Real-time streaming logs
```

**Vercel:**
```bash
# In Vercel dashboard, go to Deployments → Function Logs
```

**Local:**
```bash
# Terminal where server is running shows logs directly
npm start
# Ctrl+C to stop
```

---

## Scaling & Performance

### Client Optimization

Currently at **~3500 lines**, loads in <1 second on 4G.

**If game grows:**
- Code-split editor/gallery into separate bundles
- Use service workers for offline play
- Minify game.js for production

### Server Optimization

Current server handles **100+ concurrent players** on free tier.

**If you scale:**
- Add database (MongoDB Atlas free tier) for persistence
- Implement room-based isolation (not global state)
- Add Redis for session caching
- Use load balancing (Render's built-in scaling)

---

## Rollback

If deployment breaks:

### GitHub Pages

```bash
git revert HEAD  # Reverts last commit
git push origin main
# Redeploys automatically in ~1 minute
```

### Render

1. Go to Render dashboard
2. Click **Deployments** tab
3. Click previous working deployment → **Redeploy**

### Vercel

```bash
vercel rollback
# Reverts to previous working deployment
```

---

## Summary

| Setup | Difficulty | Multiplayer? | Cost | Time |
|-------|-----------|--------------|------|------|
| Local client only | ⭐ Easy | No | Free | 1 min |
| Local w/ server | ⭐⭐ Medium | Yes | Free | 5 min |
| GitHub Pages | ⭐ Easy | No | Free | 10 min |
| GitHub Pages + Render | ⭐⭐ Medium | Yes | Free | 20 min |
| Vercel full-stack | ⭐⭐ Medium | Yes | Free | 15 min |

---

**Need help?** Check game.js console errors (`F12` → Console tab) or server logs for WebSocket issues.
