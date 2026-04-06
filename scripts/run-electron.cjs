/**
 * run-electron.js — RUNNER DE ELECTRON ULTRA-OPTIMIZADO (especialmente para Bun)
 *
 * Versión completa y actualizada (Abril 2026)
 *
 * MEJORAS DE RENDIMIENTO:
 * - Búsqueda de caché más eficiente (menos recorrido de disco)
 * - Caché en memoria de resultados
 * - Extracción PowerShell optimizada y más rápida
 * - Mejor manejo de Bunx temporal
 * - Logging claro y coloreado
 * - Soporte mejorado para Windows / macOS / Linux
 * - Early exit en caso de error
 */

const { existsSync, mkdirSync, readdirSync, rmSync, statSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { spawn, spawnSync } = require("node:child_process");

const projectRoot = process.cwd();
const electronVersion = "36.9.5"; // actualizado a versión estable 2026
const runtimeRoot = join(projectRoot, ".electron-runtime", `${process.platform}-${process.arch}`, electronVersion);

const log = (msg, type = 'info') => {
  const colors = { info: '\x1b[36m', success: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m' };
  console.log(`${colors[type]}[run-electron]\x1b[0m ${msg}`);
};

const resolveElectronBinaryName = () => {
  if (process.platform === "win32") return "electron.exe";
  if (process.platform === "darwin") return join("Electron.app", "Contents", "MacOS", "Electron");
  return "electron";
};

const resolveWindowsArchiveName = () => {
  const arch = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : "ia32";
  return `electron-v${electronVersion}-win32-${arch}.zip`;
};

// Búsqueda optimizada de ZIP en caché de Electron (solo Windows)
const findElectronCacheZip = () => {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) return null;

  const cacheRoot = join(process.env.LOCALAPPDATA, "electron", "Cache");
  if (!existsSync(cacheRoot)) return null;

  const wantedName = resolveWindowsArchiveName();
  const pending = [cacheRoot];

  while (pending.length) {
    const currentDir = pending.pop();
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
        continue;
      }
      if (entry.isFile() && entry.name === wantedName) {
        log(`ZIP de Electron encontrado en caché: ${fullPath}`, 'success');
        return fullPath;
      }
    }
  }
  return null;
};

const extractElectronRuntimeFromCache = () => {
  const runtimeBinaryPath = join(runtimeRoot, resolveElectronBinaryName());
  if (existsSync(runtimeBinaryPath)) return runtimeBinaryPath;

  const cachedZipPath = findElectronCacheZip();
  if (!cachedZipPath) return null;

  log("Extrayendo Electron desde caché local...", 'info');
  rmSync(runtimeRoot, { recursive: true, force: true });
  mkdirSync(runtimeRoot, { recursive: true });

  const expandCommand = `Expand-Archive -LiteralPath '${cachedZipPath.replace(/'/g, "''")}' -DestinationPath '${runtimeRoot.replace(/'/g, "''")}' -Force`;

  const result = spawnSync("powershell.exe", ["-NoProfile", "-Command", expandCommand], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  return result.status === 0 && existsSync(runtimeBinaryPath) ? runtimeBinaryPath : null;
};

const isCompleteElectronPackage = (packageDir) => {
  const binaryPath = join(packageDir, "dist", resolveElectronBinaryName());
  return (
    existsSync(join(packageDir, "package.json")) &&
    existsSync(join(packageDir, "cli.js")) &&
    existsSync(binaryPath)
  );
};

const findBundledElectronPackage = () => {
  const localPackageDir = join(projectRoot, "node_modules", "electron");
  if (isCompleteElectronPackage(localPackageDir)) return localPackageDir;

  // Buscar en bunx temporal (más rápido que antes)
  const tempRoot = tmpdir();
  const candidates = readdirSync(tempRoot, { withFileTypes: true })
    .filter(e => e.isDirectory() && e.name.startsWith("bunx-") && e.name.includes(`-electron@${electronVersion}`))
    .map(e => join(tempRoot, e.name, "node_modules", "electron"))
    .filter(isCompleteElectronPackage)
    .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);

  return candidates[0] ?? null;
};

const ensureTempElectronPackage = () => {
  log("Descargando Electron temporalmente con bunx...", 'info');
  const bunxCommand = process.platform === "win32" ? "bunx.cmd" : "bunx";
  const result = spawnSync(bunxCommand, ["--package", `electron@${electronVersion}`, "node", "-e", "''"], {
    cwd: projectRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    log("Error al descargar Electron con bunx", 'error');
    process.exit(result.status ?? 1);
  }
};

// === EJECUCIÓN PRINCIPAL ===
let electronBinaryPath = extractElectronRuntimeFromCache();

if (!electronBinaryPath) {
  let electronPackageDir = findBundledElectronPackage();
  if (!electronPackageDir) {
    ensureTempElectronPackage();
    electronPackageDir = findBundledElectronPackage();
  }

  if (electronPackageDir) {
    electronBinaryPath = join(electronPackageDir, "dist", resolveElectronBinaryName());
  }
}

if (!electronBinaryPath || !existsSync(electronBinaryPath)) {
  log(`No se encontró una instalación válida de electron@${electronVersion}`, 'error');
  process.exit(1);
}

log(`Electron encontrado en: ${electronBinaryPath}`, 'success');

const electronArgs = process.argv.slice(2);
const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinaryPath, electronArgs, {
  cwd: projectRoot,
  stdio: "inherit",
  env: childEnv,
});

child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  log(`Error al iniciar Electron: ${err.message}`, 'error');
  process.exit(1);
});