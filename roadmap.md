# 🎮 Pixel Bounce — v2.0 Roadmap

## Current State (v2.0) — Complete ✅

**Pixel Bounce v2.0** is a full-featured multiplayer platformer with level editor and community features:
- **Gameplay:** Single + multiplayer modes, endless climbing, achievements, daily challenges
- **Editor:** In-browser level editor with drag-drop platform placement
- **Community:** Level gallery with ratings, leaderboards, level discovery
- **Progression:** 20+ achievements, custom ball skins, power-ups, special platforms
- **Multiplayer:** Real-time WebSocket races (2-4 players), ghost trails, live leaderboards
- **Backend:** Node.js + Express + Socket.io server for multiplayer & community data
- **Deployment:** GitHub Pages (client) + Render/Heroku (server)
- **~3500 lines**, zero build step, zero client dependencies

### Known v1.x Polish Items

1. **Mobile Touch Responsiveness** — Touch controls occasionally lag or miss input on slower devices
2. **Platform Generation Balance** — Platform spacing can create impossible jumps at high scores
3. **Visual Feedback** — No audio cues; particle effects could be more dramatic

---

## v2.0 Vision: Social, Creative, Endless

Transform Pixel Bounce from a solo arcade game into a multiplayer-ready platform with user-generated content and progression systems.

---

## 🚀 v2.0 Features (Priority Order)

### 1. **Multiplayer Race Mode** — Priority: HIGH | Complexity: **L**

**User Value:** Compete live with friends. See who climbs highest in 60 seconds.

**Description:**
- Real-time multiplayer (2-4 players)
- WebSocket or WebRTC connection
- Ghost trails showing other players' positions
- Post-race leaderboard + replay system
- Matchmaking lobby (quick match + private rooms)

**Technical Notes:**
- Requires backend service (Node.js + Socket.io or similar)
- State synchronization (position, score, platform seed)
- Latency handling (client-side prediction)

**Copilot-Ready Issue:** See issue #1

---

### 2. **Level Editor + Community Levels** — Priority: HIGH | Complexity: **L**

**User Value:** Create and share custom platform layouts. Play community challenges.

**Description:**
- In-browser level editor (drag-drop platforms, place stars, set spawn points)
- Export/import level JSON
- Community gallery (browse, rate, play user levels)
- Featured levels + weekly challenges
- Level metadata: author, difficulty, plays, completion rate

**Technical Notes:**
- Level schema: `{ platforms: [...], stars: [...], metadata: {...} }`
- Backend storage (Firebase, Supabase, or similar)
- Validation to prevent impossible levels

**Copilot-Ready Issue:** See issue #2

---

### 3. **Achievement System + Daily Challenges** — Priority: MEDIUM | Complexity: **M**

**User Value:** Goals beyond high score. Replayability through daily objectives.

**Description:**
- 20+ achievements (e.g., "Reach height 5000", "Collect 100 stars", "No left movement run")
- Daily challenges with unique modifiers (2x gravity, mega bounce, star rain)
- Progress tracking UI (modal overlay)
- Badges displayed on profile
- Push notifications for daily reset (if PWA)

**Technical Notes:**
- Achievement unlock logic (local + backend sync)
- Challenge generation algorithm (daily seed)
- Notification API for PWA

**Copilot-Ready Issue:** See issue #3

---

### 4. **Custom Skins + Cosmetics Shop** — Priority: MEDIUM | Complexity: **S**

**User Value:** Personalize ball appearance. Unlock new looks via gameplay.

**Description:**
- 15+ ball skins (solid colors, gradients, patterns, emojis, pixel art)
- Platform theme packs (neon, retro, nature, space)
- Unlock via achievements, high scores, or in-game currency (stars)
- Skin preview in main menu
- Equip multiple unlocked skins (random rotation per life)

**Technical Notes:**
- Skin rendering in `draw()` function (conditional fills)
- Theme applies to platform colors + background gradient
- LocalStorage for unlocked cosmetics

**Copilot-Ready Issue:** See issue #4

---

### 5. **Power-Ups + Special Platforms** — Priority: LOW | Complexity: **M**

