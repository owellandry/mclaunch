import fs from "node:fs";
import path from "node:path";
import { type CatalogArtifact } from "../../infrastructure/filesystem/artifacts";
import type { RedisCache } from "../../infrastructure/redis/cache";

const CACHE_KEY = "mclaunch:hotupdates:catalog:v2";
const CACHE_TTL_SECONDS = 30;

type HotupdateManifest = {
  schemaVersion?: number;
  releaseId?: string;
  channel?: string;
  publishedAt?: string;
  commitSha?: string;
  appVersion?: string;
  platform?: string;
  arch?: string;
  bundle?: {
    fileName?: string;
    sha256?: string;
    size?: number;
  };
  runtime?: {
    entryFile?: string;
    preloadFile?: string;
    rendererDir?: string;
  };
};

export type HotupdateCatalogArtifact = CatalogArtifact & {
  releaseId: string;
  publishedAt: string;
  commitSha: string;
  appVersion: string;
  bundleFileName: string;
  bundleDownloadUrl: string;
  bundleSha256: string;
  bundleSize: number;
  runtime: {
    entryFile: string;
    preloadFile: string;
    rendererDir: string;
  };
};

const DEFAULT_RUNTIME = {
  entryFile: "dist-electron/app-main.js",
  preloadFile: "dist-electron/preload.js",
  rendererDir: "react-ui/dist",
} as const;

const walkFiles = (rootDir: string): string[] => {
  if (!fs.existsSync(rootDir)) return [];

  const pending = [rootDir];
  const files: string[] = [];

  while (pending.length > 0) {
    const current = pending.shift() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(absolutePath);
      } else if (entry.isFile()) {
        files.push(absolutePath);
      }
    }
  }

  return files;
};

const readJsonFile = <T>(filePath: string): T | null => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
};

const normalizePlatform = (value: string | undefined): CatalogArtifact["platform"] => {
  if (value === "windows" || value === "macos" || value === "linux" || value === "unknown") return value;
  return "unknown";
};

export class HotupdatesService {
  constructor(
    private readonly publicBaseUrl: string,
    private readonly version: string,
    private readonly cache: RedisCache,
    private readonly packagesDir: string,
  ) {}

  async list(filters: { platform?: string; arch?: string; channel?: string }): Promise<HotupdateCatalogArtifact[]> {
    const artifacts = await this.scan();
    return artifacts.filter((artifact) => {
      if (filters.platform && artifact.platform !== filters.platform) return false;
      if (filters.arch && artifact.arch !== filters.arch) return false;
      if (filters.channel && artifact.channel !== filters.channel) return false;
      return true;
    });
  }

  async resolve(filters: { platform?: string; arch?: string; channel?: string }): Promise<HotupdateCatalogArtifact | null> {
    const items = await this.list(filters);
    if (items.length === 0) return null;

    return items.sort((a, b) => {
      const score = (artifact: HotupdateCatalogArtifact): number => {
        let value = 0;
        if (filters.platform && artifact.platform === filters.platform) value += 5;
        if (filters.arch && artifact.arch === filters.arch) value += 4;
        if (filters.channel && artifact.channel === filters.channel) value += 3;
        return value;
      };

      return (
        score(b) - score(a) ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() ||
        b.releaseId.localeCompare(a.releaseId)
      );
    })[0];
  }

  async readFile(fileName: string): Promise<{ artifact: CatalogArtifact; bytes: Buffer } | null> {
    const filePath = walkFiles(this.packagesDir).find((candidate) => path.basename(candidate) === fileName);
    if (!filePath) return null;

    const stats = fs.statSync(filePath);
    return {
      artifact: {
        id: `hotupdate:${fileName}`,
        scope: "hotupdate",
        platform: "unknown",
        arch: "universal",
        channel: "stable",
        version: this.version,
        kind: "hotupdate",
        fileName,
        relativePath: path.relative(this.packagesDir, filePath).replace(/\\/g, "/"),
        absolutePath: filePath,
        size: stats.size,
        downloadUrl: `${this.publicBaseUrl}/api/v1/hotupdates/files/${encodeURIComponent(fileName)}`,
      },
      bytes: fs.readFileSync(filePath),
    };
  }

  async reindex(): Promise<{ updatedAt: string; count: number }> {
    await this.cache.del(CACHE_KEY);
    const artifacts = await this.scan();
    return {
      updatedAt: new Date().toISOString(),
      count: artifacts.length,
    };
  }

  private async scan(): Promise<HotupdateCatalogArtifact[]> {
    const cached = await this.cache.getJson<HotupdateCatalogArtifact[]>(CACHE_KEY);
    if (cached) return cached;

    const artifacts = walkFiles(this.packagesDir)
      .filter((filePath) => filePath.toLowerCase().endsWith(".json"))
      .map((manifestPath) => this.buildCatalogArtifact(manifestPath))
      .filter((artifact): artifact is HotupdateCatalogArtifact => artifact !== null);

    await this.cache.setJson(CACHE_KEY, artifacts, CACHE_TTL_SECONDS);
    return artifacts;
  }

  private buildCatalogArtifact(manifestPath: string): HotupdateCatalogArtifact | null {
    const manifest = readJsonFile<HotupdateManifest>(manifestPath);
    if (!manifest) return null;

    const releaseId = manifest.releaseId?.trim();
    const publishedAt = manifest.publishedAt?.trim();
    const bundleFileName = manifest.bundle?.fileName?.trim();
    const appVersion = manifest.appVersion?.trim();
    if (!releaseId || !publishedAt || !bundleFileName || !appVersion) return null;

    const bundleAbsolutePath = path.join(path.dirname(manifestPath), bundleFileName);
    if (!fs.existsSync(bundleAbsolutePath)) return null;

    const manifestStats = fs.statSync(manifestPath);
    const bundleStats = fs.statSync(bundleAbsolutePath);
    const relativePath = path.relative(this.packagesDir, manifestPath).replace(/\\/g, "/");
    const fileName = path.basename(manifestPath);

    return {
      id: releaseId,
      scope: "hotupdate",
      platform: normalizePlatform(manifest.platform?.trim()),
      arch: manifest.arch?.trim() || "universal",
      channel: manifest.channel?.trim() || "stable",
      version: this.version,
      kind: "hotupdate",
      fileName,
      relativePath,
      absolutePath: manifestPath,
      size: manifestStats.size,
      downloadUrl: `${this.publicBaseUrl}/api/v1/hotupdates/files/${encodeURIComponent(fileName)}`,
      releaseId,
      publishedAt,
      commitSha: manifest.commitSha?.trim() || "",
      appVersion,
      bundleFileName,
      bundleDownloadUrl: `${this.publicBaseUrl}/api/v1/hotupdates/files/${encodeURIComponent(bundleFileName)}`,
      bundleSha256: manifest.bundle?.sha256?.trim() || "",
      bundleSize: manifest.bundle?.size ?? bundleStats.size,
      runtime: {
        entryFile: manifest.runtime?.entryFile?.trim() || DEFAULT_RUNTIME.entryFile,
        preloadFile: manifest.runtime?.preloadFile?.trim() || DEFAULT_RUNTIME.preloadFile,
        rendererDir: manifest.runtime?.rendererDir?.trim() || DEFAULT_RUNTIME.rendererDir,
      },
    };
  }
}
