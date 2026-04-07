import fs from "node:fs";
import path from "node:path";

export type ArtifactPlatform = "windows" | "macos" | "linux" | "unknown";
export type ArtifactKind = "installer" | "portable" | "archive" | "package" | "binary" | "hotupdate";

export type CatalogArtifact = {
  id: string;
  scope: string;
  platform: ArtifactPlatform;
  arch: string;
  channel: string;
  version: string;
  kind: ArtifactKind;
  fileName: string;
  relativePath: string;
  absolutePath: string;
  size: number;
  downloadUrl: string;
};

type RootDefinition = {
  scope: string;
  dir: string;
  channel: string;
  kind?: ArtifactKind;
  routePrefix: string;
  allowedExtensions: RegExp;
};

const inferPlatform = (fileName: string): ArtifactPlatform => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".exe") || lower.endsWith(".msi") || lower.includes("win")) return "windows";
  if (lower.endsWith(".dmg") || lower.endsWith(".pkg") || lower.includes("mac")) return "macos";
  if (lower.endsWith(".appimage") || lower.endsWith(".deb") || lower.endsWith(".rpm") || lower.includes("linux")) return "linux";
  return "unknown";
};

const inferArch = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.includes("arm64") || lower.includes("aarch64")) return "arm64";
  if (lower.includes("x64") || lower.includes("amd64")) return "x64";
  if (lower.includes("ia32") || lower.includes("x86")) return "x86";
  return "universal";
};

const inferKind = (fileName: string): ArtifactKind => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".exe") || lower.endsWith(".msi") || lower.endsWith(".dmg") || lower.endsWith(".pkg")) return "installer";
  if (lower.endsWith(".zip")) return "portable";
  if (lower.endsWith(".appimage") || lower.endsWith(".bin")) return "binary";
  if (lower.endsWith(".deb") || lower.endsWith(".rpm")) return "package";
  return "archive";
};

const walkFiles = (rootDir: string): string[] => {
  if (!fs.existsSync(rootDir)) return [];
  const queue = [rootDir];
  const files: string[] = [];

  while (queue.length > 0) {
    const current = queue.shift() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
      } else if (entry.isFile()) {
        files.push(fullPath);
      }
    }
  }

  return files;
};

export const scanArtifactRoots = (
  publicBaseUrl: string,
  appVersion: string,
  roots: RootDefinition[],
): CatalogArtifact[] => {
  const artifacts: CatalogArtifact[] = [];

  for (const root of roots) {
    for (const absolutePath of walkFiles(root.dir)) {
      const fileName = path.basename(absolutePath);
      const lower = fileName.toLowerCase();
      if (!root.allowedExtensions.test(lower)) continue;

      const relativePath = path.relative(root.dir, absolutePath).replace(/\\/g, "/");
      const stats = fs.statSync(absolutePath);

      artifacts.push({
        id: `${root.scope}:${relativePath}`,
        scope: root.scope,
        platform: inferPlatform(fileName),
        arch: inferArch(fileName),
        channel: root.channel,
        version: appVersion,
        kind: root.kind ?? inferKind(fileName),
        fileName,
        relativePath,
        absolutePath,
        size: stats.size,
        downloadUrl: `${publicBaseUrl}${root.routePrefix}/${encodeURIComponent(fileName)}`,
      });
    }
  }

  return artifacts;
};
