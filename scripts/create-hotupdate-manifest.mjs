import { createHash } from "node:crypto";
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

const bundlePath = path.resolve(requireArg("--bundle"));
const outputPath = path.resolve(requireArg("--output"));
const releaseId = requireArg("--release-id");
const commitSha = requireArg("--commit");
const publishedAt = requireArg("--published-at");

if (!fs.existsSync(bundlePath)) {
  throw new Error(`No existe el bundle: ${bundlePath}`);
}

const packageJsonPath = path.resolve("package.json");
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const bundleBuffer = fs.readFileSync(bundlePath);
const bundleStats = fs.statSync(bundlePath);

const manifest = {
  schemaVersion: 1,
  releaseId,
  channel: "stable",
  publishedAt,
  commitSha,
  appVersion: String(packageJson.version || "0.0.0"),
  platform: "unknown",
  arch: "universal",
  bundle: {
    fileName: path.basename(bundlePath),
    sha256: createHash("sha256").update(bundleBuffer).digest("hex"),
    size: bundleStats.size,
  },
  runtime: {
    entryFile: "dist-electron/app-main.js",
    preloadFile: "dist-electron/preload.js",
    rendererDir: "react-ui/dist",
  },
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), "utf8");

console.log(`[hotupdate] Manifest generado en ${outputPath}`);
