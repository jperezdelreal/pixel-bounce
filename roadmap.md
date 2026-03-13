# 🎮 Pixel Bounce — v2.0 Roadmap

## Current State (v1.x)

**Pixel Bounce v1.x** is a functional HTML5 Canvas arcade game with core mechanics:
- Single-player endless climbing gameplay
- Touch + keyboard controls
- Moving platforms, star collectibles, particle effects
- High score persistence (localStorage)
- GitHub Pages deployment
- ~300 lines, zero dependencies

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

**Phase 1 (v1.x Polish)** — *Current*
- Address mobile touch lag
- Fix platform generation algorithm
- Add audio (SFX + BGM)

**Phase 2 (Social Features)** — *~3-4 weeks*
- Implement Multiplayer Race Mode (#1)
- Achievement System (#3)

**Phase 3 (Creative Tools)** — *~3-4 weeks*
- Build Level Editor (#2)
- Community gallery backend

**Phase 4 (Monetization/Engagement)** — *~2 weeks*
- Custom Skins + Shop (#4)
- Power-Ups (#5)

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

1. **Monetization?** Free-to-play with optional cosmetics? Or fully free?
2. **Backend hosting cost?** Stay within €20/mo budget or scale on-demand?
3. **Mobile app?** PWA first, or native iOS/Android via Capacitor?

---

**Last Updated:** 2025-03-17  
**Maintained by:** Syntax Sorcery (Oracle)
