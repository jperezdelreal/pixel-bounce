# Decisions Archive — Pixel Bounce

> **TLDR:** Archived decisions from decisions.md. Entries older than 14 days are moved here to keep the active file lean.

---

### 2025-01-20T00:00Z: JSON Schema Versioning for Level Import/Export
**By:** Cut Man
**Tier:** T1
**Status:** ✅ ACTIVE
**What:** Level export JSON includes `version: 1` field alongside platforms, stars, spawn point, and metadata (author, created timestamp). Schema: `{ version, platforms[], stars[], spawn{x,y}, metadata{author, created} }`.
**Why:** Future-proof versioning enables schema migrations as editor gains features. Importers can detect and upgrade older formats. Metadata tracks level provenance without affecting gameplay.
**Rationale:** Version field + backwards-compatible structure + optional metadata = forward compatibility without breaking existing levels.
**Related:** Issue #23 (Import/Export), PR #31
**Owner:** Cut Man
**Next Review:** When moving platform direction feature planned

---

### 2025-07-18T00:00Z: Validation Modal UX Pattern
**By:** Guts Man
**Tier:** T1
**Status:** ✅ ACTIVE
**What:** Validation runs on [P]review button press. Shows blocking modal listing up to 10 errors. Invalid platforms highlighted red. [F] key auto-fixes (clamps bounds, removes overlaps, trims excess). [V] dismisses modal. Reuses achievement overlay pattern.
**Why:** Non-destructive (editing continues), clear feedback (visual + text), guided fix (one-click remediation), consistent UX pattern. Establishes quality gate before preview/export.
**Implementation:** Auto-fix conservative: keeps first platform in overlaps, validates startup safety.
**Related:** Issue #24 (Level Validation), PR #30
**Owner:** Guts Man
**Next Review:** When validation rules expand to stars/difficulty

---

