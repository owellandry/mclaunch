import { app, shell } from "electron";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";

const DEFAULT_GITHUB_REPOSITORY = process.env.MCLAUNCH_GITHUB_REPOSITORY?.trim() || "owellandry/mclaunch";
const DEFAULT_RELEASE_TAG = process.env.MCLAUNCH_INSTALL_TARGET_TAG?.trim() || "";
const RELEASE_MANIFEST_NAME = "release-manifest.json";
const INSTALLER_USER_AGENT = "Slaumcher-Installer";

export type SupportedPlatform = "windows" | "linux" | "macos";
export type SupportedArch = "x64" | "arm64" | "universal";

export type SystemProfile = {
  platform: SupportedPlatform;
  arch: SupportedArch;
  version: string;
  osVersion: string;
  tempDir: string;
  homeDir: string;
};

export type InstallerUiEvent =
  | {
      type: "state";
      phase: "detect" | "resolve" | "download" | "install" | "verify";
      progress: number;
      message: string;
    }
  | {
      type: "log";
      level: "info" | "warn" | "error";
      message: string;
    }
  | {
      type: "done";
      progress: 100;
      message: string;
      releaseTag: string;
      assetName: string;
      installPath: string;
      platform: SupportedPlatform;
      arch: SupportedArch;
    }
  | {
      type: "error";
      message: string;
    };

export type InstallState =
  | {
      status: "idle";
    }
  | {
      status: "running";
      phase: "detect" | "resolve" | "download" | "install" | "verify";
      progress: number;
      message: string;
    }
  | {
      status: "done";
      releaseTag: string;
      assetName: string;
      installPath: string;
      platform: SupportedPlatform;
      arch: SupportedArch;
    }
  | {
      status: "error";
      message: string;
    };

type GitHubReleaseAsset = {
  id: number;
  name: string;
  size: number;
  browser_download_url: string;
  content_type: string;
};

type GitHubRelease = {
  id: number;
  tag_name: string;
  name: string;
  draft: boolean;
  prerelease: boolean;
  published_at: string;
  assets: GitHubReleaseAsset[];
};

type ReleaseManifestAsset = {
  platform: SupportedPlatform;
  arch: SupportedArch;
  kind: "installer" | "archive" | "binary";
  fileName: string;
  size?: number;
  downloadUrl?: string;
};

type ReleaseManifest = {
  repository: string;
  tag: string;
  publishedAt: string;
  assets: ReleaseManifestAsset[];
};

type ResolvedReleaseAsset = {
  releaseTag: string;
  publishedAt: string;
  platform: SupportedPlatform;
  arch: SupportedArch;
  kind: "installer" | "archive" | "binary";
  fileName: string;
  size: number;
  downloadUrl: string;
};

type EventSink = (event: InstallerUiEvent) => void;

let lastInstallState: InstallState = { status: "idle" };
let lastInstalledAppPath = "";
let installPromise: Promise<InstallState> | null = null;

const normalizePlatform = (value: NodeJS.Platform): SupportedPlatform => {
  if (value === "win32") return "windows";
  if (value === "darwin") return "macos";
  return "linux";
};

const normalizeArch = (value: string): SupportedArch => {
  if (value === "arm64" || value === "aarch64") return "arm64";
  if (value === "x64" || value === "amd64") return "x64";
  return "universal";
};

const getSystemProfile = (): SystemProfile => ({
  platform: normalizePlatform(process.platform),
  arch: normalizeArch(process.arch),
  version: app.getVersion(),
  osVersion: os.release(),
  tempDir: app.getPath("temp"),
  homeDir: os.homedir(),
});

const withGitHubHeaders = (): Record<string, string> => ({
  accept: "application/vnd.github+json",
  "user-agent": INSTALLER_USER_AGENT,
});

const fetchJson = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: withGitHubHeaders(),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} consultando ${url}`);
  }

  return (await response.json()) as T;
};

const runProcess = (command: string, args: string[], options: { cwd?: string } = {}): Promise<void> =>
  new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: "ignore",
      windowsHide: true,
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} finalizo con codigo ${code ?? "desconocido"}`));
    });
  });

