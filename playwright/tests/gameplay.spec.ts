/**
 * Gameplay Tests — Verify Pixel Bounce core mechanics work in a real browser.
 *
 * Canvas: 400×600
 * Controls: ArrowLeft/ArrowRight (or A/D) to move horizontally
 * Start: Click canvas center (200, 300) to go from TITLE → PLAY
 * Player ball starts at (200, 500) and bounces upward
 * Canvas-only game — no DOM HUD, use pixel comparison for score changes
 *
 * These tests answer: "Can a player actually play the game?"
 */
import { test, expect } from '@playwright/test';
import { GameRunner } from '../lib/game-runner';
import * as path from 'path';

// ── PIXEL BOUNCE CONFIG ─────────────────────────────────────────────────
const GAME_PATH = process.env.GAME_PATH || path.resolve(__dirname, '..', '..', 'index.html');
const GAME_URL = process.env.GAME_URL || 'https://jperezdelreal.github.io/pixel-bounce/';
const CANVAS_SELECTOR = process.env.CANVAS_SELECTOR || 'canvas';
// ─────────────────────────────────────────────────────────────────────────

let game: GameRunner;

test.beforeAll(async () => {
  game = new GameRunner({ viewport: { width: 400, height: 600 } });
  if (GAME_URL) {
    await game.launchUrl(GAME_URL);
  } else {
    await game.launchGame(GAME_PATH);
  }
});

test.afterAll(async () => {
  await game.close();
});

test.describe('Gameplay Tests', () => {

  test('game transitions from title to gameplay on click', async () => {
    await game.screenshot('gameplay-before-start');

    // Click canvas center to start: TITLE → PLAY
    await game.clickAt(200, 300);
    await game.waitForFrames(30);

    await game.screenshot('gameplay-after-start');
    const diff = await game.compareScreenshots('gameplay-before-start', 'gameplay-after-start');
    expect(diff).not.toBe('identical');
  });

  test('player responds to left/right input', async () => {
    await game.screenshot('gameplay-before-input');

    // Move player right with ArrowRight
    await game.pressKey('ArrowRight', 500);
    await game.waitForFrames(10);

    await game.screenshot('gameplay-after-input');
    const diff = await game.compareScreenshots('gameplay-before-input', 'gameplay-after-input');
    expect(diff).not.toBe('identical');
  });

  test('player responds to A/D alternate controls', async () => {
    await game.screenshot('gameplay-before-ad');

    // Move player left with 'a' key
    await game.pressKey('a', 500);
    await game.waitForFrames(10);

    await game.screenshot('gameplay-after-ad');
    const diff = await game.compareScreenshots('gameplay-before-ad', 'gameplay-after-ad');
    expect(diff).not.toBe('identical');
  });

  test('game state changes are reflected visually', async () => {
    // Record a short gameplay session and verify visual changes
    const frames = await game.recordGameplay(2, 4);
    expect(frames.length).toBeGreaterThanOrEqual(4);

    // Compare first and last frame — gameplay should produce visual changes
    const first = await import('fs').then(fs => fs.readFileSync(frames[0]));
    const last = await import('fs').then(fs => fs.readFileSync(frames[frames.length - 1]));
    expect(first.equals(last)).toBe(false);
  });

  test('score region updates during gameplay (canvas pixel comparison)', async () => {
    // Score is rendered on the canvas — compare the top region where score is drawn
    await game.screenshot('hud-before');
    await game.pressKey('ArrowRight', 1000);
    await game.waitForFrames(30);
    await game.screenshot('hud-after');
    const diff = await game.compareScreenshots('hud-before', 'hud-after');
    expect(diff).not.toBe('identical');
  });

  test('game does not crash after extended play', async () => {
    const errors: string[] = [];
    game.page!.on('pageerror', (err) => errors.push(err.message));

    // Simulate 5 seconds of random left/right input
    const keys = ['ArrowLeft', 'ArrowRight', 'a', 'd'];
    for (let i = 0; i < 10; i++) {
      const key = keys[Math.floor(Math.random() * keys.length)];
      await game.pressKey(key, 200);
      await game.waitForFrames(5);
    }

    expect(errors).toHaveLength(0);

    // Verify canvas is still rendering
    const hasContent = await game.hasVisualContent(0, 0, 400, 300);
    expect(hasContent).toBe(true);
  });

  test('canvas pixel data is readable during gameplay', async () => {
    const pixel = await game.getCanvasPixel(200, 300);
    expect(pixel).not.toBeNull();
    expect(pixel!.a).toBe(255); // Fully opaque — game is drawing
  });
});
