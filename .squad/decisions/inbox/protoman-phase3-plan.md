# Phase 3 Strategic Plan — Proto Man Decision

**Date:** 2025-01-20  
**Decision Maker:** Proto Man (Lead/Architect)  
**Context:** Issue #20 — Define next roadmap after Phase 2 completion  

---

## Executive Summary

Phase 3 will be executed in **3 waves** over 8 issues (#21-#28), starting with client-only features and progressively adding backend complexity. This approach minimizes risk, delivers value early, and allows us to learn before committing to expensive infrastructure.

**Total estimated effort:** 6-8 weeks (assuming 1 issue/week average)

---

## Strategic Order: Why This Sequence?

### Wave 1: Client-Only Foundation (Issues #21-#23, #25)
**Start here because:**
- Zero backend cost (stays on GitHub Pages)
- High user value (level editor = creative expression)
- Can ship incrementally and gather feedback
- Tests our vanilla JS + Canvas stack at scale (complex UI)
- No deployment complexity (just merge to main)

**Issues:**
1. **#21: Level Editor Core** (Cut Man) — Drag-drop platform builder with grid snapping, 4 platform types, star placement, preview mode. Foundation for all UGC features.
2. **#22: Level Import/Export** (Copilot) — JSON serialization, clipboard copy/paste, file download/upload. Enables sharing before backend exists.
3. **#25: Level Metadata** (Copilot) — Name, description, difficulty, tags. Must land before #24 to avoid schema migration.
4. **#23: Level Validation** (Guts Man) — Playability checks, overlap detection, auto-fix. Quality gate for community content.

**Why this order within Wave 1:**
- #21 first (foundation everything depends on)
- #22 + #25 next (can be parallel, both extend editor)
- #23 last (needs #21+#22 complete to validate export)

---

### Wave 2: Backend Introduction (Issues #24, #26)
**Transition point — first server-side code:**
- Introduces hosting cost (but Supabase/Firebase free tier = $0 for MVP)
- Sets architecture pattern for ALL future backend features
- Proves we can deploy + maintain server infrastructure
- **CRITICAL:** I must choose backend stack before Cut Man starts UI work

**Issues:**
1. **#24: Community Gallery** (Proto Man) — Supabase/Firebase backend, level upload/browse/rate API, gallery UI. **I own this** because it's an architectural decision that affects every future feature.
2. **#26: Community Leaderboards** (Cut Man) — Per-level high scores, reuses #24's backend. Adds competitive layer to UGC.

**Backend Stack Decision (TBD in #24):**
- **Option A: Supabase** (leaning this way) — PostgreSQL, REST API, auth, 500MB free tier, great docs
- **Option B: Firebase** — Realtime DB, auth, 1GB free tier, simpler but less SQL power
- **Option C: Vercel + Postgres** — Serverless functions, more control, but more setup

**Decision criteria:**
- Free tier limits (traffic, storage)
- Auth integration ease (for future features)
- Query flexibility (filtering, sorting levels)
- Deployment simplicity (one-command deploy?)

---

### Wave 3: Multiplayer Endgame (Issues #27-#28)
**Save for last because:**
- Most technically complex (real-time sync, WebSockets, latency handling)
- Highest hosting cost (WebSocket servers can't sleep like HTTP endpoints)
- Requires #24 experience (we'll have learned backend deployment by then)
- Lower ROI than UGC (multiplayer is 1% of players, levels are 100%)

**Issues:**
1. **#27: Multiplayer Foundation** (Proto Man) — WebSocket server, lobby system, matchmaking, room management. **I own this** because it's another architectural fork in the road (Socket.io vs WebRTC).
2. **#28: Multiplayer Race Mode** (Cut Man) — Synchronized gameplay, ghost trails, post-race results. The capstone feature.

**Multiplayer Architecture Decision (TBD in #27):**
- **Option A: Node.js + Socket.io** (probably this) — Mature, easy, scales to 1000s of concurrent users
- **Option B: WebRTC** (peer-to-peer) — No server cost, but NAT traversal is painful, harder to secure

**Decision criteria:**
- Hosting cost (Render/Railway free tier?)
- Latency (will free tier perform?)
- Complexity (can Cut Man implement without me?)

---

## Features SCOPED OUT (Not in Phase 3)

Based on roadmap review and current state, these are **deferred to Phase 4** or marked as **non-goals:**

### Deferred to Phase 4:
- **Advanced level validation** (pathfinding, difficulty estimation) — too complex, manual review for now
- **User authentication** (GitHub OAuth, profiles) — anonymous mode sufficient for MVP
- **Level moderation/reporting** (flagging inappropriate content) — trust + rate for now
- **Search/filtering in gallery** (by tags, difficulty, author) — browse + sort is enough
- **Replay system** (watch top score runs) — cool but not core value
- **Tournament brackets** (multi-round competitions) — requires ladder system
- **Mobile editor** (touch controls for level building) — keyboard/mouse only for v1

### Non-Goals (Out of Scope Permanently):
- **Voice chat** — not a game dev priority
- **Level monetization** (paid cosmetics for levels) — game stays free
- **Native mobile apps** (iOS/Android) — PWA is sufficient
- **AI-generated levels** — user creativity > automation

---

## Risk Assessment

### Low Risk (Wave 1):
- ✅ No deployment complexity
- ✅ No backend hosting cost
- ✅ Incremental shipping (can abort if editor UX fails)

### Medium Risk (Wave 2):
- ⚠️ Backend introduces ongoing cost (mitigate: free tier + usage alerts)
- ⚠️ Schema migrations (mitigate: version field in JSON from day 1)
- ⚠️ Spam/abuse (mitigate: rate limiting, validation, moderation queue)

### High Risk (Wave 3):
- 🔴 WebSocket hosting cost (free tiers often exclude persistent connections)
- 🔴 Real-time sync complexity (lag, prediction, cheating)
- 🔴 Player base fragmentation (if <10 concurrent users, matchmaking fails)

**Mitigation Strategy:**
- Validate Wave 1 success (engagement metrics) before committing to Wave 2
- Deploy #24 backend first, monitor cost/usage for 2 weeks before starting #27
- Consider WebRTC (peer-to-peer) if server cost prohibitive

---

## Success Metrics (Per Roadmap)

Track these to decide if Phase 3 succeeds:

- **D7 Retention:** Target 40% (vs. 15% v1.x)
- **UGC Adoption:** 500+ levels published in first month
- **Multiplayer Engagement:** 20% of games in race mode
- **Avg. Session Time:** 8 minutes (vs. 3 minutes v1.x)

If Wave 1 (editor) doesn't hit 40% D7, reconsider backend investment.

---

## Next Actions

1. ✅ **Issues created** (#21-#28) — Squad can start immediately
2. 🔲 **Ralph picks up #21** (highest priority, no blockers)
3. 🔲 **Proto Man monitors #21 progress** — review PR before merge
4. 🔲 **Proto Man decides backend stack** — document in `.squad/decisions/inbox/protoman-backend-choice.md` before starting #24
5. 🔲 **Proto Man decides multiplayer arch** — document in `.squad/decisions/inbox/protoman-multiplayer-arch.md` before starting #27

---

## Team Assignments

| Issue | Assignee | Rationale |
|-------|----------|-----------|
| #21: Editor Core | Cut Man | Gameplay implementation expert |
| #22: Import/Export | Copilot | Well-scoped, clear requirements |
| #23: Validation | Guts Man | QA mindset, edge case hunter |
| #24: Gallery Backend | **Proto Man** | Architecture decision (I own this) |
| #25: Metadata | Copilot | Simple CRUD, clear spec |
| #26: Leaderboards | Cut Man | Reuses #24 patterns |
| #27: Multiplayer Foundation | **Proto Man** | Architecture decision (I own this) |
| #28: Race Mode | Cut Man | Complex gameplay sync |

---

**Status:** ✅ ACTIVE  
**Approval:** Self (Lead authority)  
**Next Review:** After Wave 1 completes (all 4 issues merged)
