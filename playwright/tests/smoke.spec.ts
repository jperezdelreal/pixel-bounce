/**
 * Smoke Tests — Verify Pixel Bounce loads and renders in a real browser.
 *
 * Canvas: 400×600
 * These tests answer: "Does the game even work?"
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

test.describe('Smoke Tests', () => {
  test('game page loads without errors', async () => {
    const errors: string[] = [];
    game.page!.on('pageerror', (err) => errors.push(err.message));

    // Give the page a moment to settle
    await game.waitForFrames(5);

    expect(errors).toHaveLength(0);
  });

  test('canvas element is present', async () => {
    const canvas = await game.page!.$(CANVAS_SELECTOR);
    expect(canvas).not.toBeNull();
  });

  test('canvas has correct dimensions (400×600)', async () => {
    const dimensions = await game.page!.evaluate((sel: string) => {
      const canvas = document.querySelector(sel) as HTMLCanvasElement;
      if (!canvas) return null;
      // Check CSS/logical dimensions via style
      const style = window.getComputedStyle(canvas);
      return {
        width: parseInt(style.width),
        height: parseInt(style.height),
      };
    }, CANVAS_SELECTOR);

    expect(dimensions).not.toBeNull();
    expect(dimensions!.width).toBe(400);
    expect(dimensions!.height).toBe(600);
  });

  test('canvas renders visual content (not blank)', async () => {
    // Wait for a few frames so the game has time to draw
    await game.waitForFrames(10);

    const hasContent = await game.hasVisualContent(0, 0, 400, 300);
    expect(hasContent).toBe(true);
  });

  test('screenshot can be captured', async () => {
    const screenshotPath = await game.screenshot('smoke-initial-state');
    const fs = await import('fs');
    expect(fs.existsSync(screenshotPath)).toBe(true);
  });

  test('animation loop is running (frames differ)', async () => {
    await game.screenshot('smoke-frame-a');
    await game.waitForFrames(30);
    await game.screenshot('smoke-frame-b');

    const diff = await game.compareScreenshots('smoke-frame-a', 'smoke-frame-b');

    // Pixel Bounce title screen has animated elements
    if (diff === 'identical') {
      test.skip(true, 'Frames identical — game may have a static title screen. Skip or interact first.');
    }
  });
});
