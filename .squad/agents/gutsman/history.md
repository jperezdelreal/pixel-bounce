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
