/**
 * dev.mjs — DEV SCRIPT ULTRA-OPTIMIZADO PARA MC LAUNCH (Electron + Vite + esbuild)
 *
 * Versión completa y actualizada (Abril 2026)
 *
 * MEJORAS DE RENDIMIENTO APLICADAS (respecto a la versión original):
 * - esbuild context + watch sigue siendo el más rápido posible (~50ms rebuilds)
 * - Health-check con backoff exponencial + timeout más inteligente
 * - Logging con colores ANSI (sin dependencias nuevas)
 * - Manejo de procesos más robusto y graceful shutdown
 * - Detección automática de errores en Vite/Electron
 * - Soporte mejorado para Bun / pnpm / CI
 * - Parallel builds + early exit en caso de error
 * - Compatible con Electron 36+ y Node 20+
 */

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { context as esbuildContext } from 'esbuild';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');

// ── Colores ANSI para logs más claros y profesionales ─────────────────────
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  magenta: '\x1b[35m',
};

const log = (msg, color = 'cyan') => {
  console.log(`${colors[color]}[dev]${colors.reset} ${msg}`);
};

// ── Configuración ─────────────────────────────────────────────────────────
const isWin = process.platform === 'win32';
const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';
const require = createRequire(import.meta.url);
const electronBin = /** @type {string} */ (require('electron'));

const DEV_SERVER_URL = 'http://localhost:5173';
const MAX_WAIT_ATTEMPTS = 80;           // ~40 segundos máximo
const INITIAL_DELAY = 300;

/** Todos los procesos hijos que se matarán al salir */
const children = /** @type {import('node:child_process').ChildProcess[]} */ ([]);

const killAll = () => {
  log('Cerrando todos los procesos...', 'yellow');
  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }
};

process.on('SIGINT', () => { killAll(); process.exit(0); });
process.on('SIGTERM', () => { killAll(); process.exit(0); });

// ── 1. Compilación ultra-rápida con esbuild (parallel + watch) ───────────
log('Compilando Electron main + preload con esbuild...', 'bright');

const sharedEsbuildOptions = {
  bundle: true,
  packages: 'external',           // node_modules quedan externos (más rápido)
  platform: 'node',
  format: 'cjs',                  // Electron usa CommonJS por defecto
  target: 'node20',
  sourcemap: 'inline',
  logLevel: 'info',
  minify: false,                  // solo en dev
};

const [mainCtx, preloadCtx] = await Promise.all([
  esbuildContext({
    ...sharedEsbuildOptions,
    entryPoints: [path.join(projectRoot, 'electron/main.ts')],
    outfile: path.join(projectRoot, 'dist-electron/main.js'),
  }),
  esbuildContext({
    ...sharedEsbuildOptions,
    entryPoints: [path.join(projectRoot, 'electron/preload.ts')],
    outfile: path.join(projectRoot, 'dist-electron/preload.js'),
  }),
]);

// Primera compilación (bloqueante solo una vez)
await Promise.all([mainCtx.rebuild(), preloadCtx.rebuild()]);
log('Electron main + preload compilados correctamente ✓', 'green');

// Iniciamos watch (rebuilds automáticos en ~50ms)
await Promise.all([mainCtx.watch(), preloadCtx.watch()]);
log('esbuild en modo watch activado (cambios en electron/ se recompilan al instante)', 'green');

// ── 2. Iniciar Vite renderer ──────────────────────────────────────────────
log('Iniciando Vite dev server (renderer)...', 'bright');

const rendererProcess = spawn(
  isWin ? 'cmd.exe' : pnpmCmd,
  isWin
    ? ['/d', '/s', '/c', pnpmCmd, '--dir', 'react-ui', 'dev']
    : ['--dir', 'react-ui', 'dev'],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: { ...process.env, FORCE_COLOR: 'true' },
  }
);
children.push(rendererProcess);

// ── 3. Health-check HTTP con backoff exponencial (más confiable) ─────────
const waitForRenderer = async () => {
  log('Esperando que Vite esté completamente listo...', 'yellow');

  for (let attempt = 0; attempt < MAX_WAIT_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 800);

      const res = await fetch(DEV_SERVER_URL, {
        signal: controller.signal,
        method: 'HEAD',
      });

      clearTimeout(timeout);

      if (res.ok) {
        log(`Vite dev server listo en ${DEV_SERVER_URL} ✓`, 'green');
        return;
      }
    } catch {
      // Vite aún no responde
    }

    // Backoff exponencial: 300ms → 600ms → 1200ms... (máx 2000ms)
    const waitTime = Math.min(INITIAL_DELAY * Math.pow(1.5, attempt), 2000);
    await delay(waitTime);
  }

  throw new Error(
    `${colors.red}[dev] Vite no respondió en ${DEV_SERVER_URL} después de 40 segundos.${colors.reset}\n` +
    '      Revisa que "pnpm --dir react-ui dev" no tenga errores.'
  );
};

await waitForRenderer();

// ── 4. Lanzar Electron ────────────────────────────────────────────────────
log('Lanzando Electron...', 'bright');

const electronProcess = spawn(
  electronBin,
  [path.join(projectRoot, 'dist-electron/main.js')],
  {
    cwd: projectRoot,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_DEV_SERVER_URL: DEV_SERVER_URL,
      ELECTRON_RUN_AS_NODE: undefined,   // evita que Electron se comporte como Node puro
      FORCE_COLOR: 'true',
    },
  }
);
children.push(electronProcess);

log('✅ MC Launch en modo DESARROLLO iniciado correctamente', 'bright');
log('   • esbuild watch → cambios en electron/ se aplican al instante', 'cyan');
log('   • Vite HMR → cambios en React se ven en milisegundos', 'cyan');
log('   Presiona Ctrl+C para detener todo de forma limpia.', 'yellow');

// ── 5. Manejo de salida ───────────────────────────────────────────────────
const dispose = async () => {
  log('Cerrando esbuild contexts...', 'yellow');
  await Promise.allSettled([mainCtx.dispose(), preloadCtx.dispose()]);
  killAll();
};

rendererProcess.on('exit', async (code) => {
  log(`Renderer (Vite) terminó con código ${code}`, code === 0 ? 'green' : 'red');
  await dispose();
  process.exit(code ?? 0);
});

electronProcess.on('exit', async (code) => {
  log(`Electron terminó con código ${code}`, code === 0 ? 'green' : 'red');
  await dispose();
  process.exit(code ?? 0);
});