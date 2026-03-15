# Guts Man — History

## Project Context
- **Project:** Pixel Bounce — HTML5 platformer game
- **Stack:** Vanilla JavaScript, Canvas API, GitHub Pages
- **Repo:** pixel-bounce
- **Owner:** jperezdelreal (Syntax Sorcery / First Frame Studios)

## Session Log

### Squad Initialization
- **Date:** 2025-07-18
- **Event:** Team initialized with Mega Man universe casting
- **Role:** Tester & QA — responsible for test coverage, edge cases, and quality gates
- **Status:** Ready for operations

## Learnings

### Issue #24 — Level Validation System
- **Date:** 2025-07-18
- **Branch:** squad/24-level-validation
- **PR:** #30
- **Status:** Completed

**Implementation:**
Implemented comprehensive level validation for the custom level editor with 7 critical checks:
1. Minimum platform count (3 platforms)
2. Maximum platform limit (50 for performance)
3. Maximum star limit (30 for performance)
4. Platform bounds checking (all within canvas)
5. Platform overlap detection (full collision checking)
6. Spawn point collision with platforms
7. Spawn point must be 100px above nearest platform

**Technical Approach:**
- Added validation modal state: `showValidationModal`, `validationErrors`, `invalidPlatforms`
- `validateLevel()` returns `{ valid, errors }` object with detailed error messages
- Visual feedback: Invalid platforms render with red gradient and outline
- Auto-fix function: `fixLevelIssues()` removes overlaps, clamps bounds, trims excess
- Modal UI pattern: Reused achievement overlay styling for consistency
- Keyboard controls: [P] triggers validation before preview, [F] fixes issues, [V] closes modal

**Edge Cases Handled:**
- Overlap detection uses proper AABB collision: `p1.x < p2.x + p2.w && p1.x + p1.w > p2.x && p1.y < p2.y + p1.h && p1.y + p1.h > p2.y`
- Spawn collision accounts for ball radius (8px)
- Auto-fix prioritizes keeping first platform in overlap pairs
- Validation blocks preview but not editing (allows iteration)
- Invalid platform highlighting persists until modal dismissed

**Quality Gates:**
- Syntax validated with Node.js --check flag
- Modal prevents broken levels from being previewed
- Clear error messages guide users to fix issues
- Auto-fix provides one-click remediation

**Codebase Integration:**
- Followed existing code style (4 spaces, verbose naming)
- Reused `roundRect()` helper for consistent UI
- Integrated with existing keyboard handler in Editor mode
- Maintained separation of concerns (validation, rendering, input)

### Issue #27 — Community Gallery PR Review
- **Date:** 2025-07-18
- **Branch:** squad/27-community-gallery
- **PR:** #33 (by Proto Man)
- **Status:** Changes Requested

**Review Scope:**
Comprehensive QA review of community gallery feature (569 new lines). Checked all acceptance criteria, edge cases, state transitions, localStorage handling, and LevelAPI abstraction quality.

**Critical Issues Found:**

1. **Navigation Bug** (Lines 630-635, 643-648)
   - After community level game over, returns to TITLE instead of GALLERY
   - Violates acceptance criteria: "Gallery → Play → Game Over → back to Gallery"
   - Breaks user flow expectation

2. **Rating Exploit** (Lines 197-206)
   - No tracking of which levels user has rated
   - Allows unlimited ratings on same level
   - Enables rating manipulation/spam

3. **Crash Risk** (Line 219)
   - No try-catch around JSON.parse in `_getLevels()`
   - Corrupted localStorage will crash entire app
   - Needs defensive error handling

4. **Thumbnail Bug** (Lines 1128-1130)
   - `Math.min(...[])` returns Infinity for empty platform/star arrays
   - Breaks thumbnail rendering for minimal levels
   - Need empty array check before spread operator

5. **Performance Concern** (Line 2151, minor)
   - `renderLevelThumbnail()` called every frame per visible card
   - Could lag with 100+ levels
   - Recommend thumbnail caching

**What Worked Well:**
- Clean LevelAPI abstraction (localStorage → REST swap will be easy)
- Excellent demo levels (5 levels, well-designed)
- Good empty gallery handling
- Proper text truncation for long names
- Sort functionality works correctly
- Upload validation checks for empty platforms

**Acceptance Criteria Results:**
- 9/10 criteria passed
- 1 failed: Navigation flow (critical)
- All core features functional

**Recommendation:**
Changes required before merge. Issues #1-4 must be fixed. Issue #5 optional. Assigned to Ralph or Cut Man (Proto Man under lockout).

**QA Methodology:**
- Static code analysis (grep, view entire implementation)
- Edge case identification (empty data, corrupted storage, boundary conditions)
- State machine flow verification (all transitions checked)
- Acceptance criteria mapping (line-by-line validation)
- Performance analysis (thumbnail generation concern)

