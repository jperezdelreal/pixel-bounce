# Decision: Validation Modal UX Pattern

**Date:** 2025-07-18  
**Agent:** Guts Man  
**Context:** Issue #24 — Level Validation

## Decision
Implement blocking validation modal that prevents preview but allows continued editing.

## Rationale
- **Non-Destructive:** Users can continue editing while seeing errors
- **Clear Feedback:** Visual highlighting (red platforms) + text list
- **Guided Fix:** Auto-fix button provides one-click remediation
- **Consistent UX:** Reuses achievement overlay pattern (dark modal, centered text, keyboard shortcuts)

## Implementation
- Validation runs on [P]review button press
- Modal shows up to 10 errors with overflow indicator
- [F] key triggers auto-fix, [V] dismisses modal
- Invalid platforms highlighted with red gradient and outline
- Auto-fix is conservative: clamps bounds, removes overlaps (keeps first), trims excess

## Impact
- Sets pattern for future validation features (star placement, difficulty estimation)
- Establishes quality gate before gameplay testing
- Reduces broken level submissions if export feature added

## Alternatives Considered
- Inline warnings: Rejected — too noisy during editing
- Auto-fix only: Rejected — doesn't educate user about issues
- Non-blocking validation: Rejected — allows preview of broken levels
