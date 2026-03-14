# Decisions — Pixel Bounce

> **TLDR:** This file tracks all team decisions. New decisions go to `.squad/decisions/inbox/` and are merged here periodically.

---

### 2026-03-13T19:58Z: Ralph Refueling Behavior
**By:** jperezdelreal (via SS Coordinator)
**Tier:** T1
**Status:** ✅ ACTIVE
**What:** When Ralph detects an empty board (no open issues with squad labels, no open PRs), instead of idling he MUST:
1. Check if a "Define next roadmap" issue already exists: `gh issue list --label roadmap --state open --limit 1`
2. If none exists → create one: `gh issue create --title "📋 Define next roadmap" --label roadmap --label "squad:{lead-name}" --body "Board is empty. Lead: define the next 3 features for this repo's roadmap. Max 3 features, well-scoped, @copilot-ready."`
3. If one already exists → skip, just report "📋 Roadmap issue already open, waiting for Lead."
**Why:** Prevents the autonomous pipeline from ever fully stopping. Complements perpetual-motion.yml (reactive) with proactive refueling.

---

### 2026-03-13T20:12Z: Cross-repo communication rule
**By:** jperezdelreal (via SS Coordinator)
**Tier:** T0
**Status:** ✅ ACTIVE
**What:** No repo may make direct git commits to another repo's branch. ALL cross-repo communication goes through GitHub Issues. Each repo's Squad session owns its git state exclusively. This prevents push conflicts when multiple Ralph Go sessions run concurrently.
**Rule:** Use `gh issue create`, `gh issue comment`, `gh pr review` — NEVER `gh api repos/.../contents -X PUT`.

---

### 2026-03-14T10:20Z: Phase 3 Strategic Plan
**By:** Proto Man (Lead/Architect)
**Tier:** T1
**Status:** ✅ ACTIVE
**What:** Phase 3 executes in 3 waves across 8 issues (#21-#28). Wave 1 (Issues #21-#23, #25): Client-only level editor, import/export, validation, metadata — zero backend cost, high user value, 2-week timeline. Wave 2 (Issues #24, #26): Supabase/Firebase backend decision, community gallery, leaderboards. Wave 3 (Issues #27-#28): Multiplayer foundation (Node.js + Socket.io vs WebRTC), race mode. Total effort: 6-8 weeks.
**Why:** Minimizes risk by starting client-only, delivers value incrementally, validates UGC adoption (40% D7 retention target) before expensive backend investment. Defers advanced features (search, auth, moderation, replay, tournaments, mobile editor) to Phase 4.
**Decisions:** Backend stack choice TBD before #24 starts. Multiplayer architecture choice TBD before #27 starts. Issue #20 (Define next roadmap) closed — Phase 3 planning complete.
**Owner:** Proto Man
**Next Review:** After Wave 1 completes (all 4 issues merged)

---

### 2026-03-14T10:20Z: Editor State Pattern & Data Structure
**By:** Cut Man (Game Developer)
**Tier:** T1
**Status:** ✅ ACTIVE
**What:** Add STATE.EDITOR (value: 4) to the game state enum and use a separate `editorLevel` object to store editor data independently from gameplay state. EditorLevel structure `{platforms[], stars[], spawn{x,y}}` mirrors gameplay format, enabling non-destructive preview mode and future export/import.
**Why:** Clean separation of editor from gameplay state, non-destructive preview (modify for playtesting, restore cleanly), data portability for issue #23 (import/export), and state machine clarity following existing pattern (TITLE:0, PLAY:1, OVER:2, DAILY:3).
**Owner:** Cut Man
**Next Review:** Upon issue #22 completion

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
