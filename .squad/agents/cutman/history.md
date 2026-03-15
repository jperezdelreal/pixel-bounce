# Cut Man — History

## Project Context
- **Project:** Pixel Bounce — HTML5 platformer game
- **Stack:** Vanilla JavaScript, Canvas API, GitHub Pages
- **Repo:** pixel-bounce
- **Owner:** jperezdelreal (Syntax Sorcery / First Frame Studios)

## Core Context
**Phase 3 Status:** 100% COMPLETE. All 8 roadmap issues (Level Editor, Import/Export, Validation, Metadata, Community Gallery, Leaderboards, Multiplayer Foundation, Multiplayer Race Mode) merged to main.

**Current Assignment:** Issue #58 (Add contextual hints for first-time feature visits — Editor/Gallery/Multiplayer). ~50 lines, localStorage flags, reuses tutorial overlay pattern from PR #57. Scope: first-visit tooltips showing keyboard shortcuts. Status: IN PROGRESS (assigned 2026-03-15).

**Key Achievement:** Implemented all Phase 3 gameplay features — editor (grid-snapping, undo/redo, preview), UGC system (import/export, metadata), leaderboards, visual polish (backgrounds, particles, screen shake), sound feedback, onboarding (tutorial overlay v2). Game.js grew from ~800 lines (Phase 1) to 3466 lines (Phase 3 complete).

**Next Review:** After #58 implementation completes and validation passes.

**Detailed Session Log** (2025-07-18 onward):

## Session Log

### Squad Initialization
- **Date:** 2025-07-18
- **Event:** Team initialized with Mega Man universe casting
- **Role:** Game Developer — responsible for all gameplay mechanics and Canvas rendering
- **Status:** Ready for operations

### Level Editor Implementation (Issue #22)
- **Date:** 2025-01-20
- **Branch:** squad/22-level-editor
- **PR:** #29
- **What:** Implemented complete Level Editor with grid-based placement system
- **Changes:**
  - Added STATE.EDITOR = 4 to game state enum
  - Editor accessible via 'E' key from title screen
  - 20px grid snapping system for precise platform placement
  - 7-tool system: Normal, Bouncy, Breakable, Portal, Star, Spawn, Delete
  - Undo/redo history stack (20 actions, Ctrl+Z/Y)
  - Preview mode (P key) with ESC to return
  - Camera scroll with arrow keys
  - Tool selection via number keys 1-7
  - Visual toolbar with color-coded tool indicators
  - Spawn point with green circle indicator

## Learnings

### Architecture Decisions
- **Game State Pattern**: Added STATE.EDITOR (4) following existing STATE enum pattern (TITLE:0, PLAY:1, OVER:2, DAILY:3)
- **Data Structure**: editorLevel object with platforms[], stars[], spawn{x,y} mirrors game state structure for easy preview conversion
- **Undo/Redo**: Deep-copy JSON snapshots stored in history array, limited to 20 actions to prevent memory bloat
- **Grid Snapping**: Math.round(x / GRID_SIZE) * GRID_SIZE pattern ensures consistent 20px alignment

### Key File Paths
- **game.js** (lines 13-31): State definitions and editor globals
- **game.js** (lines 289-305): Editor keyboard controls
- **game.js** (lines 375-471): Editor functions (startEditor, handleEditorClick, undo/redo, preview)
- **game.js** (lines 398-405): Editor update loop with camera control
- **game.js** (lines 826-944): drawEditor() rendering function

### Code Patterns
- **Click Handling**: Canvas click handler switches between editor and game modes based on state
- **Platform Reuse**: Editor renders platforms using same draw logic as gameplay (colors, gradients, shapes)
- **Camera Translation**: ctx.translate(0, -cameraY) pattern used consistently across all draw modes
- **Tool Selection**: Number keys (1-7) map to EDITOR_TOOLS array indices for quick switching

