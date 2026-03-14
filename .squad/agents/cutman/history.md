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

