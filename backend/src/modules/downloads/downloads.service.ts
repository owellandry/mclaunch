import fs from "node:fs";
import { scanArtifactRoots, type CatalogArtifact } from "../../infrastructure/filesystem/artifacts";
import type { RedisCache } from "../../infrastructure/redis/cache";

const CACHE_KEY = "mclaunch:downloads:catalog:v1";
const CACHE_TTL_SECONDS = 30;

export class DownloadsService {
  constructor(
    private readonly publicBaseUrl: string,
    private readonly version: string,
    private readonly cache: RedisCache,
    private readonly roots: Array<{ scope: "launcher" | "installer"; dir: string }>,
  ) {}

  async list(filters: { app?: string; platform?: string; arch?: string; kind?: string }): Promise<CatalogArtifact[]> {
    const artifacts = await this.scan();
    return artifacts.filter((artifact) => {
      if (filters.app && artifact.scope !== filters.app) return false;
      if (filters.platform && artifact.platform !== filters.platform) return false;
      if (filters.arch && artifact.arch !== filters.arch) return false;
      if (filters.kind && artifact.kind !== filters.kind) return false;
      return true;
    });
  }

  async resolve(filters: { app?: string; platform?: string; arch?: string; kind?: string }): Promise<CatalogArtifact | null> {
    const items = await this.list(filters);
    if (items.length === 0) return null;

    return items.sort((a, b) => {
      const score = (artifact: CatalogArtifact): number => {
        let value = 0;
        if (filters.platform && artifact.platform === filters.platform) value += 5;
        if (filters.arch && artifact.arch === filters.arch) value += 4;
        if (filters.kind && artifact.kind === filters.kind) value += 3;
        if (artifact.platform !== "unknown") value += 1;
        return value;
      };
      return score(b) - score(a) || b.fileName.localeCompare(a.fileName);
    })[0];
  }

  async readFile(scope: string, fileName: string): Promise<{ artifact: CatalogArtifact; bytes: Buffer } | null> {
    const artifact = (await this.scan()).find((item) => item.scope === scope && item.fileName === fileName);
    if (!artifact) return null;
    return {
      artifact,
      bytes: fs.readFileSync(artifact.absolutePath),
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

  private async scan(): Promise<CatalogArtifact[]> {
    const cached = await this.cache.getJson<CatalogArtifact[]>(CACHE_KEY);
    if (cached) return cached;

    const artifacts = scanArtifactRoots(
      this.publicBaseUrl,
      this.version,
      this.roots.map((root) => ({
        scope: root.scope,
        dir: root.dir,
        channel: "stable",
        routePrefix: `/api/v1/downloads/files/${root.scope}`,
        allowedExtensions: /\.(zip|exe|msi|dmg|pkg|appimage|deb|rpm|tar\.gz|tgz|bin)$/i,
      })),
    );

    await this.cache.setJson(CACHE_KEY, artifacts, CACHE_TTL_SECONDS);
    return artifacts;
  }
}
