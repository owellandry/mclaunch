/**
 * dev.mjs — Optimized development launcher for MCLaunch (Electron + React + Vite)
 *
 * Inspired by merlin-desktop / ForkX dev script.
 *
 * What this does vs the old concurrently approach:
 *  - Compiles electron/main.ts and electron/preload.ts in PARALLEL using esbuild
 *    (esbuild is ~100x faster than tsc for incremental builds)
 *  - Watches both electron files and rebuilds automatically on save
 *  - Uses an HTTP health-check to wait for Vite instead of a TCP port check
 *    (TCP port-open ≠ server ready; HTTP 200 = definitely ready)
 *  - Manages all child processes and cleans up correctly on Ctrl-C
 */

import { spawn }           from 'node:child_process';
import { createRequire }   from 'node:module';
import path                from 'node:path';
import { fileURLToPath }   from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { context as esbuildContext } from 'esbuild';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// ── Helpers ────────────────────────────────────────────────────────────────

const isWin       = process.platform === 'win32';
const pnpmCmd     = isWin ? 'pnpm.cmd' : 'pnpm';

// Use the electron binary that ships with the npm package (avoids run-electron.cjs complexity in dev).
const require     = createRequire(import.meta.url);
const electronBin = /** @type {string} */ (require('electron'));

const DEV_SERVER_URL = 'http://localhost:5173';

/** All spawned child processes — killed on exit. */
const children = /** @type {import('node:child_process').ChildProcess[]} */ ([]);

const killAll = () => {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
};

process.on('SIGINT',  () => { killAll(); process.exit(0); });
process.on('SIGTERM', () => { killAll(); process.exit(0); });

// ── 1. Compile electron/main.ts + electron/preload.ts with esbuild ─────────
// Using esbuild instead of tsc gives:
//   • First build in ~200ms instead of ~2s
//   • Incremental watch rebuilds in ~50ms
//   • No separate tsconfig needed for the watch step

/** @type {import('esbuild').BuildOptions} */
const sharedEsbuildOptions = {
  bundle:   true,          // resolve local relative imports (electron/ipc/*)
  packages: 'external',   // leave ALL node_modules as require() — don't bundle them
  platform: 'node',
  format:   'cjs',         // CommonJS — root package.json has no "type":"module"
  target:   'node20',      // Electron 36 ships Node 20
  sourcemap: 'inline',     // source maps for dev debugging
};

console.log('[dev] Compiling Electron main + preload…');

const [mainCtx, preloadCtx] = await Promise.all([
  esbuildContext({
    ...sharedEsbuildOptions,
    entryPoints: [path.join(projectRoot, 'electron/main.ts')],
    outfile:     path.join(projectRoot, 'dist-electron/main.js'),
  }),
  esbuildContext({
    ...sharedEsbuildOptions,
    entryPoints: [path.join(projectRoot, 'electron/preload.ts')],
    outfile:     path.join(projectRoot, 'dist-electron/preload.js'),
  }),
]);

// First build must complete before launching Electron.
await Promise.all([mainCtx.rebuild(), preloadCtx.rebuild()]);
console.log('[dev] Electron main + preload ready ✓');

// Start watching for incremental changes (rebuilds happen automatically).
await Promise.all([mainCtx.watch(), preloadCtx.watch()]);

// ── 2. Start Vite renderer (react-ui) ─────────────────────────────────────

const rendererProcess = spawn(pnpmCmd, ['--dir', 'react-ui', 'dev'], {
  cwd:   projectRoot,
  stdio: 'inherit',
  // On Windows, .cmd files must be launched through a shell.
  shell: isWin,
});
children.push(rendererProcess);
console.log('[dev] Vite renderer starting…');

// ── 3. HTTP health-check — wait until Vite is actually serving content ─────
// TCP wait-on only checks if the port is open; the HTTP check verifies that
// Vite has finished its initial transform pass and is returning real content.

const waitForRenderer = async () => {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const res = await fetch(DEV_SERVER_URL);
      if (res.ok) return;
    } catch {
      // Vite not ready yet — wait and retry.
    }
    await delay(500);
  }
  throw new Error(
    `[dev] Vite dev server did not respond at ${DEV_SERVER_URL} within 30 s.\n` +
    `      Check that pnpm --dir react-ui dev is not failing.`
  );
};

await waitForRenderer();
console.log(`[dev] Vite ready at ${DEV_SERVER_URL} ✓`);

// ── 4. Launch Electron ─────────────────────────────────────────────────────

const electronProcess = spawn(
  electronBin,
  [path.join(projectRoot, 'dist-electron/main.js')],
  {
    cwd:   projectRoot,
    stdio: 'inherit',
    env:   {
      ...process.env,
      VITE_DEV_SERVER_URL: DEV_SERVER_URL,
      // Remove this flag if present — it makes electron behave as plain Node.
      ELECTRON_RUN_AS_NODE: undefined,
    },
  }
);
children.push(electronProcess);
console.log('[dev] Electron launched ✓');
console.log('[dev] esbuild is watching electron/ for changes (no restart needed for renderer changes).');

// ── 5. Process lifecycle ───────────────────────────────────────────────────

const dispose = async () => {
  await Promise.allSettled([mainCtx.dispose(), preloadCtx.dispose()]);
  killAll();
};

rendererProcess.on('exit', async (code) => {
  await dispose();
  process.exit(code ?? 0);
});

electronProcess.on('exit', async (code) => {
  await dispose();
  process.exit(code ?? 0);
});
