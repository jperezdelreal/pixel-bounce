/**
 * GameRunner — Playwright-powered visual game testing harness.
 *
 * Opens HTML5 games in real Chromium, simulates player input,
 * captures screenshots, and validates visual/DOM state.
 *
 * Ported from Syntax Sorcery's VisualGameRunner (proven on 3 games, 20+ tests).
 */
import { chromium, Browser, BrowserContext, Page } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';
import * as http from 'http';

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.ts': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

interface ServerInfo {
  server: http.Server;
  port: number;
  url: string;
}

interface GameRunnerOptions {
  screenshotDir?: string;
  viewport?: { width: number; height: number };
  headless?: boolean;
}

interface PixelColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

interface DiffResult {
  diffPixels: number;
  totalPixels: number;
  diffPercent: string;
}

/**
 * Create a lightweight static file server for serving game assets.
 * Listens on port 0 (OS-assigned random port) to avoid conflicts.
 */
function createGameServer(rootDir: string): Promise<ServerInfo> {
  const server = http.createServer((req, res) => {
    let filePath = path.join(rootDir, req.url === '/' ? 'index.html' : req.url!);
    filePath = decodeURIComponent(filePath);

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(err.code === 'ENOENT' ? 404 : 500);
        res.end(err.code === 'ENOENT' ? 'Not Found' : 'Server Error');
        return;
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as { port: number };
      resolve({ server, port: addr.port, url: `http://127.0.0.1:${addr.port}` });
    });
  });
}

export class GameRunner {
  browser: Browser | null = null;
  context: BrowserContext | null = null;
  page: Page | null = null;
  serverInfo: ServerInfo | null = null;

  private screenshotDir: string;
  private viewport: { width: number; height: number };
  private headless: boolean;
  private screenshots = new Map<string, string>();

  constructor(options: GameRunnerOptions = {}) {
    this.screenshotDir = options.screenshotDir || path.resolve(__dirname, '..', 'test-results', 'screenshots');
    this.viewport = options.viewport || { width: 400, height: 600 };
    this.headless = options.headless !== undefined ? options.headless : true;
  }

  /**
   * Launch a game from a local HTML file. Spins up a static server automatically.
   * Use for plain HTML/JS games (no bundler required).
   */
  async launchGame(htmlPath: string): Promise<Page> {
    const resolvedPath = path.resolve(htmlPath);
    const gameDir = path.dirname(resolvedPath);
    const htmlFile = path.basename(resolvedPath);

    this.serverInfo = await createGameServer(gameDir);
    const gameUrl = `${this.serverInfo.url}/${htmlFile}`;

    return this._openBrowser(gameUrl);
  }

  /**
   * Launch a game from an already-running URL (e.g., Vite/Webpack dev server).
   * Use for games that require a build tool (TypeScript, PixiJS, Phaser, etc.).
   */
  async launchUrl(url: string): Promise<Page> {
    return this._openBrowser(url);
  }

  private async _openBrowser(url: string): Promise<Page> {
    this.browser = await chromium.launch({ headless: this.headless });
    this.context = await this.browser.newContext({ viewport: this.viewport });
    this.page = await this.context.newPage();
    await this.page.goto(url, { waitUntil: 'networkidle' });

    // Wait for canvas — games that don't use canvas will timeout gracefully
    await this.page.waitForSelector('canvas', { timeout: 10_000 }).catch(() => {});

    return this.page;
  }

  /** Capture a named screenshot. Returns the file path. */
  async screenshot(name: string): Promise<string> {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
    const filename = `${name}.png`;
    const filepath = path.join(this.screenshotDir, filename);
    await this.page!.screenshot({ path: filepath });
    this.screenshots.set(name, filepath);
    return filepath;
  }

  /** Simulate a key press with optional hold duration (ms). */
  async pressKey(key: string, durationMs = 100): Promise<void> {
    await this.page!.keyboard.down(key);
    await this.page!.waitForTimeout(durationMs);
    await this.page!.keyboard.up(key);
  }

  /** Click at specific canvas/page coordinates. */
  async clickAt(x: number, y: number): Promise<void> {
    await this.page!.mouse.click(x, y);
  }