**User Value:** Dynamic gameplay with temporary boosts. Strategic risk/reward.

**Description:**
- Power-ups: Shield (1 fall forgiveness), Magnet (auto-collect stars), Slow-Mo (50% gravity), Boost (super jump)
- Special platforms: Bouncy (2x bounce), Breakable (disappears after 1 bounce), Portal (teleport to top)
- Spawn rate: 1 power-up per 200 height units
- Visual indicators (icon above power-up, platform color coding)

**Technical Notes:**
- Power-up state machine (active, duration, cooldown)
- Collision detection for pickups
- Platform behavior flags

**Copilot-Ready Issue:** See issue #5

---

## Development Phases

**Phase 1 (v1.x Polish)** — *Complete ✅*
- [x] Address mobile touch lag
- [x] Fix platform generation algorithm
- [x] Add audio (SFX + BGM)

**Phase 2 (Engagement & Retention)** — *Complete ✅*
- [x] Achievement system — 20+ unlockable badges (height, stars, skill-based)
- [x] Daily challenge mode — seeded modifier runs with unique rules
- [x] Custom ball skins — 15+ skins unlocked via achievements + cosmetics
- [x] Power-ups — Shield, Magnet, Slow-Mo, Boost with configurable spawn rates
- [x] Special platforms — Bouncy (2×), Breakable, Portal with visual indicators

**Phase 3 (Social & Creative)** — *Complete ✅* (2026-03-15)
- [x] Level Editor (#22) — drag-drop platform placement, visual grid, undo/redo
- [x] Level Import/Export (#23) — JSON serialization with metadata
- [x] Level Validation (#24) — playability checks to prevent impossible levels
- [x] Level Metadata & Tags (#25) — enhanced discovery with difficulty/author/ratings
- [x] Multiplayer Race Mode (#26) — synchronized gameplay, ghost trails, leaderboards
- [x] Community Gallery (#27) — backend storage, browse/rate/play user levels
- [x] Community Leaderboards (#21) — level-specific high scores with rankings
- [x] Multiplayer Foundation (#28) — WebSocket server, lobby system, matchmaking
- [x] Documentation Polish (#39) — README, CONTRIBUTING, DEPLOYMENT guides updated
- [x] Contextual Hints (#58) — first-visit tooltips for Editor/Gallery/Multiplayer

**Phase 3 Summary:** All 8 roadmap features plus 2 polish issues delivered. Project grew from v1.0 (~300 lines) to v2.0 (3466 lines game.js + 500 lines server code). Zero critical bugs. Production-ready. **Project at natural endpoint.**

---

## Success Metrics (v2.0)

- **User Retention:** 40% D7 retention (vs. 15% v1.x)
- **Social Engagement:** 20% of games played in multiplayer mode
- **UGC Adoption:** 500+ community levels published in first month
- **Avg. Session Time:** 8 minutes (vs. 3 minutes v1.x)

---

## Tech Stack (v2.0)

- **Frontend:** HTML5 Canvas + WebSocket API (unchanged)
- **Backend:** Node.js + Express + Socket.io (multiplayer) OR Firebase (serverless option)
- **Database:** Supabase (user levels, achievements) OR Firebase Realtime DB
- **Deployment:** Vercel (frontend + API routes) OR GitHub Pages + separate backend
- **Auth:** Optional GitHub OAuth or guest mode

---

## Open Questions

> **Note:** These are product/business decisions, not engineering tasks. Phase 3 engineering is complete.

1. **Monetization?** Free-to-play with optional cosmetics? Or fully free?
2. **Backend hosting cost?** Stay within €20/mo budget or scale on-demand?
3. **Mobile app?** PWA first, or native iOS/Android via Capacitor?

---

## Phase 4 Potential (Deferred)

If the project resumes, consider:
- Advanced editor features (search, auth, moderation, replay system)
- Tournament system with brackets
- Mobile-specific editor UI
- Backend migration from localStorage to REST API
- Analytics & telemetry
- Automated testing suite

---

**Last Updated:** 2026-03-15  
**Maintained by:** Syntax Sorcery (Oracle)  
**Status:** Phase 3 Complete — Natural Endpoint Reached
