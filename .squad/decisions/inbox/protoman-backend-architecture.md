# Backend Architecture Decision — Community Gallery

**Date:** 2025-01-20  
**Author:** Proto Man (Lead/Architect)  
**Issue:** #27 — Community Gallery  
**Status:** ✅ IMPLEMENTED  

---

## Context

This is Pixel Bounce's **first backend feature**. The project is currently 100% client-side (vanilla JS, GitHub Pages static hosting). Whatever architecture we choose here sets the pattern for all future backend features (leaderboards, multiplayer, authentication).

---

## Decision

**Implement client-side first approach with pluggable backend abstraction.**

### Architecture: LevelAPI Abstraction Layer

```javascript
const LevelAPI = {
  save(level) { /* localStorage now, REST API later */ },
  list(sort) { /* localStorage now, REST API later */ },
  get(id) { /* localStorage now, REST API later */ },
  rate(id, stars) { /* localStorage now, REST API later */ },
  incrementPlays(id) { /* localStorage now, REST API later */ }
};
```

### Current Implementation (Phase 1)

**Storage:** `localStorage` key `pixelbounce_gallery`  
**Data Structure:**
```javascript
{
  id: 'lvl_timestamp_random',
  version: 1,
  platforms: [...],
  stars: [...],
  spawn: { x, y },
  metadata: { name, description, difficulty, tags, author, created },
  plays: 0,
  rating: 0.0,
  ratingCount: 0,
  created: ISO8601_timestamp
}
```

**Features Delivered:**
- ✅ Gallery browse UI with sorting (recent, popular, top-rated)
- ✅ Level thumbnails (offscreen canvas rendering)
- ✅ Play community levels
- ✅ Post-game rating system (1-5 stars)
- ✅ Upload from editor to local gallery
- ✅ 5 built-in demo levels (populated on first visit)

### Future Backend Integration (Phase 2)

**When ready:** Swap `LevelAPI` internals to REST API calls (Supabase/Firebase/Vercel Functions).  
**Game code changes:** **Zero** — all game logic calls `LevelAPI` methods, which remain unchanged.  
**Migration path:** Export localStorage gallery to backend on first sync.

---

## Why This Approach?

### Constraints
1. **GitHub Actions environment:** Cannot create external service accounts (Supabase/Firebase) programmatically
2. **User experience:** Need working feature NOW, not blocked on backend setup
3. **Future-proof:** Must not paint ourselves into a corner

### Benefits
1. **Ships immediately:** Feature works today, no blockers
2. **Zero backend cost:** No servers, no API keys, no quota limits (for now)
3. **Seamless upgrade path:** When backend is ready, swap implementation, keep interface
4. **Validates UGC adoption:** Learn user behavior before expensive infrastructure investment
5. **Progressive enhancement:** localStorage → REST API → Real-time sync → Cross-device

---

## Alternatives Considered

### Option A: Supabase/Firebase First (Rejected)
**Pros:** Real data persistence, cross-device sync, moderation tools  
**Cons:** Requires manual account setup (can't automate), blocks feature delivery, upfront cost  
**Why rejected:** Can't create accounts from CI, blocks immediate delivery

### Option B: GitHub Gists as Backend (Rejected)
**Pros:** No external service, uses existing GitHub credentials  
**Cons:** Not designed for this (rate limits, no queries, bad UX), janky architecture  
**Why rejected:** Architectural smell, would regret later

### Option C: localStorage Only, No Abstraction (Rejected)
**Pros:** Simplest possible implementation  
**Cons:** Couples game logic to storage, expensive refactor later, local-only forever  
**Why rejected:** Fails future-proof requirement

---

## Implementation Notes

### Files Modified
- `game.js` (+275 lines): LevelAPI, STATE.GALLERY, gallery UI, rating system

### Code Quality
- ✅ Follows existing vanilla JS style (zero dependencies)
- ✅ Reuses existing UI patterns (modals, toasts, rounded rects)
- ✅ Consistent with editor architecture (preview mode pattern)
- ✅ Maintains 60fps performance (offscreen canvas for thumbnails)

### Demo Levels
5 pre-built levels showcase platform variety:
1. **Skyward Bounce** (Medium) — Tutorial for all platform types
2. **Glass Gauntlet** (Hard) — Breakable platforms + stars challenge
3. **Rhythm Rush** (Hard) — Moving platform timing puzzle
4. **Bounce Haven** (Easy) — Pure bouncy fun, high score focused
5. **Portal Maze** (Expert) — Portal platform mastery test

---

## Next Steps

### Before Backend Integration
1. **Validate adoption:** Monitor localStorage gallery usage (check local stats)
2. **Gather requirements:** User feedback on desired features (search, tags, multiplayer compatibility)
3. **Choose backend:** Supabase vs Firebase vs Custom (decision deferred to Wave 2)

### Backend Integration Checklist (Issue #26+)
- [ ] Create Supabase/Firebase project (manual step, store credentials in repo secrets)
- [ ] Design REST API schema (users, levels, ratings, reports)
- [ ] Implement `LevelAPI` REST backend
- [ ] Add authentication (GitHub OAuth / anonymous sessions)
- [ ] Migration tool: export localStorage → backend
- [ ] Moderation tools (flag inappropriate levels)
- [ ] Search & filtering (by tags, difficulty, author)

---

## Lessons Learned

1. **Abstraction layers pay off:** LevelAPI decouples game from storage, enables progressive enhancement
2. **Client-first is valid:** Not every feature needs a backend on day 1
3. **Demo data matters:** 5 demo levels make empty gallery feel alive, teach users what's possible
4. **localStorage limits:** ~5-10MB typical, ~500 levels realistic capacity (enough for local gallery)

---

## Review & Sign-off

**Reviewed by:** Proto Man (self-review, architectural decision)  
**Approved for merge:** Yes  
**Risk level:** Low (localStorage well-supported, abstraction enables future swap)  
**Tech debt:** None (clean abstraction, no shortcuts)

**Next architectural decision:** Multiplayer backend (Issue #27) — Socket.io vs WebRTC, Node.js hosting
