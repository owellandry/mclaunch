const { existsSync, rmSync } = require("node:fs");
const { join } = require("node:path");
const { spawnSync } = require("node:child_process");

const projectRoot = process.cwd();
const unpackedDir = join(projectRoot, "dist", "win-unpacked");
const executablePath = join(unpackedDir, "Slaumcher.exe");
const outputZip = join(projectRoot, "dist", "Slaumcher-local-portable.zip");
const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const powershellCommand = process.platform === "win32" ? "powershell.exe" : "powershell";

function run(command, args, options = {}) {
  const result = process.platform === "win32"
    ? spawnSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command, ...args], {
        cwd: projectRoot,
        stdio: "inherit",
        shell: false,
        ...options,
      })
    : spawnSync(command, args, {
        cwd: projectRoot,
        stdio: "inherit",
        shell: false,
        ...options,
      });

  if (result.error) {
    console.error(`[dist:local] No se pudo ejecutar ${command}: ${result.error.message}`);
    return 1;
  }

  return result.status ?? 1;
}

function fail(message) {
  console.error(`[dist:local] ${message}`);
  process.exit(1);
}

if (process.platform !== "win32") {
  fail("Este script local está preparado para Windows porque empaqueta una build portable .zip.");
}

if (run(pnpmCommand, ["build"]) !== 0) {
  fail("La build base falló.");
}

const builderExitCode = run(pnpmCommand, ["exec", "electron-builder", "--dir"]);
if (builderExitCode !== 0 && !existsSync(executablePath)) {
  fail("electron-builder falló antes de generar dist/win-unpacked.");
}

if (!existsSync(executablePath)) {
  fail("No se encontró la app portable generada en dist/win-unpacked.");
}

rmSync(outputZip, { force: true });

const compressExitCode = spawnSync(
  powershellCommand,
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-Command",
    `Compress-Archive -Path '${unpackedDir}\\*' -DestinationPath '${outputZip}' -Force`,
  ],
  {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
  }
).status ?? 1;

if (compressExitCode !== 0) {
  fail("No se pudo comprimir la build portable.");
}

console.log(`[dist:local] Build lista en: ${outputZip}`);