### User Preferences
- **Grid-based Design**: 20px grid provides balance between precision and ease of use
- **Preview Mode**: Non-destructive playtest - press P to test, ESC returns to editing without losing work
- **Visual Feedback**: Color-coded tools (Normal=red, Bouncy=green, Portal=purple, etc.) match gameplay colors
- **Keyboard-first**: All editor functions accessible via keyboard (no mouse required except placement)

### Level Import/Export Implementation (Issue #23)
- **Date:** 2025-01-20
- **Branch:** squad/23-level-import-export
- **PR:** #31
- **What:** Implemented JSON import/export for custom levels with clipboard, file I/O, validation, and toast notifications
- **Changes:**
  - Export functionality: Copies level JSON to clipboard + downloads .json file (level-{timestamp}.json)
  - Import modal: Paste JSON with Enter to import, ESC to cancel
  - File import/export: Upload .json files via file picker, download via Blob API
  - JSON schema v1 with fields: version, platforms[], stars[], spawn{x,y}, metadata{author, created}
  - Toast notification system: Success (green) and error (red) toasts, auto-dismiss after 2 seconds
  - Validation: Checks required fields (platforms array, spawn point), rejects invalid JSON
  - Import loads level directly into editor with editorSaveState() for undo support
  - Three buttons in toolbar: Export (green), Import (blue), File (orange)
  - Keyboard shortcuts: [X] export, [I] import modal, [F] file picker, Ctrl+S export

### Architecture Decisions - Import/Export
- **JSON Schema Versioning**: Added version:1 field for future schema migrations if level format changes
- **Dual Export Paths**: Both clipboard (navigator.clipboard.writeText) and file download for flexibility
- **Toast System**: Separate from achievements, uses {text, timer, type} object with 60fps countdown
- **Modal State**: showImportModal flag + importInput string, paste event listener captures Ctrl+V
- **Validation Strategy**: JSON.parse try-catch + explicit field checks, fails fast with clear error messages
- **File Download Pattern**: Blob + createObjectURL + temporary anchor element, URL.revokeObjectURL cleanup
- **Import Safety**: Deep copy via map() with fallback values (p.x || 0, p.type || 'static') handles partial data

### Code Patterns - Import/Export
- **Modal Rendering**: Overlay with rgba(10,10,30,0.95) darkens background, z-index via render order
- **Button Hit Detection**: rawY >= H - 90 check prevents toolbar clicks from placing objects
- **Toast Animation**: Linear countdown (timer--), auto-clear when timer <= 0
- **Paste Handling**: document.addEventListener('paste') checks state + showImportModal flags
- **File API**: FileReader.readAsText() async pattern with reader.onload callback
- **Clipboard API**: Promise-based navigator.clipboard.writeText() with .then()/.catch() for feedback