  /** Wait for N animation frames to elapse in-browser. */
  async waitForFrames(n: number): Promise<void> {
    await this.page!.evaluate((frameCount: number) => {
      return new Promise<void>((resolve) => {
        let count = 0;
        function tick() {
          count++;
          if (count >= frameCount) resolve();
          else requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }, n);
  }

  /** Read a pixel's RGBA value from the canvas at (x, y). */
  async getCanvasPixel(x: number, y: number): Promise<PixelColor | null> {
    return this.page!.evaluate(({ px, py }: { px: number; py: number }) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      const dpr = window.devicePixelRatio || 1;
      const data = ctx.getImageData(px * dpr, py * dpr, 1, 1).data;
      return { r: data[0], g: data[1], b: data[2], a: data[3] };
    }, { px: x, py: y });
  }

  /** Read text content from a DOM selector (for games with HTML HUD). */
  async getTextContent(selector: string): Promise<string | null> {
    const element = await this.page!.$(selector);
    if (!element) return null;
    return element.textContent();
  }

  /** Check if a canvas region has non-uniform pixels (i.e., something is drawn). */
  async hasVisualContent(x: number, y: number, width: number, height: number): Promise<boolean> {
    return this.page!.evaluate(({ rx, ry, rw, rh }: { rx: number; ry: number; rw: number; rh: number }) => {
      const canvas = document.querySelector('canvas');
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;
      const dpr = window.devicePixelRatio || 1;
      const data = ctx.getImageData(rx * dpr, ry * dpr, rw * dpr, rh * dpr).data;
      const first = [data[0], data[1], data[2], data[3]];
      for (let i = 4; i < data.length; i += 4) {
        if (data[i] !== first[0] || data[i + 1] !== first[1] ||
            data[i + 2] !== first[2] || data[i + 3] !== first[3]) {
          return true;
        }
      }
      return false;
    }, { rx: x, ry: y, rw: width, rh: height });
  }

  /**
   * Compare two named screenshots pixel-by-pixel.
   * Returns 'identical' or a diff summary { diffPixels, totalPixels, diffPercent }.
   */
  async compareScreenshots(nameA: string, nameB: string): Promise<'identical' | DiffResult> {
    const pathA = this.screenshots.get(nameA);
    const pathB = this.screenshots.get(nameB);
    if (!pathA || !pathB) {
      throw new Error(`Screenshot not found: ${!pathA ? nameA : nameB}`);
    }

    const bufA = fs.readFileSync(pathA);
    const bufB = fs.readFileSync(pathB);

    if (bufA.equals(bufB)) return 'identical';

    const result = await this.page!.evaluate(async ({ imgA, imgB }: { imgA: string; imgB: string }) => {
      function loadImage(dataUrl: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = dataUrl;
        });
      }

      const imageA = await loadImage(imgA);
      const imageB = await loadImage(imgB);
      const w = Math.max(imageA.width, imageB.width);
      const h = Math.max(imageA.height, imageB.height);

      const canvasA = document.createElement('canvas');
      canvasA.width = w; canvasA.height = h;
      const ctxA = canvasA.getContext('2d')!;
      ctxA.drawImage(imageA, 0, 0);
      const dataA = ctxA.getImageData(0, 0, w, h).data;

      const canvasB = document.createElement('canvas');
      canvasB.width = w; canvasB.height = h;
      const ctxB = canvasB.getContext('2d')!;
      ctxB.drawImage(imageB, 0, 0);
      const dataB = ctxB.getImageData(0, 0, w, h).data;

      let diffPixels = 0;
      const totalPixels = w * h;
      for (let i = 0; i < dataA.length; i += 4) {
        if (dataA[i] !== dataB[i] || dataA[i + 1] !== dataB[i + 1] ||
            dataA[i + 2] !== dataB[i + 2] || dataA[i + 3] !== dataB[i + 3]) {
          diffPixels++;
        }
      }
      return { diffPixels, totalPixels, diffPercent: (diffPixels / totalPixels * 100).toFixed(2) };
    }, {
      imgA: `data:image/png;base64,${bufA.toString('base64')}`,
      imgB: `data:image/png;base64,${bufB.toString('base64')}`,
    });

    return result;
  }

  /** Record gameplay as a series of screenshots over a duration. */
  async recordGameplay(seconds: number, fps = 5): Promise<string[]> {
    const frames: string[] = [];
    const interval = 1000 / fps;
    const totalFrames = Math.ceil(seconds * fps);

    for (let i = 0; i < totalFrames; i++) {
      const name = `recording-frame-${String(i).padStart(4, '0')}`;
      const filepath = await this.screenshot(name);
      frames.push(filepath);
      if (i < totalFrames - 1) {
        await this.page!.waitForTimeout(interval);
      }
    }
    return frames;
  }

  /** Clean up: close browser and stop local server. */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    if (this.serverInfo?.server) {
      this.serverInfo.server.close();
      this.serverInfo = null;
    }
  }
}

export { createGameServer };
export type { GameRunnerOptions, PixelColor, DiffResult, ServerInfo };
