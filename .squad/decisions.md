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
