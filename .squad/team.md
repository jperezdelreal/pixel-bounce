# Squad Team — Pixel Bounce

## Project Context
- **Project:** Pixel Bounce — HTML5 platformer game
- **Stack:** Vanilla JavaScript, Canvas API, GitHub Pages
- **User:** jperezdelreal
- **Universe:** Mega Man
- **Org:** Syntax Sorcery / First Frame Studios

## Members

### Proto Man — Lead / Architect
- **Role:** Lead & Architect
- **Scope:** Architecture decisions, code review, roadmap scoping, feature design
- **Agent:** `.squad/agents/protoman/`

### Cut Man — Game Developer
- **Role:** Game Dev
- **Scope:** Gameplay mechanics, Canvas API rendering, physics, controls, level design
- **Agent:** `.squad/agents/cutman/`

### Guts Man — Tester / QA
- **Role:** Tester & QA Engineer
- **Scope:** Test coverage, edge cases, quality gates, regression testing, bug reports
- **Agent:** `.squad/agents/gutsman/`

### @copilot — Coding Agent
<!-- copilot-auto-assign: true -->
- **Role:** Autonomous Coding Agent
- **Scope:** Executes well-defined issues autonomously via GitHub Actions
- **Capabilities:**
  - Reads issue descriptions and implements changes
  - Creates pull requests with code changes
  - Runs tests and validates before submitting
  - Works best with clear, scoped, single-responsibility issues
- **Assignment:** Auto-assigned to issues labeled `squad:copilot` that are well-defined and self-contained
- **Limitations:** Needs clear acceptance criteria; not suitable for ambiguous design decisions

### Scribe — Session Logger
- **Role:** Memory & Session Logger
- **Scope:** Session logs, decision tracking, team memory, context continuity
- **Agent:** `.squad/agents/scribe/`

### Ralph — Work Monitor
- **Role:** Work Queue Monitor
- **Scope:** Backlog management, board health, pipeline flow, refueling when board is empty
- **Note:** Operates via orchestration workflows; no dedicated agent directory
