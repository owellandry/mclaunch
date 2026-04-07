import fs from "node:fs";
import { scanArtifactRoots, type CatalogArtifact } from "../../infrastructure/filesystem/artifacts";
import type { RedisCache } from "../../infrastructure/redis/cache";

const CACHE_KEY = "mclaunch:hotupdates:catalog:v1";
const CACHE_TTL_SECONDS = 30;

export class HotupdatesService {
  constructor(
    private readonly publicBaseUrl: string,
    private readonly version: string,
    private readonly cache: RedisCache,
    private readonly packagesDir: string,
  ) {}

  async list(filters: { platform?: string; arch?: string; channel?: string }): Promise<CatalogArtifact[]> {
    const artifacts = await this.scan();
    return artifacts.filter((artifact) => {
      if (filters.platform && artifact.platform !== filters.platform) return false;
      if (filters.arch && artifact.arch !== filters.arch) return false;
      if (filters.channel && artifact.channel !== filters.channel) return false;
      return true;
    });
  }

  async resolve(filters: { platform?: string; arch?: string; channel?: string }): Promise<CatalogArtifact | null> {
    const items = await this.list(filters);
    if (items.length === 0) return null;
    return items.sort((a, b) => {
      const score = (artifact: CatalogArtifact): number => {
        let value = 0;
        if (filters.platform && artifact.platform === filters.platform) value += 5;
        if (filters.arch && artifact.arch === filters.arch) value += 4;
        if (filters.channel && artifact.channel === filters.channel) value += 3;
        return value;
      };
      return score(b) - score(a) || b.fileName.localeCompare(a.fileName);
    })[0];
  }

  async readFile(fileName: string): Promise<{ artifact: CatalogArtifact; bytes: Buffer } | null> {
    const artifact = (await this.scan()).find((item) => item.fileName === fileName);
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

    const artifacts = scanArtifactRoots(this.publicBaseUrl, this.version, [
      {
        scope: "hotupdate",
        dir: this.packagesDir,
        channel: "stable",
        kind: "hotupdate",
        routePrefix: "/api/v1/hotupdates/files",
        allowedExtensions: /\.(zip|json|sig|bin|tar\.gz|tgz)$/i,
      },
    ]);

    await this.cache.setJson(CACHE_KEY, artifacts, CACHE_TTL_SECONDS);
    return artifacts;
  }
}