### Issue #28 — Multiplayer Foundation PR Review
- **Date:** 2025-07-18
- **Branch:** squad/28-multiplayer-foundation
- **PR:** #35 (by Proto Man)
- **Status:** Changes Required

**Review Scope:**
Comprehensive QA review of multiplayer foundation (965 new lines). First server-side code addition to project. Reviewed server architecture, WebSocket implementation, client integration, security, memory management, and edge cases.

**Critical Issues Found:**

1. **Memory Leak: Event Listeners** (game.js:195-246)
   - `MultiplayerClient.disconnect()` never calls `socket.removeAllListeners()`
   - All 8 socket.on() handlers accumulate on each lobby entry/exit
   - After 10 lobby visits: 80 event handlers in memory
   - Causes memory growth and duplicate event firing
   - **Impact:** Application becomes unstable over time

2. **Memory Leak: Timer Not Cleared** (game.js:249-254)
   - Ping loop `setInterval()` never cleared in `disconnect()`
   - New timer created every lobby entry, old ones never stopped
   - After 10 visits: 10 timers firing every 2 seconds
   - Wastes CPU and network bandwidth
   - **Impact:** Performance degrades, memory leaks

3. **Security: CORS Too Permissive** (server/index.js:16, major)
   - `origin: '*'` allows any domain to connect
   - Production security risk
   - Should use env-configurable whitelist

**What Worked Well:**
- Rate limiting implemented (20 msg/sec per player)
- Input validation (name truncation to 20 chars)
- Room cleanup (empty rooms deleted after 60s)
- Countdown properly cancels when player leaves
- Room state machine correct (WAITING→STARTING→PLAYING→FINISHED)
- Server disconnect handling comprehensive
- Code quality high (clean, commented, consistent)
- Dependencies minimal (socket.io 4.7.2, express 4.18.2)
- package.json properly configured

**Acceptance Criteria Results:**
- 12/14 criteria passed
- 2 failed: Memory leaks and CORS security
- All features functional, but not production-ready

**Edge Cases Checked:**
✅ Room full (max 4 players enforced)  
✅ Invalid room code (returns error)  
✅ Player leaves during countdown (countdown cancels, state resets)  
✅ Disconnect handling (players removed, rooms cleaned)  
✅ Quick match queue cleanup (removed on disconnect)  
✅ Timer cleanup on countdown completion  
❌ Socket event listeners not cleaned up  
❌ Ping interval not cleared  

**Recommendation:**
Changes required before merge. Issues #1-2 are critical blockers. Issue #3 should be fixed for production. Proto Man under lockout — assigned to Ralph or Cut Man for fixes.

**QA Methodology:**
- Server code syntax validation (Node.js --check)
- Client code syntax validation
- Memory management analysis (event listeners, timers)
- Security review (CORS, rate limiting, input validation)
- State machine verification (Room lifecycle)
- Edge case testing (disconnects, full rooms, invalid codes)
- Acceptance criteria validation (14 points checked)

### Issue #62 — Playwright Gameplay Testing Framework
- **Date:** 2026-03-15
- **Branch:** squad/62-playwright-testing
- **Status:** Committed, ready for PR

**Implementation:**
Set up Playwright gameplay testing infrastructure from the Syntax Sorcery template, customized for Pixel Bounce.

**Test Suites (19 tests total):**
1. **Smoke Tests (6):** Page load, canvas presence, 400×600 dimensions, visual content, screenshot capture, animation loop
2. **Gameplay Tests (7):** Title→Play transition, ArrowLeft/Right input, A/D alternate controls, visual state changes, score region updates, crash resistance, pixel readability
3. **Menu Navigation (6):** Title screen render, title→play transition, pause ('p' key), game over detection, restart flow, console error check

**Infrastructure:**
- `GameRunner` harness: browser launch, screenshot capture, pixel comparison, input simulation, visual content detection
- `create-issues-from-failures.js`: Auto-creates GitHub issues from test failures with screenshots
- `playwright.config.ts`: 400×600 viewport, sequential execution, JSON reporter for CI/CD

**Test Results (against production):**
- **17 passed**, 1 skipped (static title screen animation), 1 failed (caught real bugs)
- The failed test (`no console errors during menu navigation`) correctly detected 2 game bugs:
  - `"Assignment to constant variable"` — JS error during gameplay
  - `"drawPlatform is not defined"` — Missing function reference
- These are real bugs in game.js, not test issues — validates the framework works

**Customizations from Template:**
- Viewport: 800×600 → 400×600 (Pixel Bounce canvas)
- Start game: click center (200, 300) not (400, 300)
- Controls: ArrowLeft/Right + A/D (not generic ArrowUp/Down/Space)
- Pause: 'p' key (not Escape — Escape returns to title)
- Game over: wait ~10s for player to fall
- Canvas-only HUD: pixel comparison instead of DOM queries
- GAME_URL default: `https://jperezdelreal.github.io/pixel-bounce/`

