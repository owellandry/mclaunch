const { existsSync, mkdirSync, readdirSync, rmSync, statSync } = require("node:fs");
const { join } = require("node:path");
const { tmpdir } = require("node:os");
const { spawn, spawnSync } = require("node:child_process");

const projectRoot = process.cwd();
const electronVersion = "36.9.5";
const runtimeRoot = join(projectRoot, ".electron-runtime", `${process.platform}-${process.arch}`, electronVersion);

const resolveElectronBinaryName = () => {
  if (process.platform === "win32") {
    return "electron.exe";
  }

  if (process.platform === "darwin") {
    return join("Electron.app", "Contents", "MacOS", "Electron");
  }

  return "electron";
};

const resolveWindowsArchiveName = () => {
  const arch = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : "ia32";
  return `electron-v${electronVersion}-win32-${arch}.zip`;
};

const escapePowerShell = (value) => value.replace(/'/g, "''");

const findElectronCacheZip = () => {
  if (process.platform !== "win32" || !process.env.LOCALAPPDATA) {
    return null;
  }

  const cacheRoot = join(process.env.LOCALAPPDATA, "electron", "Cache");
  if (!existsSync(cacheRoot)) {
    return null;
  }

  const wantedName = resolveWindowsArchiveName();
  const pending = [cacheRoot];

  while (pending.length > 0) {
    const currentDir = pending.pop();
    if (!currentDir) {
      continue;
    }

    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        pending.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name === wantedName) {
        return fullPath;
      }
    }
  }

  return null;
};

const extractElectronRuntimeFromCache = () => {
  const runtimeBinaryPath = join(runtimeRoot, resolveElectronBinaryName());
  if (existsSync(runtimeBinaryPath)) {
    return runtimeBinaryPath;
  }

  const cachedZipPath = findElectronCacheZip();
  if (!cachedZipPath) {
    return null;
  }

  rmSync(runtimeRoot, { recursive: true, force: true });
  mkdirSync(runtimeRoot, { recursive: true });

  const expandCommand = `Expand-Archive -LiteralPath '${escapePowerShell(cachedZipPath)}' -DestinationPath '${escapePowerShell(runtimeRoot)}' -Force`;
  const result = spawnSync(
    "powershell.exe",
    ["-NoProfile", "-Command", expandCommand],
    {
      cwd: projectRoot,
      stdio: "inherit",
    }
  );

  if (result.status !== 0 || !existsSync(runtimeBinaryPath)) {
    return null;
  }

  return runtimeBinaryPath;
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
  if (isCompleteElectronPackage(localPackageDir)) {
    return localPackageDir;
  }

  const tempRoot = tmpdir();
  const bunxPrefixes = readdirSync(tempRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => name.startsWith("bunx-") && name.endsWith(`-electron@${electronVersion}`))
    .map((name) => join(tempRoot, name, "node_modules", "electron"))
    .filter((candidate) => isCompleteElectronPackage(candidate))
    .sort((left, right) => statSync(right).mtimeMs - statSync(left).mtimeMs);

  return bunxPrefixes[0] ?? null;
};

const ensureTempElectronPackage = () => {
  const bunxCommand = process.platform === "win32" ? "bunx.cmd" : "bunx";
  const result = spawnSync(
    bunxCommand,
    ["--package", `electron@${electronVersion}`, "node", "-e", ""],
    {
      cwd: projectRoot,
      stdio: "inherit",
    }
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

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

if (!electronBinaryPath) {
  console.error(`[run-electron] No se encontr\u00f3 una instalaci\u00f3n completa de electron@${electronVersion}.`);
  process.exit(1);
}

const electronArgs = process.argv.slice(2);
const childEnv = { ...process.env };
delete childEnv.ELECTRON_RUN_AS_NODE;

const child = spawn(electronBinaryPath, electronArgs, {
  cwd: projectRoot,
  stdio: "inherit",
  env: childEnv,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[run-electron] No se pudo iniciar Electron:", error);
  process.exit(1);
});
