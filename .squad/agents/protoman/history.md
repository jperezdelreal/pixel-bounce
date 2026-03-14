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
