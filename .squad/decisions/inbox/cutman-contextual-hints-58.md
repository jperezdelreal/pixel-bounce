# Decision: Contextual Hints Content & Duration Update

**Date:** 2026-03-XX  
**By:** Cut Man (Game Developer)  
**Tier:** T2 (Implementation detail)  
**Status:** ✅ ACTIVE  
**Issue:** #58 — Update contextual hints for Editor/Gallery/Multiplayer  
**PR:** #61  

## What

Updated contextual hints for three game features (Editor, Gallery, Multiplayer) to provide clearer, more concise instructions. Changed hint duration from 4 seconds to 10 seconds and improved dismiss text visibility.

## Changes

### Content Updates
- **Editor:** "Click to place platforms. [1][2][3] switches platform types. [Space] to test level. [ESC] to exit."
- **Gallery:** "Browse community-created levels. [Enter] to play a level. Arrow keys to navigate. [ESC] to return."
- **Multiplayer:** "Create or join race rooms. Compete for fastest climb. [ESC] to return to title."

### Technical Updates
- `HINT_DURATION`: 240 frames (4s) → 600 frames (10s)
- Dismiss text: "Press any key or click to dismiss" → "[ESC] or any key to dismiss" with accent color

## Why

**Issue #58 Requirements:** PR #57 review found that contextual hints (though implemented) didn't match the exact requirements specified in Issue #50's acceptance criteria. Needed to update content to be more instructional and less "welcome message" style.

**Duration Rationale:** 4 seconds proved too short for users to read and comprehend the hints, especially on first visit when they're orienting themselves to a new feature. 10 seconds provides adequate reading time while still auto-dismissing to avoid annoying experienced users who dismiss manually.

**Content Rationale:** Original hints focused on welcoming users ("Welcome to...") rather than teaching controls. Updated hints are action-oriented and concise (<50 words), focusing on key controls users need immediately.

## Context

- Contextual hints infrastructure was already implemented in PR #57 (commit a5b4ebd)
- This is a **content and tuning update**, not a new feature implementation
- All localStorage flags and dismiss handlers were already working correctly
- Visual style (semi-transparent overlay, centered text, accent color) unchanged

## Related Patterns

- Matches tutorial overlay visual style (same rgba overlay, same font, same layout)
- Uses existing `getColor('accent')` for green accent color (#16c79a in normal palette)
- Follows same dismiss pattern as tutorial (any key OR click dismisses)
- Timer managed in main `update()` loop like other timed UI elements

## Next Steps

- Monitor user feedback on hint duration (10s may still need tuning)
- Consider adding hint skip button for experienced users who create multiple accounts
- If more features added (e.g., Phase 4 features), follow this pattern for first-visit hints

## Owner

Cut Man (Game Developer)

## Next Review

After PR #61 merges — check if duration needs further tuning based on user feedback
