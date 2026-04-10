import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

const readArg = (name) => {
  const index = args.indexOf(name);
  if (index === -1) return "";
  return args[index + 1] ?? "";
};

const requireArg = (name) => {
  const value = readArg(name).trim();
  if (!value) {
    throw new Error(`Falta el argumento requerido ${name}`);
  }
  return value;
};

const assetsDir = path.resolve(requireArg("--assets-dir"));
const outputPath = path.resolve(requireArg("--output"));
const repository = requireArg("--repo");
const tag = requireArg("--tag");
const publishedAt = requireArg("--published-at");

const inferPlatform = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.includes("-windows-")) return "windows";
  if (lower.includes("-linux-")) return "linux";
  if (lower.includes("-macos-")) return "macos";
  return null;
};

const inferArch = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.includes("-arm64.")) return "arm64";
  if (lower.includes("-x64.")) return "x64";
  return "universal";
};

const inferKind = (fileName) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".exe")) return "installer";
  if (lower.endsWith(".appimage")) return "binary";
  return "archive";
};

const files = fs
  .readdirSync(assetsDir, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)
  .filter((fileName) => fileName !== "release-manifest.json");

const assets = files
  .map((fileName) => {
    const platform = inferPlatform(fileName);
    if (!platform) return null;

    const absolutePath = path.join(assetsDir, fileName);
    const stats = fs.statSync(absolutePath);

    return {
      platform,
      arch: inferArch(fileName),
      kind: inferKind(fileName),
      fileName,
      size: stats.size,
      downloadUrl: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(fileName)}`,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.fileName.localeCompare(b.fileName));

if (assets.length === 0) {
  throw new Error(`No se encontraron assets publicables en ${assetsDir}`);
}

const manifest = {
  repository,
  tag,
  publishedAt,
  assets,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), "utf8");

console.log(`[release-manifest] Generado en ${outputPath}`);
