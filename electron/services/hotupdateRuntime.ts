import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import { app } from "electron";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_API_BASE_URL = "https://my3u2eiq2b78xmirlj4l.servgrid.xyz";
const HOTUPDATE_CHANNEL = "stable";
const HOTUPDATE_ROOT_DIRNAME = "hotupdates";
const HOTUPDATE_RELEASES_DIRNAME = "releases";
const HOTUPDATE_TEMP_DIRNAME = "temp";
const HOTUPDATE_CURRENT_FILE = "current.json";

export type HotupdateRuntimeLayout = {
  entryFile: string;
  preloadFile: string;
  rendererDir: string;
};

export type ResolvedHotupdateArtifact = {
  id: string;
  scope: string;
  platform: string;
  arch: string;
  channel: string;
  version: string;
  kind: string;
  fileName: string;
  relativePath: string;
  absolutePath: string;
  size: number;
  downloadUrl: string;
  releaseId: string;
  publishedAt: string;
  commitSha: string;
  appVersion: string;
  bundleFileName: string;
  bundleDownloadUrl: string;
  bundleSha256: string;
  bundleSize: number;
  runtime: HotupdateRuntimeLayout;
};

type AppliedHotupdateState = {
  hotupdate: ResolvedHotupdateArtifact;
  releaseDir: string;
  appliedAt: string;
};

export type DesktopRuntimePaths = {
  source: "bundled" | "hotupdate";
  rootDir: string;
  entryPath: string;
  preloadPath: string;
  rendererDistPath: string;
  releaseId?: string;
  hotupdate?: ResolvedHotupdateArtifact;
};

const DEFAULT_RUNTIME_LAYOUT: HotupdateRuntimeLayout = {
  entryFile: "dist-electron/app-main.js",
  preloadFile: "dist-electron/preload.js",
  rendererDir: "react-ui/dist",
};

const readJsonFile = <T>(filePath: string): T | null => {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
};

const ensureDirectory = (dirPath: string): void => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const getApiBaseUrl = (): string => process.env.MCLAUNCH_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const getHotupdateRootDir = (): string => path.join(app.getPath("userData"), HOTUPDATE_ROOT_DIRNAME);

const getCurrentStatePath = (): string => path.join(getHotupdateRootDir(), HOTUPDATE_CURRENT_FILE);

const getBundledAppRoot = (): string => app.getAppPath();

const normalizeRuntimeLayout = (
  runtime: Partial<HotupdateRuntimeLayout> | undefined,
): HotupdateRuntimeLayout => ({
  entryFile: runtime?.entryFile?.trim() || DEFAULT_RUNTIME_LAYOUT.entryFile,
  preloadFile: runtime?.preloadFile?.trim() || DEFAULT_RUNTIME_LAYOUT.preloadFile,
  rendererDir: runtime?.rendererDir?.trim() || DEFAULT_RUNTIME_LAYOUT.rendererDir,
});

const toRuntimePaths = (
  rootDir: string,
  source: "bundled" | "hotupdate",
  hotupdate?: ResolvedHotupdateArtifact,
): DesktopRuntimePaths => {
  const runtime = normalizeRuntimeLayout(hotupdate?.runtime);
  const base: DesktopRuntimePaths = {
    source,
    rootDir,
    entryPath: path.join(rootDir, runtime.entryFile),
    preloadPath: path.join(rootDir, runtime.preloadFile),
    rendererDistPath: path.join(rootDir, runtime.rendererDir),
  };

  if (hotupdate?.releaseId) {
    base.releaseId = hotupdate.releaseId;
    base.hotupdate = hotupdate;
  }

  return base;
};

const isValidRuntime = (runtime: DesktopRuntimePaths): boolean =>
  fs.existsSync(runtime.entryPath) &&
  fs.existsSync(runtime.preloadPath) &&
  fs.existsSync(path.join(runtime.rendererDistPath, "index.html"));

const cleanupOldReleases = (releasesDir: string, keepReleaseId?: string): void => {
  if (!fs.existsSync(releasesDir)) return;

  for (const entry of fs.readdirSync(releasesDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (keepReleaseId && entry.name === keepReleaseId) continue;
    fs.rmSync(path.join(releasesDir, entry.name), { recursive: true, force: true });
  }
};

const persistAppliedState = (state: AppliedHotupdateState): void => {
  fs.writeFileSync(getCurrentStatePath(), JSON.stringify(state, null, 2), "utf8");
};

const readAppliedState = (): AppliedHotupdateState | null => readJsonFile<AppliedHotupdateState>(getCurrentStatePath());

const hashBuffer = (buffer: Buffer): string => createHash("sha256").update(buffer).digest("hex");

const fetchJson = async <T>(url: string): Promise<T | null> => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(4_000),
      headers: {
        accept: "application/json",
      },
    });

    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as T;
  } catch (error) {
    console.warn("[hotupdate] No fue posible consultar el backend:", error);
    return null;
  }
};

const fetchLatestHotupdate = async (): Promise<ResolvedHotupdateArtifact | null> => {
  const payload = await fetchJson<{ ok: boolean; data?: ResolvedHotupdateArtifact }>(
    `${getApiBaseUrl().replace(/\/+$/, "")}/api/v1/hotupdates/resolve?channel=${HOTUPDATE_CHANNEL}`,
  );

  if (!payload?.ok || !payload.data) return null;
  return {
    ...payload.data,
    runtime: normalizeRuntimeLayout(payload.data.runtime),
  };
};