const emitState = (
  sink: EventSink,
  phase: "detect" | "resolve" | "download" | "install" | "verify",
  progress: number,
  message: string,
): void => {
  lastInstallState = {
    status: "running",
    phase,
    progress,
    message,
  };

  sink({
    type: "state",
    phase,
    progress,
    message,
  });
};

const emitLog = (sink: EventSink, level: "info" | "warn" | "error", message: string): void => {
  sink({
    type: "log",
    level,
    message,
  });
};

const inferManifestAsset = (release: GitHubRelease, asset: GitHubReleaseAsset): ReleaseManifestAsset | null => {
  const name = asset.name.toLowerCase();
  const platform = name.includes("windows")
    ? "windows"
    : name.includes("linux")
      ? "linux"
      : name.includes("macos") || name.includes("darwin")
        ? "macos"
        : null;

  if (!platform) return null;

  const arch = name.includes("arm64") || name.includes("aarch64")
    ? "arm64"
    : name.includes("x64") || name.includes("amd64")
      ? "x64"
      : "universal";

  const kind = name.endsWith(".exe")
    ? "installer"
    : name.endsWith(".appimage")
      ? "binary"
      : "archive";

  return {
    platform,
    arch,
    kind,
    fileName: asset.name,
    size: asset.size,
    downloadUrl: asset.browser_download_url,
  };
};

const loadReleaseManifest = async (release: GitHubRelease): Promise<ReleaseManifest | null> => {
  const manifestAsset = release.assets.find((asset) => asset.name === RELEASE_MANIFEST_NAME);
  if (!manifestAsset) return null;

  const response = await fetch(manifestAsset.browser_download_url, {
    headers: {
      ...withGitHubHeaders(),
      accept: "application/octet-stream",
    },
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`No se pudo descargar ${RELEASE_MANIFEST_NAME}: HTTP ${response.status}`);
  }

  return (await response.json()) as ReleaseManifest;
};

const fetchTargetRelease = async (): Promise<{ release: GitHubRelease; manifest: ReleaseManifest | null }> => {
  const encodedRepo = DEFAULT_GITHUB_REPOSITORY;
  const url = DEFAULT_RELEASE_TAG
    ? `https://api.github.com/repos/${encodedRepo}/releases/tags/${encodeURIComponent(DEFAULT_RELEASE_TAG)}`
    : `https://api.github.com/repos/${encodedRepo}/releases/latest`;

  const release = await fetchJson<GitHubRelease>(url);
  if (release.draft) {
    throw new Error("La release encontrada sigue en draft.");
  }

  let manifest: ReleaseManifest | null = null;
  try {
    manifest = await loadReleaseManifest(release);
  } catch (error) {
    console.warn("[installer] No se pudo leer release-manifest.json, se usara heuristica.", error);
  }

  return { release, manifest };
};

const resolveBestAsset = (system: SystemProfile, release: GitHubRelease, manifest: ReleaseManifest | null): ResolvedReleaseAsset => {
  const manifestAssets = manifest?.assets?.length
    ? manifest.assets
    : release.assets
        .map((asset) => inferManifestAsset(release, asset))
        .filter((item): item is ReleaseManifestAsset => item !== null);

  const candidates = manifestAssets
    .filter((asset) => asset.platform === system.platform)
    .map((asset) => ({
      ...asset,
      size: asset.size ?? release.assets.find((releaseAsset) => releaseAsset.name === asset.fileName)?.size ?? 0,
      downloadUrl:
        asset.downloadUrl ??
        release.assets.find((releaseAsset) => releaseAsset.name === asset.fileName)?.browser_download_url ??
        "",
    }))
    .filter((asset) => Boolean(asset.downloadUrl));

  const preferredArchs: SupportedArch[] =
    system.arch === "arm64" ? ["arm64", "universal", "x64"] : ["x64", "universal", "arm64"];

  for (const arch of preferredArchs) {
    const exact = candidates.find((asset) => asset.arch === arch);
    if (exact) {
      return {
        releaseTag: manifest?.tag || release.tag_name,
        publishedAt: manifest?.publishedAt || release.published_at,
        platform: exact.platform,
        arch: exact.arch,
        kind: exact.kind,
        fileName: exact.fileName,
        size: exact.size,
        downloadUrl: exact.downloadUrl,
      };
    }
  }

  throw new Error(`No hay artefactos compatibles para ${system.platform}/${system.arch} en la release ${release.tag_name}.`);
};

