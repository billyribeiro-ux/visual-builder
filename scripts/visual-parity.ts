/**
 * Visual preview/export parity check.
 *
 *   pnpm test:parity:visual [--studio http://localhost:5174] [--threshold 0.001]
 *
 * 1. Exports the default demo project with `generateFullExport`, installs and builds the generated
 *    SvelteKit app in a temp dir, and serves it with `vite preview`.
 * 2. Uses the studio's standalone canvas (`/preview?path=<route>`, interactive mode) as the
 *    reference — starting a studio dev server when none is reachable.
 * 3. Screenshots every route at 375 / 768 / 1280 / 1440 in both (reduced motion, fonts loaded) and
 *    pixel-diffs them in the browser (no image dependencies).
 *
 * Exits 1 when any pair differs by more than `threshold` (fraction of pixels) or has a different
 * page height. Artifacts: /tmp/appviz-parity/report.json and per-pair PNGs.
 */
import { spawn, execSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createDefaultAcmeSaaSProject } from '../packages/schema/src/index.js';
import { generateFullExport } from '../packages/codegen/src/index.js';

const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test') as typeof import('@playwright/test');

const args = process.argv.slice(2);
const arg = (name: string, fallback: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const STUDIO = arg('studio', 'http://localhost:5174').replace(/\/$/, '');
const THRESHOLD = Number(arg('threshold', '0.001'));
const WIDTHS = [375, 768, 1280, 1440] as const;
const OUT = '/tmp/appviz-parity';
const APP_DIR = path.join(OUT, 'app');
const EXPORT_PORT = 4311;

const children: ChildProcess[] = [];
function cleanup() {
  for (const c of children) c.kill('SIGTERM');
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(130));

async function reachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function waitFor(url: string, timeoutMs = 90_000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await reachable(url)) return;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

function start(cmd: string, cmdArgs: string[], cwd: string): ChildProcess {
  const child = spawn(cmd, cmdArgs, { cwd, stdio: 'ignore', env: { ...process.env, FORCE_COLOR: '0' } });
  children.push(child);
  return child;
}

async function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(APP_DIR, { recursive: true });

  // 1. Export + build
  const project = createDefaultAcmeSaaSProject();
  const { files, binaryFiles = {} } = generateFullExport(project);
  for (const [file, content] of [...Object.entries(files), ...Object.entries(binaryFiles)]) {
    if (!file.startsWith('generated-app/')) continue;
    const dest = path.join(APP_DIR, file.slice('generated-app/'.length));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
  }
  console.log('• installing + building the exported app …');
  execSync('pnpm install --silent', { cwd: APP_DIR, stdio: 'inherit' });
  execSync('pnpm build', { cwd: APP_DIR, stdio: 'inherit' });
  start('pnpm', ['exec', 'vite', 'preview', '--port', String(EXPORT_PORT), '--strictPort'], APP_DIR);
  const exportBase = `http://localhost:${EXPORT_PORT}`;
  await waitFor(exportBase);

  // 2. Canvas reference
  let studio = STUDIO;
  if (!(await reachable(`${studio}/preview`))) {
    console.log(`• ${studio} not reachable — starting a studio dev server on :5199 …`);
    start('pnpm', ['--filter', '@app-viz/studio', 'exec', 'vite', 'dev', '--port', '5199', '--strictPort'], path.resolve(import.meta.dirname, '..'));
    studio = 'http://localhost:5199';
    await waitFor(`${studio}/preview`);
  }

  // 3. Screenshots + diff
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const differ = await browser.newPage();
  // Injected as a plain string: tsx/esbuild would otherwise add `__name` helpers to functions
  // serialized into the page.
  await differ.addScriptTag({
    content: `window.__appvizDiff = async (a, b) => {
      const load = (src) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = 'data:image/png;base64,' + src;
      });
      const [ia, ib] = await Promise.all([load(a), load(b)]);
      const w = Math.max(ia.width, ib.width);
      const h = Math.max(ia.height, ib.height);
      const read = (img) => {
        const c = document.createElement('canvas');
        c.width = w; c.height = h;
        const g = c.getContext('2d');
        g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, w, h).data;
      };
      const da = read(ia), db = read(ib);
      let differing = 0;
      for (let i = 0; i < da.length; i += 4) {
        if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) differing++;
      }
      return differing / (w * h);
    };`
  });
  const results: Array<{ route: string; width: number; diffRatio: number; heights: [number, number]; ok: boolean }> = [];

  for (const page of project.pages) {
    for (const width of WIDTHS) {
      const shots: Buffer[] = [];
      const heights: number[] = [];
      for (const url of [`${studio}/preview?path=${encodeURIComponent(page.path)}`, `${exportBase}${page.path}`]) {
        const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
        const p = await ctx.newPage();
        await p.goto(url, { waitUntil: 'networkidle' });
        await p.evaluate(() => document.fonts.ready);
        await p.waitForTimeout(250);
        heights.push(await p.evaluate(() => document.documentElement.scrollHeight));
        shots.push(await p.screenshot({ fullPage: true }));
        await ctx.close();
      }
      const slug = `${page.path === '/' ? 'home' : page.path.replace(/\//g, '_').replace(/^_/, '')}-${width}`;
      fs.writeFileSync(path.join(OUT, `${slug}-canvas.png`), shots[0]);
      fs.writeFileSync(path.join(OUT, `${slug}-export.png`), shots[1]);
      const diffRatio = (await differ.evaluate(
        ([a, b]) => (window as unknown as { __appvizDiff: (a: string, b: string) => Promise<number> }).__appvizDiff(a, b),
        [shots[0].toString('base64'), shots[1].toString('base64')] as const
      )) as number;
      const ok = diffRatio <= THRESHOLD && heights[0] === heights[1];
      results.push({ route: page.path, width, diffRatio, heights: [heights[0], heights[1]], ok });
      console.log(`${ok ? '✓' : '✗'} ${page.path.padEnd(22)} ${String(width).padStart(4)}px  diff ${(diffRatio * 100).toFixed(3)}%  heights ${heights.join(' / ')}`);
    }
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ studio, threshold: THRESHOLD, results }, null, 2));
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} pairs within ${(THRESHOLD * 100).toFixed(2)}% · artifacts in ${OUT}`);
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
