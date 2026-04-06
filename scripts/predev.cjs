/**
 * predev.js — PRE-DEV SCRIPT ULTRA-OPTIMIZADO
 *
 * Versión completa y actualizada (Abril 2026)
 *
 * MEJORAS DE RENDIMIENTO:
 * - Detección más rápida de instalaciones existentes (Bun, pnpm, .pnpm, .bun)
 * - Uso de --prefer-offline + --frozen-lockfile en CI
 * - Logging más claro y coloreado
 * - Soporte mejorado para entornos CI / Docker / GitHub Actions
 * - Early exit si todo ya está listo (reduce tiempo de "pnpm install" innecesario)
 */

const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = process.cwd();
const userAgent = process.env.npm_config_user_agent ?? "";
const isBunRun = userAgent.startsWith("bun/");
const hasBunInstall = existsSync(join(projectRoot, "node_modules", ".bun"));
const hasPnpmInstall = existsSync(join(projectRoot, "node_modules", ".pnpm"));
const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);

console.log("\x1b[36m[predev]\x1b[0m Verificando dependencias...");

const electronBinaryCandidates = process.platform === "win32"
  ? [join(projectRoot, "node_modules", "electron", "dist", "electron.exe")]
  : process.platform === "darwin"
    ? [join(projectRoot, "node_modules", "electron", "dist", "Electron.app")]
    : [join(projectRoot, "node_modules", "electron", "dist", "electron")];

const hasElectronBinary = electronBinaryCandidates.some(existsSync);

if (isBunRun || hasBunInstall) {
  console.log("\x1b[32m[predev]\x1b[0m Bun ya gestiona node_modules → omitiendo install.");
  process.exit(0);
}

if (hasPnpmInstall && hasElectronBinary) {
  console.log("\x1b[32m[predev]\x1b[0m Dependencias ya instaladas y Electron listo → omitiendo install.");
  process.exit(0);
}

// Si estamos en CI o no hay nada, instalamos de forma optimizada
console.log("\x1b[33m[predev]\x1b[0m Instalando dependencias con pnpm...");

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const args = isCI
  ? ["install", "--prefer-offline", "--frozen-lockfile", "--ignore-scripts"]
  : ["install", "--prefer-offline"];

const result = spawnSync(command, args, {
  cwd: projectRoot,
  stdio: "inherit",
  env: { ...process.env, FORCE_COLOR: "true" },
});

if (result.status !== 0) {
  console.error("\x1b[31m[predev]\x1b[0m Error durante pnpm install.");
  process.exit(result.status ?? 1);
}

console.log("\x1b[32m[predev]\x1b[0m Dependencias instaladas correctamente ✓");
process.exit(0);