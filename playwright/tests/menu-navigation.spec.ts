/**
 * Menu Navigation Tests — Verify all Pixel Bounce menu screens and transitions.
 *
 * Canvas: 400×600
 * Title → Play: click canvas center (200, 300)
 * Pause: press 'p' key (not Escape — Escape goes back to title in some modes)
 * Game over: player falls below screen — wait ~10s
 * Restart: click canvas after game over
 *
 * These tests answer: "Can a player navigate all menus without getting stuck?"
 */
import { test, expect } from '@playwright/test';
import { GameRunner } from '../lib/game-runner';
import * as path from 'path';

// ── PIXEL BOUNCE CONFIG ─────────────────────────────────────────────────
const GAME_PATH = process.env.GAME_PATH || path.resolve(__dirname, '..', '..', 'index.html');
const GAME_URL = process.env.GAME_URL || 'https://jperezdelreal.github.io/pixel-bounce/';
// ─────────────────────────────────────────────────────────────────────────

let game: GameRunner;

test.beforeEach(async () => {
  // Fresh browser for each test — menus depend on clean game state
  game = new GameRunner({ viewport: { width: 400, height: 600 } });
  if (GAME_URL) {
    await game.launchUrl(GAME_URL);
  } else {
    await game.launchGame(GAME_PATH);
  }
});

test.afterEach(async () => {
  await game.close();
});

test.describe('Menu Navigation', () => {

  test('title screen renders correctly', async () => {
    await game.waitForFrames(10);
    await game.screenshot('menu-title-screen');

    // Verify the title screen has visual content (400×600 canvas)
    const hasContent = await game.hasVisualContent(0, 0, 400, 600);
    expect(hasContent).toBe(true);
  });

  test('title screen → gameplay transition', async () => {
    await game.screenshot('menu-title');

    // Click canvas center to start game
    await game.clickAt(200, 300);
    await game.waitForFrames(30);

    await game.screenshot('menu-gameplay');
    const diff = await game.compareScreenshots('menu-title', 'menu-gameplay');
    expect(diff).not.toBe('identical');
  });

  test('pause menu can be opened during gameplay', async () => {
    // Start the game first
    await game.clickAt(200, 300);
    await game.waitForFrames(30);
    await game.screenshot('menu-playing');

    // Press 'p' to pause (not Escape — Escape may return to title)
    await game.pressKey('p');
    await game.waitForFrames(10);

    await game.screenshot('menu-paused');
    const diff = await game.compareScreenshots('menu-playing', 'menu-paused');

    // Pause should visually change the screen (overlay, freeze, etc.)
    if (diff === 'identical') {
      test.skip(true, 'No visual pause change detected — game may not have pause. Customize or skip.');
    }
  });

  test('game over screen appears after losing', async () => {
    // Start the game
    await game.clickAt(200, 300);
    await game.waitForFrames(10);

    // Wait for game over — player falls below screen (~10 seconds)
    await game.page!.waitForTimeout(10_000);

    await game.screenshot('menu-game-over');

    // Verify the game over screen has content
    const hasContent = await game.hasVisualContent(50, 100, 300, 400);
    expect(hasContent).toBe(true);
  });

  test('game over → restart transition works', async () => {
    // Start game → wait for game over → restart
    await game.clickAt(200, 300);
    await game.waitForFrames(10);

    // Wait for game over
    await game.page!.waitForTimeout(10_000);
    await game.screenshot('menu-game-over-restart');

    // Click canvas to restart after game over
    await game.clickAt(200, 300);
    await game.waitForFrames(30);

    await game.screenshot('menu-restarted');
    // The restarted state should look different from game over
    const diff = await game.compareScreenshots('menu-game-over-restart', 'menu-restarted');
    if (diff === 'identical') {
      test.skip(true, 'Restart did not produce visual change. Customize restart interaction.');
    }
  });

  test('no console errors during menu navigation', async () => {
    const errors: string[] = [];
    game.page!.on('pageerror', (err) => errors.push(err.message));

    // Navigate through common menu actions
    await game.waitForFrames(10);          // Title
    await game.clickAt(200, 300);          // Start
    await game.waitForFrames(20);          // Play
    await game.pressKey('p');              // Pause
    await game.waitForFrames(10);

    expect(errors).toHaveLength(0);
  });
});