### Level Metadata & Tags (Issue #25)
- **Date:** 2025-01-21
- **Branch:** squad/25-level-metadata
- **PR:** #32
- **What:** Added metadata fields (name, description, difficulty, tags) for level discovery and organization
- **Changes:**
  - Level Info modal: Press [M] key to open metadata editor
  - Form fields: Name (required, max 50 chars), Description (optional, max 200 chars), Difficulty selector, Tags (comma-separated)
  - Metadata object in editorLevel: {name, description, difficulty, tags[], author, created}
  - Default values: name='Untitled Level', difficulty='Medium', tags=[]
  - Export validation: Level name required before export (prevents empty names)
  - Import support: Loads metadata from JSON, falls back to defaults
  - Tab to cycle focus, Enter to save, ESC to cancel
  - Difficulty badges: Easy (#16c79a), Medium (#ffd700), Hard (#e94560) with color-coded buttons
  - Tags processing: Split by comma, trim whitespace, lowercase, dedupe, max 5 tags
  - Filename uses safe name: level name sanitized for download (safeName-timestamp.json)

### Architecture Decisions - Metadata
- **Modal State Pattern**: showMetadataModal flag + metadataInputs object mirrors showImportModal pattern
- **Focus Management**: metadataFocusField tracks active input ('name', 'description', 'tags') for keyboard handling
- **Input Buffer**: metadataInputs object separate from editorLevel.metadata until save (cancel-safe)
- **Character Limits**: Client-side validation (50/200 char limits) prevents bloat, enforced on keypress
- **Tag Normalization**: Split, trim, lowercase, dedupe with Set, slice to 5 — prevents dupes and enforces limit
- **Export Gate**: Name validation check before export, shows error toast if empty
- **Default Metadata**: Created timestamp + Player author on new level, preserved on import

### Code Patterns - Metadata
- **Keyboard Input Handling**: if (e.key.length === 1) captures all printable chars, Backspace handled separately
- **Field Cycling**: Tab key with e.preventDefault() cycles through name → description → tags → name
- **Difficulty UI**: Three-button horizontal layout, active badge highlighted with full opacity + border
- **Word Wrap**: Manual word-wrap for description textarea (45 char width, 14px line height)
- **Sanitization**: name.replace(/[^a-z0-9]/gi, '-').toLowerCase() creates safe filenames
- **Focus Indicators**: Active field gets gold border (#ffd700), brighter background, cursor indication

### Community Leaderboards (Issue #21)
- **Date:** 2025-01-21
- **Branch:** squad/21-community-leaderboards
- **PR:** #34
- **What:** Implemented per-level leaderboards with localStorage-backed ScoreAPI for community level high scores
- **Changes:**
  - ScoreAPI abstraction: submit(levelId, playerName, score), getTop(levelId, limit)
  - localStorage key: 'pixelbounce_scores' with structure { levelId: [scores] }
  - Score entry schema: { playerName, score, timestamp }
  - Post-game name prompt modal after completing community level
  - Name input: alphanumeric + spaces, max 20 chars, Anonymous if blank
  - Leaderboard modal: Top 10 scores with rank, player name, score, date
  - Current score highlighting: Gold background + border if just submitted
  - View Leaderboard from gallery: Press [L] key to view level's top scores
  - Gallery instructions updated: '[Enter] Play | [L] Leaderboard | [1-3] Sort | [ESC] Back'
  - Rank colors: #1 gold, #2 silver, #3 bronze, rest gray
  - Top 100 scores kept per level (performance limit)

### Architecture Decisions - Leaderboards
- **API Pattern Consistency**: ScoreAPI mirrors LevelAPI structure — localStorage now, REST-ready for future backend
- **State Flow**: Game Over → Name Prompt → Submit → Show Leaderboard (with highlight) → Return to Gallery
- **Data Structure**: Nested object { levelId: [scores] } allows efficient per-level lookups without iteration
- **Score Persistence**: Top 100 per level prevents localStorage bloat (auto-prunes on submit)
- **Sanitization**: playerName.trim().substring(0, 30) prevents exploits and overflow
- **Try-Catch Safety**: All localStorage operations wrapped in try-catch (learned from gallery bugs #27)
- **Timestamp-Based Highlighting**: currentScore + timestamp within 5sec identifies just-submitted score for highlighting
- **Anonymous Default**: Empty string → 'Anonymous' at API level, not UI level (keeps input clean)

### Code Patterns - Leaderboards
- **Modal Stacking**: Name prompt → Leaderboard → Gallery (showNamePrompt → showLeaderboard → state change)
- **Keyboard Input**: e.key.length === 1 + regex /[a-zA-Z0-9 ]/ allows only safe characters
- **Score Sorting**: scores.sort((a, b) => b.score - a.score) descending, slice(0, limit) for top N
- **Date Formatting**: toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) for compact display
- **Conditional Rendering**: if (showLeaderboard) overlays in both drawGameOver() and drawGallery()
- **Dual Context**: Leaderboard accessible from post-game (with highlight) AND gallery (neutral view)
- **Event Prevention**: return early from keydown handler when in modal to prevent bleed-through

### Multiplayer Race Mode (Issue #26)
- **Date:** 2025-01-21
- **Branch:** squad/26-multiplayer-race
- **PR:** #36
- **What:** Real-time multiplayer racing with synchronized gameplay, ghost trails, and post-race rankings — the capstone feature of Phase 3
- **Changes:**
  - **Client-side (game.js):**
    - Ghost trail rendering: 40% opacity balls with player colors (red, green, gold, blue)
    - Player name labels above ghost balls
    - Real-time scoreboard overlay (top-right): all players ranked by score
    - 60-second race timer (top-center): countdown with red warning at ≤10s
    - Post-race rankings screen: 1st-4th with rank colors (gold, silver, bronze, gray)
    - Rematch button: [R] to request rematch, returns to lobby with same players
    - Leave button: [ESC] to disconnect and return to title
    - Client-side prediction: local ball movement with 100ms position updates to server
    - Deterministic platform generation from shared seed (seededRandom function)
    - Ghost position interpolation from 20Hz server updates
  - **Server-side (server/index.js + Room.js):**
    - Game state broadcast at 20Hz (50ms interval): broadcasts all player positions
    - Race timer management: 60s countdown with per-second updates
    - Player state tracking: x, y, score, alive status for each player
    - Race end detection: timer=0 OR all players dead
    - Rankings calculation: sorted by score descending, rank 1-4
    - Rematch flow: resetForRematch() resets room state, new seed generated
    - Mid-race disconnect handling: mark player as 'disconnected', continue race
    - Race cleanup: clear intervals on race end or room deletion

### Architecture Decisions - Multiplayer Race
- **State Management**: isMultiplayerRace flag switches rendering logic (ghost trails, scoreboard, timer)
- **Player Colors**: PLAYER_COLORS array ['#e94560', '#00ff88', '#ffd700', '#88ddff'] for visual distinction
- **Seed-Based Generation**: genPlatformsFromSeed(seed) ensures identical platform layouts across all clients
- **20Hz Broadcast Rate**: 50ms interval balances responsiveness with server load (vs 60Hz overkill)
- **100ms Client Updates**: Position updates sent every 100ms (lower than 20Hz to reduce traffic)
- **Ghost Data Structure**: otherPlayers[] with {id, name, x, y, score, alive, color} for rendering
- **Timer Authority**: Server broadcasts timer value, clients display it (no local countdown to prevent drift)
- **Race Lifecycle**: WAITING → STARTING (countdown) → PLAYING (race) → FINISHED (rankings) → WAITING (rematch)
- **Post-Race Screen**: Separate modal overlay (showPostRaceScreen) instead of STATE.OVER to preserve game state
- **Rematch Pattern**: Reset room state but keep players connected (no re-join required)

### Code Patterns - Multiplayer Race
- **Ghost Rendering**: ctx.globalAlpha = 0.4 for semi-transparency, restore to 1 after drawing
- **Scoreboard**: Sort all players (local + others) by score, highlight local player with '►' prefix
- **Timer Display**: Conditional color (red if ≤10s, gold otherwise) for urgency feedback
- **Rankings Display**: for-loop with rankColors[ranking.rank - 1] for medal colors
- **Seeded RNG**: (s * 9301 + 49297) % 233280 linear congruential generator for determinism
- **Position Update Interval**: setInterval(() => socket.emit('player-state', ...)) independent from game loop
- **Server Game Loop**: Room.gameStateTimer + Room.raceInterval as separate intervals for state + timer
- **Cleanup Pattern**: clearInterval on all timers before room deletion or race end
- **Disconnect Marking**: player.alive = false + player.name += ' (DC)' for visual feedback

### UI Polish — Menu Text, Mute, Pause Menu (Issue #41)
- **Date:** 2025-01-21
- **Branch:** squad/ui-polish-menu-mute-pause
- **PR:** #42
- **What:** Fixed 3 critical UX bugs: blurry menu text, broken mute toggle, and missing pause menu
- **Changes:**
  - Canvas HiDPI rendering: devicePixelRatio scaling for crisp text on all displays
  - Removed `image-rendering: pixelated` CSS to prevent text blocky rendering
  - Fixed mute key conflict: Changed to Shift+M (was conflicting with Multiplayer 'M' key)
  - Added STATE.PAUSED with pausedFromState tracking to preserve game/daily mode
  - Pause menu overlay: Semi-transparent with frozen game background
  - Pause controls: ESC/P to toggle, M for mute, Q to quit to title
  - Pause menu options: Resume, Sound ON/OFF indicator, Quit to Title
  - Prevent pause during editor preview mode (isPreviewMode check)

## Learnings

### Architecture Decisions - UI Polish
- **Canvas Resolution**: Set canvas.width/height to W*dpr, H*dpr then scale context with ctx.scale(dpr, dpr) for HiDPI
- **CSS vs Canvas Rendering**: `image-rendering: pixelated` is great for pixel art but terrible for text — removed it
- **Mute Key Conflict**: 'M' key was used for both mute AND multiplayer menu, causing double-trigger — fixed with Shift+M
- **Pause State Pattern**: Added STATE.PAUSED with pausedFromState variable to remember PLAY vs DAILY mode
- **Pause Rendering**: Draw frozen game background (platforms, stars, ball) then overlay semi-transparent menu
- **Key Event Early Return**: Pause menu keyboard handler returns early to prevent key bleed-through to game logic

### Code Patterns - UI Polish
- **DPR Scaling**: `const dpr = window.devicePixelRatio || 1; canvas.width = W * dpr; ctx.scale(dpr, dpr)`
- **Style Dimension Sync**: Set canvas.style.width/height in px to match logical dimensions (400x600)
- **Pause Toggle**: `if (e.key === 'Escape' && isPlaying()) { pausedFromState = state; state = STATE.PAUSED; }`
- **State Restoration**: `if (e.key === 'Escape' && state === STATE.PAUSED) { state = pausedFromState; pausedFromState = null; }`
- **Menu Overlay**: ctx.fillStyle = 'rgba(10, 10, 30, 0.85)' for darkened background with game still visible
- **Modifier Key Check**: `if (e.key === 'M' && e.shiftKey)` for Shift+M combo to avoid key conflicts

### Pause Bug Deep Fix (Issue #44, PR #44)
- **Date:** 2026-03-14
- **Branch:** squad/fix-pause-v2-and-superjump
- **PR:** #44
- **What:** Resolved persistent pause menu exit bug + clarified super jump visual feedback
- **Changes:**
  - **Pause Fix**: Clear keys[] object on pause entry/exit (lines 860, 870) to prevent stale input state
  - **Resume Feedback**: Green particle burst (20 particles) on unpause for visual confirmation
  - **Boost Balance**: Reduced boost power-up multiplier from 2.5x to 1.8x for better gameplay balance
  - **Visual Clarity**: Added floating text feedback ('BOOST!' red, '2X BOUNCE!' green) on activation
  - **Text Animation**: Feedback text fades and floats upward over 40 frames with shadow glow
  - **Particle Polish**: Increased particles (20 vs 8) when boost + bouncy combine
  - **New State Variable**: Added `feedbackText = { text, x, y, color, timer }` for floating text system

### Architecture Decisions - Pause v2 & Super Jump
- **Input State Management**: keys[] object can carry stale state across pause/resume cycles — must be explicitly cleared
- **Visual Feedback Priority**: User confusion about intentional mechanics (boost, bouncy) indicates insufficient visual feedback, not bugs
- **Multiplier Balancing**: 2.5x boost * 2x bouncy = 5x total velocity was excessive — reduced to 1.8x * 2x = 3.6x for better feel
- **Feedback Text System**: Floating text with fade-out and upward motion provides non-intrusive gameplay feedback
- **Particle Density**: Variable particle count (8 normal, 20 boosted) reinforces power difference visually

### Code Patterns - Pause v2 & Super Jump
- **State Clearing**: `keys = {}` on pause/resume prevents arrow key stickiness and input bugs
- **Feedback Object**: `feedbackText = { text, x, y, color, timer }` updated in game loop, rendered with fade alpha
- **Text Animation**: `feedbackText.y -= 0.5` per frame floats text upward, `alpha = Math.min(timer / 20, 1)` for fade
- **Shadow Glow**: `ctx.shadowColor = color; ctx.shadowBlur = 10` makes text pop against varied backgrounds
- **Conditional Particles**: `spawnParticles(x, y, color, boostMul > 1 ? 20 : 8)` adjusts intensity based on power-up state
- **Feedback Placement**: `feedbackText = { ..., y: p.y }` at platform collision point (not ball position) for clarity

### Key File Paths - Pause v2
- **game.js** (line 32): Added feedbackText state variable
- **game.js** (lines 860, 870): Clear keys[] on pause entry/resume
- **game.js** (lines 1998-2018): Boost multiplier reduction + feedback text creation
- **game.js** (lines 2121-2127): Feedback text timer update + upward float animation
- **game.js** (lines 2283-2295): Feedback text rendering with fade + shadow glow

### User Feedback Learnings
- **Pause Bug Persistence**: PR #43 had correct logic, but the bug STILL existed for user — root cause was keys[] stale state, not event handler flow
- **Intentional vs Bug**: User reported "super jumps" as a potential bug — actual issue was lack of visual clarity for intentional mechanics (boost + bouncy combo)
- **Balance vs Clarity**: When users question intended mechanics, consider BOTH visual feedback AND numerical balance — reduced 2.5x to 1.8x AND added text feedback
- **Deep Investigation Required**: When a "fixed" bug reappears, assume the fix addressed a symptom, not the root cause — trace ALL state flows, not just event handlers

### Visual Polish Implementation (Issue #46, PR #52)
- **Date:** 2025-03-14
- **Branch:** squad/46-visual-polish
- **PR:** #52
- **What:** Comprehensive visual polish pass with animated backgrounds, screen shake, enhanced particles, platform squash/stretch, ball trails, and milestone celebrations
- **Changes:**
  - **4 Animated Background Themes:** Default (< 1000), Sky (1000+), Sunset (2500+), Space (5000+) with smooth gradient transitions
  - **Background Shapes:** 15 animated shapes (circles, squares, triangles) that parallax scroll, rotate, and loop
  - **Screen Shake System:** Intensity-based shake with decay (3px normal bounce, 6px bouncy, 8px power-up, 15px game over)
  - **Enhanced Particle System:** 3 types (star: 5-pointed rotating, confetti: rectangles, sparkle: cross) with rotation and rotSpeed properties
  - **Platform Squash/Stretch:** Platforms squash to 70% height on bounce, gradually recover over 10 frames with scaleY transform
  - **Ball Trail Effect:** Stores last 10 ball positions with 30-frame lifetime (0.5s at 60fps), renders at 30% opacity
  - **Milestone Celebrations:** Full-screen white flash + 50 confetti particles + 3-tone sound + background theme change at 1000, 2500, 5000, 10000
  - **State Variables:** shakeOffset {x, y, decay}, ballTrail[], milestoneFlash {alpha, milestone}, backgroundTheme (0-3), backgroundShapes[]

### Architecture Decisions - Visual Polish
- **Background Theme System:** Array of 4 theme objects with gradient colors + shape colors, switched on milestone reach
- **Screen Shake Pattern:** Single shakeOffset object with x/y, exponential decay (0.85 multiplier), thresholds at 0.1 for cleanup
- **Particle Type Field:** Extended particle object with type, rotation, rotSpeed for varied rendering without separate arrays
- **Platform Squash State:** Added squash property to platform objects (undefined = no squash), incremental recovery with +=0.1
- **Ball Trail Lifetime:** Fixed 30-frame lifetime matches 0.5s at 60fps, max 10 positions prevents memory bloat
- **Milestone Detection:** Single lastMilestone variable prevents duplicate celebrations, checks on score increase only
- **Background Shape Pooling:** 15 pre-initialized shapes with parallax (cameraY * 0.05), wrap at screen bottom + size
- **Performance Strategy:** All animations use incremental updates (+=), no Math.sin in update loop except platform pulse

### Code Patterns - Visual Polish
- **Theme Rendering:** themes[backgroundTheme] lookup, createLinearGradient with theme colors, shapes drawn with ctx.rotate(shape.angle)
- **Screen Shake Application:** ctx.translate(shakeOffset.x, shakeOffset.y - cameraY) before main game rendering
- **Particle Type Switch:** if/else chain for type='star'/'confetti'/'sparkle', each with unique draw logic (star uses 5-point loop, confetti uses fillRect)
- **Squash Recovery:** if (p.squash < 1) { p.squash += 0.1; if (p.squash > 1) p.squash = 1; } in platform update loop
- **Ball Trail Update:** ballTrail.push({x, y, life: 30}), decrement life, filter life > 0, cap at 10 with shift()
- **Milestone Flash:** milestoneFlash.alpha -= 0.05 decay, render white overlay with alpha * 0.5, text at alpha > 0.5
- **Background Shape Update:** shape.y += shape.speed, shape.angle += 0.01, wrap: if (shape.y > H + shape.size) reset
- **Initialization Pattern:** All visual polish state reset in startGame(), startMultiplayerRace(), and previewLevel() for clean start

### Key File Paths - Visual Polish
- **game.js** (lines 35-40): Visual polish state variables (shakeOffset, ballTrail, milestoneFlash, backgroundTheme, backgroundShapes)
- **game.js** (lines 1233-1247): Enhanced spawnParticles() with type parameter + rotation properties
- **game.js** (lines 1249-1273): Screen shake functions (addScreenShake, updateScreenShake)
- **game.js** (lines 1275-1310): Milestone functions (checkMilestone, triggerMilestoneCelebration)
- **game.js** (lines 1312-1343): Background shape functions (initBackgroundShapes, updateBackgroundShapes)
- **game.js** (lines 2095-2104): Visual polish initialization in startGame()
- **game.js** (lines 2285-2325): Ball trail, screen shake, background shape updates in update() loop
- **game.js** (lines 2399-2412): Platform squash effect on bounce collision
- **game.js** (lines 2448-2455): Platform squash recovery in platform update loop
- **game.js** (lines 2461-2467): Milestone check on score increase
- **game.js** (lines 2586-2653): Animated background theme rendering in draw()
- **game.js** (lines 2698-2708): Platform squash/stretch rendering with scaleY
- **game.js** (lines 2763-2827): Enhanced particle rendering with type-specific draw logic
- **game.js** (lines 2829-2838): Ball trail rendering with 30% opacity
- **game.js** (lines 2970-2991): Milestone flash overlay rendering

### User Preferences - Visual Polish
- **Subtle Shake:** Screen shake intensities tuned low (3-15px) to avoid nausea while providing feedback
- **Gradual Theme Transitions:** Background themes change instantly on milestone, but gradient colors prevent jarring transitions
- **Performance First:** All effects use pooling, incremental updates, and filtering to maintain 60fps
- **Particle Variety:** 3 distinct particle types provide visual interest without overwhelming the screen
- **Non-Intrusive Trail:** Ball trail at 30% opacity + 10-position cap keeps focus on main ball
- **Celebration Clarity:** Milestone flash at 50% alpha + 0.05 decay ensures visibility without blinding player
- **Platform Feedback:** Squash effect subtle (70% height) but noticeable enough to confirm bounce impact
- **Background Motion:** Parallax shapes move slower than foreground (0.05x cameraY) for depth perception



---

## Learnings — Issue #58: Contextual Hints Update (2026-03-XX)

### Task Context
- **Issue:** #58 — Update contextual hints for Editor/Gallery/Multiplayer with clearer, more concise instructions
- **Origin:** Follow-up to PR #57 (Onboarding & Tutorial) — 3/12 acceptance criteria found missing
- **Branch:** squad/58-contextual-hints
- **PR:** #61

### What Was Already There
- Contextual hints system was ALREADY implemented in PR #57 (commit a5b4ebd)
- Infrastructure complete: localStorage flags, hint state management, overlay rendering, dismiss handlers
- Original hints were functional but didn't match exact requirements from Issue #58

### Changes Made
1. **Hint Content** — Updated all three hints to match exact requirements:
   - Editor: Clarified [1][2][3] platform types, [Space] test, [ESC] exit
   - Gallery: Specified [Enter] to play, Arrow keys navigate, [ESC] return
   - Multiplayer: Emphasized race competition, [ESC] return
2. **Duration** — Extended from 4s (240 frames) to 10s (600 frames) for better readability
3. **Dismiss Text** — Updated to '[ESC] or any key to dismiss' with getColor('accent') for visibility

### Architecture Patterns Observed
- **Hint Lifecycle:** Check localStorage → Show hint on first visit → Set flag → Auto-dismiss after timer OR any key/click
- **Overlay Pattern:** Semi-transparent dark overlay (rgba(10,10,30,0.92)) + centered text matches tutorial overlay style
- **Dismissal:** Two handlers (keydown line 1367-1369, click line 1745-1747) ensure any interaction dismisses hint
- **Timer Update:** Contextual hint timer decremented in main update() loop (line 2960-2963)
- **Rendering:** Contextual hint overlay drawn in drawTitle() after all other UI (line 3889-3908)

### Key File Paths
- **game.js** (lines 360-371): Contextual hints state + CONTEXTUAL_HINTS config object
- **game.js** (lines 1367-1369): Keydown dismiss handler for contextual hints
- **game.js** (lines 1745-1747): Click dismiss handler for contextual hints
- **game.js** (lines 2049-2053): startEditor() first-visit check + hint trigger
- **game.js** (lines 2476-2480): startGallery() first-visit check + hint trigger
- **game.js** (lines 2497-2501): enterLobby() first-visit check + hint trigger
- **game.js** (lines 2960-2963): update() timer decrement + auto-dismiss
- **game.js** (lines 3889-3908): drawTitle() contextual hint overlay rendering

### User Preferences
- **10-Second Duration:** Longer than tutorial steps (which users navigate manually) to account for reading time without interaction
- **Concise Copy:** All hints under 50 words, focus on key controls rather than welcome messages
- **Green Accent Color:** Dismiss text uses getColor('accent') (#16c79a) for consistency with other UI elements
- **ESC Emphasis:** Explicit [ESC] mention in dismiss text signals escape key as primary dismissal method

### Testing Notes
- All three localStorage flags work correctly (pb_editor_visited, pb_gallery_visited, pb_multiplayer_visited)
- Hints trigger exactly once per feature per browser/device (localStorage persists)
- Auto-dismiss works (10s = 600 frames at 60fps)
- Manual dismiss works (any key OR click anywhere)
- Visual style matches tutorial overlay (same overlay color, same font, same layout pattern)

### Lessons Learned
- Always check main branch for existing implementation before starting new work
- PR #57 (Onboarding) already included contextual hints — Issue #58 was about UPDATING them, not implementing from scratch
- The difference between "feature missing" and "feature doesn't match spec" — this was the latter
- Contextual hints follow same pattern as tutorial overlay but with simpler rendering (no multi-step navigation)