**Key Decision:**
Used 'p' for pause instead of Escape in tests, because Escape in Pixel Bounce navigates back to title screen in some modes, which would break the pause test flow.

### Live Site Playwright Run — Desktop + Mobile Viewports
- **Date:** 2025-07-18
- **Branch:** squad/62-playwright-testing
- **Target:** https://jperezdelreal.github.io/pixel-bounce/ (production)
- **Status:** Completed — 2 known bugs confirmed, no new bugs found

**Desktop (400×600 viewport — gameplay-chromium project):**

| Suite | Test | Result |
|-------|------|--------|
| Smoke | game page loads without errors | ✅ Pass |
| Smoke | canvas element is present | ✅ Pass |
| Smoke | canvas has correct dimensions (400×600) | ✅ Pass |
| Smoke | canvas renders visual content (not blank) | ✅ Pass |
| Smoke | screenshot can be captured | ✅ Pass |
| Smoke | animation loop is running (frames differ) | ⏭️ Skipped (static title screen) |
| Gameplay | game transitions from title to gameplay on click | ✅ Pass |
| Gameplay | player responds to left/right input | ✅ Pass |
| Gameplay | player responds to A/D alternate controls | ✅ Pass |
| Gameplay | game state changes are reflected visually | ✅ Pass |
| Gameplay | score region updates during gameplay | ✅ Pass |
| Gameplay | game does not crash after extended play | ✅ Pass |
| Gameplay | canvas pixel data is readable during gameplay | ✅ Pass |
| Menu Nav | title screen renders correctly | ✅ Pass |
| Menu Nav | title screen → gameplay transition | ✅ Pass |
| Menu Nav | pause menu can be opened during gameplay | ✅ Pass |
| Menu Nav | game over screen appears after losing | ✅ Pass |
| Menu Nav | game over → restart transition works | ✅ Pass |
| Menu Nav | no console errors during menu navigation | ❌ FAIL |

Desktop totals: **17 passed, 1 skipped, 1 failed** (known bugs)

**Mobile (375×667 viewport — mobile-chromium project, isMobile + hasTouch):**

| Suite | Test | Result |
|-------|------|--------|
| Smoke | game page loads without errors | ✅ Pass |
| Smoke | canvas element is present | ✅ Pass |
| Smoke | canvas has correct dimensions (400×600) | ✅ Pass |
| Smoke | canvas renders visual content (not blank) | ✅ Pass |
| Smoke | screenshot can be captured | ✅ Pass |
| Smoke | animation loop is running (frames differ) | ⏭️ Skipped (static title screen) |
| Gameplay | game transitions from title to gameplay on click | ✅ Pass |
| Gameplay | player responds to left/right input | ✅ Pass |
| Gameplay | player responds to A/D alternate controls | ✅ Pass |
| Gameplay | game state changes are reflected visually | ✅ Pass |
| Gameplay | score region updates during gameplay | ✅ Pass |
| Gameplay | game does not crash after extended play | ✅ Pass |
| Gameplay | canvas pixel data is readable during gameplay | ✅ Pass |
| Menu Nav | title screen renders correctly | ✅ Pass |
| Menu Nav | title screen → gameplay transition | ✅ Pass |
| Menu Nav | pause menu can be opened during gameplay | ✅ Pass |
| Menu Nav | game over screen appears after losing | ✅ Pass |
| Menu Nav | game over → restart transition works | ✅ Pass |
| Menu Nav | no console errors during menu navigation | ❌ FAIL |

Mobile totals: **17 passed, 1 skipped, 1 failed** (same known bugs)

**Failed Test Details (both viewports):**
- Test: `no console errors during menu navigation`
- Errors caught: `["Assignment to constant variable.", "drawPlatform is not defined"]`
- These are the 2 known bugs already fixed by Cut Man on this branch but not yet deployed to production
- Confirms the test framework correctly catches real JS errors

**Key Findings:**
1. **No new bugs discovered** — all failures trace to the 2 known issues
2. **Mobile viewport works identically to desktop** — canvas fixed at 400×600 regardless of viewport, no responsive layout issues
3. **Touch/click handling works** — `isMobile: true` + `hasTouch: true` did not break any interactions
4. **Canvas dimensions pass on mobile** — the 400×600 canvas renders correctly even in 375×667 mobile viewport (canvas overflows slightly, but CSS computed dimensions still report 400×600)
5. **All gameplay mechanics functional** — input, scoring, pause, game over, restart all work on both viewports
6. **Animation loop skip is consistent** — title screen is static on both viewports (expected behavior)

**Recommendation:**
- Merge Cut Man's fixes and redeploy — the `no console errors` test will pass once `drawPlatform` and const bugs are fixed on production
- Consider adding a mobile-chromium project permanently to playwright.config.ts for CI/CD
- No touch-specific control tests exist yet — future work could test on-screen touch buttons if/when added