const downloadBundle = async (artifact: ResolvedHotupdateArtifact): Promise<Buffer | null> => {
  try {
    const response = await fetch(artifact.bundleDownloadUrl, {
      signal: AbortSignal.timeout(20_000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const bytes = Buffer.from(await response.arrayBuffer());
    if (artifact.bundleSize > 0 && bytes.length !== artifact.bundleSize) {
      throw new Error(`Tamano inesperado del bundle (${bytes.length} != ${artifact.bundleSize})`);
    }

    const digest = hashBuffer(bytes);
    if (artifact.bundleSha256 && digest !== artifact.bundleSha256) {
      throw new Error("El SHA256 del hotupdate no coincide.");
    }

    return bytes;
  } catch (error) {
    console.warn("[hotupdate] Fallo la descarga del bundle:", error);
    return null;
  }
};

const extractBundle = (archivePath: string, releaseDir: string): boolean => {
  const command = process.platform === "win32" ? "tar.exe" : "tar";
  const result = spawnSync(command, ["-xzf", archivePath, "-C", releaseDir], {
    stdio: "pipe",
  });

  if (result.status === 0) return true;

  const errorOutput = result.stderr?.toString("utf8").trim();
  if (errorOutput) {
    console.warn("[hotupdate] Error extrayendo bundle:", errorOutput);
  }
  return false;
};

const applyHotupdate = async (artifact: ResolvedHotupdateArtifact): Promise<AppliedHotupdateState | null> => {
  const hotupdateRoot = getHotupdateRootDir();
  const releasesDir = path.join(hotupdateRoot, HOTUPDATE_RELEASES_DIRNAME);
  const tempDir = path.join(hotupdateRoot, HOTUPDATE_TEMP_DIRNAME);
  const releaseDir = path.join(releasesDir, artifact.releaseId);
  const archivePath = path.join(tempDir, artifact.bundleFileName);

  ensureDirectory(releasesDir);
  ensureDirectory(tempDir);

  const existingRuntime = toRuntimePaths(releaseDir, "hotupdate", artifact);
  if (isValidRuntime(existingRuntime)) {
    const state: AppliedHotupdateState = {
      hotupdate: artifact,
      releaseDir,
      appliedAt: new Date().toISOString(),
    };
    persistAppliedState(state);
    cleanupOldReleases(releasesDir, artifact.releaseId);
    return state;
  }

  const bundle = await downloadBundle(artifact);
  if (!bundle) return null;

  fs.rmSync(releaseDir, { recursive: true, force: true });
  ensureDirectory(releaseDir);
  fs.writeFileSync(archivePath, bundle);

  const extracted = extractBundle(archivePath, releaseDir);
  fs.rmSync(archivePath, { force: true });

  if (!extracted) {
    fs.rmSync(releaseDir, { recursive: true, force: true });
    return null;
  }

  const runtime = toRuntimePaths(releaseDir, "hotupdate", artifact);
  if (!isValidRuntime(runtime)) {
    console.warn("[hotupdate] El release extraido no contiene la estructura esperada.");
    fs.rmSync(releaseDir, { recursive: true, force: true });
    return null;
  }

  const state: AppliedHotupdateState = {
    hotupdate: artifact,
    releaseDir,
    appliedAt: new Date().toISOString(),
  };

  persistAppliedState(state);
  cleanupOldReleases(releasesDir, artifact.releaseId);
  return state;
};

export const getBundledRuntimePaths = (): DesktopRuntimePaths => {
  const bundled = toRuntimePaths(getBundledAppRoot(), "bundled");
  if (!isValidRuntime(bundled)) {
    console.warn("[hotupdate] No se encontro el runtime base esperado del launcher.");
  }
  return bundled;
};

export const disableCurrentHotupdate = (releaseId?: string): void => {
  const state = readAppliedState();
  if (!state) return;
  if (releaseId && state.hotupdate.releaseId !== releaseId) return;

  fs.rmSync(getCurrentStatePath(), { force: true });
};

export const resolveDesktopRuntime = async (): Promise<DesktopRuntimePaths> => {
  const currentVersion = app.getVersion();
  const bundled = getBundledRuntimePaths();
  const hotupdateRoot = getHotupdateRootDir();
  const releasesDir = path.join(hotupdateRoot, HOTUPDATE_RELEASES_DIRNAME);
  const tempDir = path.join(hotupdateRoot, HOTUPDATE_TEMP_DIRNAME);

  ensureDirectory(hotupdateRoot);
  ensureDirectory(releasesDir);
  ensureDirectory(tempDir);

  let appliedState = readAppliedState();
  if (appliedState) {
    const currentRuntime = toRuntimePaths(appliedState.releaseDir, "hotupdate", appliedState.hotupdate);
    if (appliedState.hotupdate.appVersion !== currentVersion || !isValidRuntime(currentRuntime)) {
      disableCurrentHotupdate(appliedState.hotupdate.releaseId);
      appliedState = null;
    }
  }

  const latest = await fetchLatestHotupdate();
  if (latest && latest.appVersion === currentVersion) {
    if (!appliedState || appliedState.hotupdate.releaseId !== latest.releaseId) {
      const downloaded = await applyHotupdate(latest);
      if (downloaded) appliedState = downloaded;
    }
  }

  if (appliedState) {
    const runtime = toRuntimePaths(appliedState.releaseDir, "hotupdate", appliedState.hotupdate);
    if (isValidRuntime(runtime)) {
      return runtime;
    }
  }

  return bundled;
};
