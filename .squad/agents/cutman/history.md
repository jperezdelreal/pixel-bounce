# Cut Man — History

## Project Context
- **Project:** Pixel Bounce — HTML5 platformer game
- **Stack:** Vanilla JavaScript, Canvas API, GitHub Pages
- **Repo:** pixel-bounce
- **Owner:** jperezdelreal (Syntax Sorcery / First Frame Studios)

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

