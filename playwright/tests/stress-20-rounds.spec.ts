/**
 * Stress Test — Play 20 rounds of Pixel Bounce and report what happens.
 *
 * Each round: start game → play with random input → wait for game over → restart.
 * Captures screenshots, console errors, and timing for every round.
 */
import { test, expect } from '@playwright/test';
import { GameRunner } from '../lib/game-runner';

const GAME_URL = process.env.GAME_URL || 'https://jperezdelreal.github.io/pixel-bounce/';
const TOTAL_ROUNDS = 20;
const MAX_ROUND_TIME_MS = 25_000; // max wait per round before forcing next

interface RoundResult {
  round: number;
  status: 'completed' | 'timeout' | 'error';
  playTimeMs: number;
  errors: string[];
  screenshots: string[];
}

test.describe('Stress Test — 20 Rounds', () => {
  test('play 20 consecutive rounds and report results', async () => {
    test.setTimeout(600_000); // 10 minutes total

    const game = new GameRunner({ viewport: { width: 400, height: 600 } });
    const results: RoundResult[] = [];
    const globalErrors: string[] = [];

    try {
      await game.launchUrl(GAME_URL);
      const page = game.page!;

      // Collect all JS console errors globally
      page.on('pageerror', (err) => {
        globalErrors.push(`[${new Date().toISOString()}] ${err.message}`);
      });
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          globalErrors.push(`[console.error] ${msg.text()}`);
        }
      });

      // Take initial screenshot
      await game.screenshot('stress-initial');

      for (let round = 1; round <= TOTAL_ROUNDS; round++) {
        const roundErrors: string[] = [];
        const roundScreenshots: string[] = [];
        const roundStart = Date.now();

        console.log(`\n══════ ROUND ${round}/${TOTAL_ROUNDS} ══════`);

        try {
          // --- START THE GAME ---
          // Click canvas center to transition TITLE → PLAY
          await game.clickAt(200, 300);
          await game.waitForFrames(15);

          // Screenshot at start of round
          const startShot = await game.screenshot(`stress-r${round}-start`);
          roundScreenshots.push(startShot);

          // --- PLAY THE GAME ---
          // Random movement for 5-10 seconds
          const playDuration = 5000 + Math.floor(Math.random() * 5000);
          const keys = ['ArrowLeft', 'ArrowRight', 'a', 'd'];
          const moveStart = Date.now();

          while (Date.now() - moveStart < playDuration) {
            const action = Math.random();

            if (action < 0.35) {
              // Move left
              const holdTime = 100 + Math.floor(Math.random() * 400);
              await game.pressKey('ArrowLeft', holdTime);
            } else if (action < 0.70) {
              // Move right
              const holdTime = 100 + Math.floor(Math.random() * 400);
              await game.pressKey('ArrowRight', holdTime);
            } else if (action < 0.85) {
              // Alternate keys (a/d)
              const key = Math.random() < 0.5 ? 'a' : 'd';
              const holdTime = 100 + Math.floor(Math.random() * 300);
              await game.pressKey(key, holdTime);
            } else {
              // Stay still — let the ball bounce naturally
              await page.waitForTimeout(200 + Math.floor(Math.random() * 500));
            }
          }

          // Mid-game screenshot
          const midShot = await game.screenshot(`stress-r${round}-mid`);
          roundScreenshots.push(midShot);

          // --- WAIT FOR GAME OVER ---
          // The player will eventually fall off screen. Wait up to MAX_ROUND_TIME_MS.
          let gameOver = false;
          const waitStart = Date.now();

          while (Date.now() - waitStart < MAX_ROUND_TIME_MS) {
            // Check for game-over state by reading canvas text area
            // The game draws "GAME OVER" overlay — detect dark overlay at center
            const centerPixel = await game.getCanvasPixel(200, 250);
            if (centerPixel) {
              // Game over screen has a dark semi-transparent overlay
              // During gameplay the center is usually the sky/background (bright)
              // Game over: darker overlay with text
              const brightness = (centerPixel.r + centerPixel.g + centerPixel.b) / 3;
              if (brightness < 60 && centerPixel.a > 200) {
                gameOver = true;
                break;
              }
            }

            // Keep moving randomly while waiting
            const key = keys[Math.floor(Math.random() * keys.length)];
            await game.pressKey(key, 150);
            await page.waitForTimeout(200);
          }

          // Game over screenshot
          const overShot = await game.screenshot(`stress-r${round}-gameover`);
          roundScreenshots.push(overShot);

          const playTimeMs = Date.now() - roundStart;

          // Capture any errors that occurred during this round
          const errorsThisRound = globalErrors.slice();
          if (errorsThisRound.length > roundErrors.length) {
            roundErrors.push(...errorsThisRound.slice(roundErrors.length));
          }

          const status = gameOver ? 'completed' : 'timeout';
          console.log(`  Status: ${status} | Play time: ${playTimeMs}ms | Errors: ${roundErrors.length}`);
          if (roundErrors.length > 0) {
            console.log(`  Errors: ${roundErrors.join(', ')}`);
          }

          results.push({
            round,
            status,
            playTimeMs,
            errors: [...roundErrors],
            screenshots: roundScreenshots,
          });

          // --- RESTART ---
          // Click to go from OVER → TITLE
          await game.clickAt(200, 300);
          await page.waitForTimeout(500);
          // Click again to go from TITLE → PLAY (next round starts at top of loop)
          // Actually, the next iteration of the loop clicks to start, so just
          // make sure we're back at TITLE state
          await game.clickAt(200, 300);
          await page.waitForTimeout(500);

        } catch (err: any) {
          const playTimeMs = Date.now() - roundStart;
          console.log(`  ❌ Round ${round} ERROR: ${err.message}`);
          roundErrors.push(err.message);

          results.push({
            round,
            status: 'error',
            playTimeMs,
            errors: [...roundErrors],
            screenshots: roundScreenshots,
          });

          // Try to recover — click to restart
          try {
            await game.clickAt(200, 300);
            await game.page!.waitForTimeout(1000);
            await game.clickAt(200, 300);
            await game.page!.waitForTimeout(500);
          } catch {
            console.log(`  ⚠️ Could not recover, trying to continue...`);
          }
        }
      }

      // --- FINAL SCREENSHOT ---
      await game.screenshot('stress-final');

      // --- PRINT SUMMARY ---
      console.log('\n\n' + '═'.repeat(60));
      console.log('  STRESS TEST SUMMARY — 20 ROUNDS');
      console.log('═'.repeat(60));

      const completed = results.filter(r => r.status === 'completed').length;
      const timeouts = results.filter(r => r.status === 'timeout').length;
      const errors = results.filter(r => r.status === 'error').length;
      const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0);
      const avgTime = results.reduce((sum, r) => sum + r.playTimeMs, 0) / results.length;

      console.log(`  Rounds completed:  ${completed}/${TOTAL_ROUNDS}`);
      console.log(`  Rounds timed out:  ${timeouts}/${TOTAL_ROUNDS}`);
      console.log(`  Rounds with error: ${errors}/${TOTAL_ROUNDS}`);
      console.log(`  Total JS errors:   ${totalErrors}`);
      console.log(`  Avg round time:    ${Math.round(avgTime)}ms`);
      console.log('');

      // Per-round details if there were issues
      const problemRounds = results.filter(r => r.status !== 'completed' || r.errors.length > 0);
      if (problemRounds.length > 0) {
        console.log('  PROBLEM ROUNDS:');
        for (const r of problemRounds) {
          console.log(`    Round ${r.round}: ${r.status} (${r.playTimeMs}ms) — ${r.errors.length} error(s)`);
          for (const err of r.errors) {
            console.log(`      → ${err}`);
          }
        }
      } else {
        console.log('  ✅ All rounds completed without issues!');
      }

      // Global error dump
      if (globalErrors.length > 0) {
        console.log('\n  ALL CONSOLE ERRORS:');
        const uniqueErrors = [...new Set(globalErrors)];
        for (const err of uniqueErrors) {
          console.log(`    • ${err}`);
        }
      }

      // Timing analysis
      const times = results.map(r => r.playTimeMs);
      const firstHalf = times.slice(0, 10);
      const secondHalf = times.slice(10);
      const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      console.log(`\n  PERFORMANCE:`);
      console.log(`    Avg time (rounds 1-10):  ${Math.round(avgFirst)}ms`);
      console.log(`    Avg time (rounds 11-20): ${Math.round(avgSecond)}ms`);
      if (avgSecond > avgFirst * 1.5) {
        console.log(`    ⚠️ Significant slowdown detected in later rounds!`);
      } else {
        console.log(`    ✅ No significant performance degradation.`);
      }

      console.log('\n' + '═'.repeat(60));

      // The test passes as long as it doesn't crash entirely.
      // We log everything for human review.
      expect(results.length).toBe(TOTAL_ROUNDS);

    } finally {
      await game.close();
    }
  });
});