### 2025-01-20T00:00Z: Backend Architecture Decision — Community Gallery
**By:** Proto Man (Lead/Architect)
**Tier:** T1
**Status:** ✅ IMPLEMENTED
**Issue:** #27 — Community Gallery
**What:** Implement client-side first approach with pluggable LevelAPI abstraction layer. Storage: `localStorage` key `pixelbounce_gallery`. Data structure includes version, platforms, stars, spawn, metadata (name, description, difficulty, tags, author, created), plays, rating, ratingCount. Features: gallery browse with sorting (recent, popular, top-rated), level thumbnails (offscreen canvas), play community levels, post-game rating (1-5 stars), upload from editor, 5 demo levels.
**Why:** Constraints — GitHub Actions environment cannot create external service accounts programmatically, need working feature immediately, must remain future-proof. Benefits — ships immediately with zero backend cost, validates UGC adoption (40% D7 retention target) before expensive infrastructure investment, seamless upgrade path (swap LevelAPI internals to REST when ready).
**Rationale:** Client-side first is valid, not every feature needs a backend on day 1. Abstraction layers enable progressive enhancement: localStorage → REST API → Real-time sync → Cross-device.
**Alternatives Considered:** Option A (Supabase/Firebase first) rejected — requires manual account setup, blocks delivery. Option B (GitHub Gists) rejected — architectural smell, rate limits, bad UX. Option C (localStorage only, no abstraction) rejected — couples game logic to storage, expensive refactor later.
**Implementation:** LevelAPI abstraction with four methods (save, list, get, rate). Game code changes: zero when backend integrates. Demo levels showcase platform variety: Skyward Bounce (Medium), Glass Gauntlet (Hard), Rhythm Rush (Hard), Bounce Haven (Easy), Portal Maze (Expert).
**Code Quality:** Vanilla JS style, reuses existing UI patterns, consistent with editor architecture, maintains 60fps (offscreen canvas for thumbnails).
**Tech Debt:** None — clean abstraction, no shortcuts.
**Next Steps:** Validate adoption (monitor localStorage stats), gather user feedback, choose backend (Supabase vs Firebase vs Custom, deferred to Wave 2). Backend integration checklist: REST API schema, authentication (GitHub OAuth/anonymous), migration tool (export localStorage → backend), moderation, search/filtering.
**Risk Level:** Low (localStorage well-supported, abstraction enables future swap).
**Owner:** Proto Man
**Next Review:** When backend integration planned (Issue #26+)

---

### 2025-01-27T00:00Z: Multiplayer Architecture Decision — Node.js + Socket.io
**By:** Proto Man (Lead/Architect)
**Tier:** T1
**Status:** ✅ IMPLEMENTED
**Issue:** #28 — Multiplayer Foundation
**What:** Stack: Node.js + Socket.io + Express. Server structure: `server/package.json`, `server/index.js`, `server/Room.js`, `server/.env.example`. Features: Private rooms (6-char codes), quick match, ready system, rate limiting (20 msg/sec), disconnect handling, auto room cleanup. Client: `GAME_SERVER_URL` config, `MultiplayerClient` abstraction, new `STATE.LOBBY`, lobby UI ('M' key), ping calculation (2s roundtrip). Socket events: create-room, join-room, quick-match, ready, leave-room (client→server); room-update, countdown, race-start, player-left, matched, pong (server→client).
**Why:** Socket.io handles complexity (WebSocket fallbacks, reconnection, room management). Minimal dependencies (socket.io + express). Easy deployment (free tier). Familiar tech (JS end-to-end). Battle-tested (industry standard). Rate limiting essential. Auto-cleanup prevents memory leaks. Ping display critical for UX.
**Rationale:** WebSocket-only rejected (manual reconnection work). WebRTC rejected (NAT issues, signaling anyway). Supabase Realtime rejected (overkill). Colyseus/Photon rejected (too heavy).
**Implementation:** Room state machine handles lobby flow. Rate limiting via token bucket. Confusing chars avoided in codes (0/O, 1/I/l). Room codes: 6 alphanumeric. Auto-cleanup on 5min idle.
**Code Quality:** 350+ lines server, 150+ lines Room.js, 300+ lines client game.js. State.LOBBY added. Consistent with existing patterns.
**Files Changed:** server/package.json, server/index.js, server/Room.js, server/.env.example, game.js.
**Testing:** ✅ Server starts, ✅ client connects, ✅ room creation, ✅ join by code, ✅ quick match, ✅ ready system, ✅ countdown sync. Pending: production deploy, GitHub Pages test, load test.
**Tech Debt:** None — Socket.io room system perfect fit. Separation in server/ directory keeps client clean.
**Next Steps:** Deploy to production (Render/Fly.io), implement actual multiplayer race gameplay Phase 4. Password option, report/ban system, monitoring deferred.
**Risk Level:** Low (Socket.io battle-tested, ~100 concurrent rooms supported).
**Owner:** Proto Man
**Next Review:** After production deploy and Phase 4 race gameplay start

---

### 2026-01-27T00:00Z: Sprint Planning Decision — Post-Phase 3
**By:** Proto Man (Lead & Architect)
**Tier:** T1
**Status:** ✅ COMPLETED (Phase 3 Final — 2026-03-15)
**Summary (Archived):** Phase 3 roadmap 100% complete. All 8 issues merged. Project growth: v1.0 (300 lines) → v2.0 (3466 game.js + 500 server). Features: Level Editor, Import/Export, Validation, Metadata, Community Gallery, Leaderboards, Multiplayer Foundation, Race Mode. All acceptance criteria met (issue #50). Roadmap vision fulfilled. Natural endpoint reached. Project complete 2026-03-15.
**Owner:** Proto Man
**Status:** ✅ COMPLETED

---

**Archive Updated:** 2026-03-15T10:30Z by Scribe  
**Reason:** decisions.md exceeded 5KB threshold. Archived 2026-01-27 entry (47 days old) to reduce active file size.
