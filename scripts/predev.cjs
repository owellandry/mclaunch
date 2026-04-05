const { existsSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = process.cwd();
const userAgent = process.env.npm_config_user_agent ?? "";
const isBunRun = userAgent.startsWith("bun/");
const hasBunInstall = existsSync(join(projectRoot, "node_modules", ".bun"));
const hasPnpmInstall = existsSync(join(projectRoot, "node_modules", ".pnpm"));

const electronBinaryCandidates = process.platform === "win32"
  ? [join(projectRoot, "node_modules", "electron", "dist", "electron.exe")]
  : process.platform === "darwin"
    ? [join(projectRoot, "node_modules", "electron", "dist", "Electron.app")]
    : [join(projectRoot, "node_modules", "electron", "dist", "electron")];

const hasElectronBinary = electronBinaryCandidates.some((candidate) => existsSync(candidate));

if (isBunRun || hasBunInstall) {
  console.log("[predev] Bun ya gestiona node_modules; se omite pnpm install.");
  process.exit(0);
}

if (hasPnpmInstall && hasElectronBinary) {
  console.log("[predev] Dependencias listas; se omite pnpm install.");
  process.exit(0);
}

const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const result = spawnSync(command, ["install", "--prefer-offline"], {
  cwd: projectRoot,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
