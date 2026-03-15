# 🎭 Playwright Gameplay Testing — Pixel Bounce

E2E/visual testing framework for Pixel Bounce. Agents can "play" the game in a real Chromium browser, navigate menus, interact with gameplay, take screenshots, detect visual bugs, and **auto-create GitHub issues** from failures.

## Quick Start

```bash
# 1. Install dependencies
cd playwright
npm install

# 2. Run all tests against production
GAME_URL=https://jperezdelreal.github.io/pixel-bounce/ npx playwright test

# 3. Run all tests against local build
GAME_PATH=../index.html npx playwright test
```

## Test Suites

| File | Purpose |
|------|---------|
| `tests/smoke.spec.ts` | Does the game load? Canvas renders? No JS errors? |
| `tests/gameplay.spec.ts` | Can a player play? Input works? Score updates? |
| `tests/menu-navigation.spec.ts` | Do all menus work? Transitions correct? |

## Auto-Issue Creation

After tests run, create GitHub issues for any failures:

```bash
npx playwright test --reporter=json > test-results.json
node scripts/create-issues-from-failures.js
```

Set `DRY_RUN=true` to preview without creating issues.

## Game Details

- **Canvas:** 400×600 pixels
- **Controls:** ArrowLeft/ArrowRight (or A/D) to move, click to start
- **States:** TITLE → PLAY → OVER (+ DAILY, EDITOR, etc.)
- **Pause:** Press 'p' during gameplay