const downloadReleaseAsset = async (
  asset: ResolvedReleaseAsset,
  system: SystemProfile,
  sink: EventSink,
): Promise<string> => {
  const response = await fetch(asset.downloadUrl, {
    headers: {
      "user-agent": INSTALLER_USER_AGENT,
    },
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok || !response.body) {
    throw new Error(`No se pudo descargar ${asset.fileName}: HTTP ${response.status}`);
  }

  const downloadDir = path.join(system.tempDir, "slaumcher-installer");
  fs.mkdirSync(downloadDir, { recursive: true });

  const destination = path.join(downloadDir, asset.fileName);
  const stream = fs.createWriteStream(destination);
  const totalBytes = asset.size || Number(response.headers.get("content-length") || 0);
  let downloadedBytes = 0;

  emitState(sink, "download", 28, `Descargando ${asset.fileName}...`);

  for await (const chunk of Readable.fromWeb(response.body as globalThis.ReadableStream<Uint8Array>)) {
    downloadedBytes += chunk.length;
    stream.write(chunk);

    if (totalBytes > 0) {
      const progress = 28 + Math.round((downloadedBytes / totalBytes) * 34);
      emitState(sink, "download", Math.min(progress, 62), `Descargando ${asset.fileName}...`);
    }
  }

  await new Promise<void>((resolve, reject) => {
    stream.end(() => resolve());
    stream.on("error", reject);
  });

  return destination;
};

const tryResolveWindowsInstallPath = (): string => {
  const candidates = [
    path.join(process.env.LOCALAPPDATA || "", "Programs", "Slaumcher", "Slaumcher.exe"),
    path.join(process.env.ProgramFiles || "", "Slaumcher", "Slaumcher.exe"),
    path.join(process.env["ProgramFiles(x86)"] || "", "Slaumcher", "Slaumcher.exe"),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return candidates[0] || "";
};

const installOnWindows = async (downloadPath: string): Promise<string> => {
  await runProcess(downloadPath, ["/S"]);
  return tryResolveWindowsInstallPath();
};

const installOnLinux = async (downloadPath: string, system: SystemProfile): Promise<string> => {
  const installDir = path.join(system.homeDir, ".local", "share", "slaumcher");
  const binaryPath = path.join(installDir, "Slaumcher.AppImage");
  const applicationsDir = path.join(system.homeDir, ".local", "share", "applications");
  const binDir = path.join(system.homeDir, ".local", "bin");
  const desktopPath = path.join(applicationsDir, "slaumcher.desktop");
  const symlinkPath = path.join(binDir, "slaumcher");

  fs.mkdirSync(installDir, { recursive: true });
  fs.mkdirSync(applicationsDir, { recursive: true });
  fs.mkdirSync(binDir, { recursive: true });

  fs.copyFileSync(downloadPath, binaryPath);
  fs.chmodSync(binaryPath, 0o755);

  fs.writeFileSync(
    desktopPath,
    [
      "[Desktop Entry]",
      "Type=Application",
      "Name=Slaumcher",
      `Exec=${binaryPath}`,
      "Terminal=false",
      "Categories=Game;",
      "",
    ].join("\n"),
    "utf8",
  );

  try {
    if (fs.existsSync(symlinkPath)) fs.rmSync(symlinkPath, { force: true });
    fs.symlinkSync(binaryPath, symlinkPath);
  } catch {
    // Si el symlink falla, la instalacion igual queda util via .desktop y binario directo.
  }

  return binaryPath;
};

const resolveWritableMacApplicationsDir = (system: SystemProfile): string => {
  const sharedApplications = "/Applications";
  try {
    fs.accessSync(sharedApplications, fs.constants.W_OK);
    return sharedApplications;
  } catch {
    const userApplications = path.join(system.homeDir, "Applications");
    fs.mkdirSync(userApplications, { recursive: true });
    return userApplications;
  }
};

const installOnMacos = async (downloadPath: string, system: SystemProfile): Promise<string> => {
  const extractDir = path.join(system.tempDir, "slaumcher-installer", "macos-extract");
  fs.rmSync(extractDir, { recursive: true, force: true });
  fs.mkdirSync(extractDir, { recursive: true });

  await runProcess("/usr/bin/ditto", ["-x", "-k", downloadPath, extractDir]);

  const appBundle = fs
    .readdirSync(extractDir, { withFileTypes: true })
    .find((entry) => entry.isDirectory() && entry.name.endsWith(".app"));

  if (!appBundle) {
    throw new Error("La release de macOS no contiene una app .app valida.");
  }

  const targetDir = resolveWritableMacApplicationsDir(system);
  const destination = path.join(targetDir, appBundle.name);

  fs.rmSync(destination, { recursive: true, force: true });
  fs.cpSync(path.join(extractDir, appBundle.name), destination, { recursive: true });
  return destination;
};

const installAsset = async (asset: ResolvedReleaseAsset, downloadPath: string, system: SystemProfile): Promise<string> => {
  if (system.platform === "windows") {
    return installOnWindows(downloadPath);
  }

  if (system.platform === "macos") {
    return installOnMacos(downloadPath, system);
  }

  return installOnLinux(downloadPath, system);
};

export const launchInstalledApp = async (): Promise<void> => {
  if (!lastInstalledAppPath) {
    throw new Error("Todavia no hay una instalacion completada.");
  }

  const error = await shell.openPath(lastInstalledAppPath);
  if (error) {
    throw new Error(error);
  }
};

export const getInstallState = (): InstallState => lastInstallState;

export const getInstallerSystemProfile = (): SystemProfile => getSystemProfile();

export const startInstallerFlow = (sink: EventSink): Promise<InstallState> => {
  if (installPromise) return installPromise;

  installPromise = (async () => {
    try {
      const system = getSystemProfile();
      emitState(sink, "detect", 8, `Sistema detectado: ${system.platform}/${system.arch}`);

      emitState(sink, "resolve", 18, "Consultando release oficial en GitHub...");
      const { release, manifest } = await fetchTargetRelease();
      const asset = resolveBestAsset(system, release, manifest);
      emitLog(sink, "info", `Release objetivo: ${asset.releaseTag}`);
      emitLog(sink, "info", `Artefacto seleccionado: ${asset.fileName}`);

      const downloadPath = await downloadReleaseAsset(asset, system, sink);
      emitState(sink, "install", 72, "Aplicando instalacion del launcher...");

      const installPath = await installAsset(asset, downloadPath, system);
      lastInstalledAppPath = installPath;

      emitState(sink, "verify", 92, "Verificando instalacion final...");
      if (installPath && !fs.existsSync(installPath)) {
        throw new Error("La instalacion termino sin dejar un binario o app localizable.");
      }

      lastInstallState = {
        status: "done",
        releaseTag: asset.releaseTag,
        assetName: asset.fileName,
        installPath,
        platform: system.platform,
        arch: system.arch,
      };

      sink({
        type: "done",
        progress: 100,
        message: "Instalacion completada correctamente.",
        releaseTag: asset.releaseTag,
        assetName: asset.fileName,
        installPath,
        platform: system.platform,
        arch: system.arch,
      });

      return lastInstallState;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido en la instalacion.";
      lastInstallState = {
        status: "error",
        message,
      };
      sink({
        type: "error",
        message,
      });
      return lastInstallState;
    } finally {
      installPromise = null;
    }
  })();

  return installPromise;
};
