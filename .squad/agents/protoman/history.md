# Proto Man — History

## Project Context
- **Project:** Pixel Bounce — HTML5 platformer game
- **Stack:** Vanilla JavaScript, Canvas API, GitHub Pages
- **Repo:** pixel-bounce
- **Owner:** jperezdelreal (Syntax Sorcery / First Frame Studios)

## Session Log

### Squad Initialization
- **Date:** 2025-07-18
- **Event:** Team initialized with Mega Man universe casting
- **Team:** Proto Man (Lead), Cut Man (Game Dev), Guts Man (QA), @copilot (Coding Agent), Scribe (Logger), Ralph (Monitor)
- **Status:** Ready for operations

## Learnings

### Phase 3 Planning (Issue #20) — 2025-01-20

**Context:** After Phase 2 completion (5 features merged: special platforms, power-ups, skins, achievements, daily challenges), jperezdelreal asked me to define Phase 3 roadmap.

**Architectural Decision:**
- **Strategic order:** Client-only first (Level Editor), then backend (Gallery), then multiplayer (most complex)
- **Rationale:** Minimize risk, deliver value early, learn before expensive infrastructure
- **Backend choice deferred:** Will decide Supabase vs Firebase vs Vercel when starting issue #24
- **Multiplayer arch deferred:** Will decide Socket.io vs WebRTC when starting issue #27

**Key Technical Insights:**
- Current stack: Vanilla JS (~800 lines), Canvas API, zero dependencies, GitHub Pages
- Phase 2 added: Achievements system, daily challenges (seeded RNG), power-ups (Shield/Magnet/Boost), special platforms (Bouncy/Breakable/Portal), 8 ball skins
- Level editor is client-only (no backend needed) — highest value, lowest risk
- Community gallery introduces first backend dependency — critical architecture decision
- Multiplayer requires WebSocket server — most complex, highest cost

**Issues Created:**
1. #21: Level Editor Core (Cut Man) — Foundation for all UGC
2. #22: Level Import/Export (Copilot) — JSON serialization
3. #23: Level Validation (Guts Man) — Playability checks
4. #24: Community Gallery (Proto Man) — Backend introduction, I own this decision
5. #25: Level Metadata (Copilot) — Names, tags, difficulty
6. #26: Community Leaderboards (Cut Man) — Per-level high scores
7. #27: Multiplayer Foundation (Proto Man) — WebSocket server, I own this decision
8. #28: Multiplayer Race Mode (Cut Man) — Synchronized gameplay capstone

**User Preferences:**
- jperezdelreal trusts me to make backend architecture decisions autonomously
- Prefers incremental shipping (client-only first, backend later)
- Budget-conscious (free tier hosting preferred)
- Quality over speed (validation, polish matter)

**File Paths:**
- Main game logic: `game.js` (806 lines)
- HTML: `index.html` (minimal, just canvas)
- Roadmap: `roadmap.md` (defines v2.0 vision)
- Decision log: `.squad/decisions.md` + `.squad/decisions/inbox/`

**Patterns Observed:**
- Issues use emoji prefixes (🎨 for UI, 💾 for data, ✅ for quality, 🌐 for backend, 🏆 for social, 🚀 for infrastructure)
- Acceptance criteria always checkbox lists (testable)
- Technical notes include file paths, line count estimates, implementation hints
- Scope sections define IN/OUT explicitly (prevents scope creep)
- Labels: `squad` (required) + `squad:{agent}` (assignment) + `phase-3` (milestone)

**Next Review:** After Wave 1 completes (issues #21, #22, #23, #25 merged)

### Community Gallery Implementation (Issue #27) — 2025-01-20

**Context:** First backend feature for Pixel Bounce. Project is 100% client-side (GitHub Pages), needed architecture decision for future backend features (leaderboards, multiplayer).

**Architectural Decision:**
- **Pattern chosen:** Client-side first with LevelAPI abstraction layer
- **Current implementation:** localStorage-backed (`pixelbounce_gallery` key)
- **Future-ready:** REST API swap without changing game code
- **Rationale:** Can't create Supabase/Firebase accounts programmatically from CI, need working feature NOW, must not block on manual setup

**Key Technical Insights:**
- **LevelAPI abstraction:** `save()`, `list()`, `get()`, `rate()`, `incrementPlays()` — localStorage now, REST later
- **localStorage limits:** ~5-10MB typical, ~500 levels realistic capacity (sufficient for local gallery)
- **Demo levels strategy:** 5 built-in levels populate gallery on first visit, showcase platform variety
- **Thumbnail rendering:** Offscreen canvas (60x80px), maintains 60fps performance
- **Rating system:** Post-game modal (1-5 stars), stored with level metadata
- **Sorting:** Recent (timestamp), Popular (plays), Top-rated (rating average)

**Features Delivered:**
- STATE.GALLERY accessible via C key from title screen
- Gallery browse UI with level cards (title, author, difficulty, rating, plays)
- Level thumbnails rendered to mini canvas
- Play community levels flow (increments play count)
- Post-game rating prompt (R key, 1-5 stars + Enter)
- Upload from editor (U key, requires metadata set)
- 5 demo levels: Skyward Bounce, Glass Gauntlet, Rhythm Rush, Bounce Haven, Portal Maze

**Implementation Stats:**
- `game.js`: +569 lines (now 2082 total)
- New state: STATE.GALLERY (value: 5)
- New global variables: `galleryLevels`, `gallerySort`, `galleryScroll`, `selectedGalleryLevel`, `showRatingModal`, `pendingRating`, `communityLevelId`
- New functions: `startGallery()`, `handleGalleryClick()`, `playCommunityLevel()`, `uploadToGallery()`, `renderLevelThumbnail()`, `drawGallery()`

**Alternatives Considered:**
1. **Supabase/Firebase first** (rejected: can't create accounts from CI, blocks delivery)
2. **GitHub Gists backend** (rejected: not designed for this, rate limits, bad UX)
3. **localStorage only, no abstraction** (rejected: couples game to storage, expensive refactor later)

**Lessons Learned:**
- Abstraction layers pay off: LevelAPI decouples game from storage, enables progressive enhancement
- Client-first is valid: Not every feature needs a backend on day 1
- Demo data matters: Empty gallery feels dead, 5 demo levels teach users what's possible
- localStorage is sufficient for Phase 1: Cross-device sync can wait until adoption is validated

**User Experience:**
- Title screen: Added `[C] Gallery` hint to controls section
- Editor: Added `[U] Upload` instruction and workflow
- Game over (community level): Shows `[R] Rate level` prompt instead of restart
- Gallery: Keyboard navigation (↑↓ scroll, 1-3 sort, Enter play, ESC back)
- Rating modal: Number keys 1-5 + Enter to submit, ESC to skip

**Backend Integration Path (Deferred to Wave 2):**
1. Create Supabase/Firebase project (manual, credentials in repo secrets)
2. Design REST API schema (users, levels, ratings, reports)
3. Swap `LevelAPI` internals to REST calls (game code unchanged)
4. Add authentication (GitHub OAuth / anonymous sessions)
5. Migration tool: export localStorage → backend on first sync
6. Add moderation (flag inappropriate levels)
7. Add search & filtering (tags, difficulty, author)

**Decision Document:** `.squad/decisions/inbox/protoman-backend-architecture.md`  
**PR:** #33  
**Status:** Merged to main (pending review)  

**Next Architectural Decision:** Multiplayer backend (Issue #27 vs #26) — Socket.io vs WebRTC, Node.js hosting choice

