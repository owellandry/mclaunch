/**
 * @file download-version-art.mjs
 * @description Downloads official Minecraft update key art and materializes
 * one local image per Mojang *release* version under public/version-art/.
 *
 * Usage:
 *   node scripts/download-version-art.mjs
 *   node scripts/download-version-art.mjs --force
 *
 * Flow:
 *  1. Download unique key-art assets (one per named update / game drop)
 *  2. Fetch every release from Mojang version_manifest_v2
 *  3. Map each release → art key (highest key ≤ version)
 *  4. Create a hardlink (or copy) named after the version id
 *  5. Write manifests used by the UI
 */
import {
  writeFileSync,
  readFileSync,
  existsSync,
  readdirSync,
  unlinkSync,
  copyFileSync,
  linkSync,
  rmSync,
} from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "version-art");
const SHARED_DIR = join(OUT_DIR, "_shared");
const PUBLIC_MANIFEST = join(OUT_DIR, "manifest.json");
const TS_MANIFEST = join(
  __dirname,
  "..",
  "src",
  "core",
  "domain",
  "versionArt.manifest.json",
);
const COVERAGE_REPORT = join(OUT_DIR, "coverage.json");
const FORCE = process.argv.includes("--force");

const USER_AGENT =
  "SlaumcherLauncher/1.0 (version-art downloader; https://github.com/local/mclaunch)";

const MOJANG_MANIFEST =
  "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json";

/**
 * Art key → wiki File title (no "File:" prefix).
 * Key = first version that uses this artwork. Newer patches inherit until the next key.
 * Must cover every Mojang release family from 1.0 through current.
 */
const ART_SOURCES = {
  // Classic / early full releases
  "1.0": "Adventure_Update_Cover_light.png", // Adventure Update → 1.0
  "1.2": "MC_key_art.png", // classic landscape key art (1.2–1.5)
  "1.6": "Horse_Update_Wallpaper.jpg", // Horse Update
  "1.8": "The_Bountiful_Update.png", // Bountiful Update
  "1.9": "Combat_Update.png",
  "1.10": "Frostburn_Update.png",
  "1.11": "ExplorationUpdateFull.jpg",
  "1.12": "World_of_Color_Update.png",
  "1.13": "Update_Aquatic.png",
  "1.14": "Village_&_Pillage_banner.png",
  "1.15": "Buzzy_Bees.png",
  "1.16": "NetherUpdateArtwork.png",
  "1.17": "Caves_&_Cliffs_cover_art.png",
  "1.18": "Caves_&_Cliffs_Part_II.png",
  "1.19": "Wild_key_art.png",
  "1.20": "Trails_&_Tales_key_art.png",
  // 1.21 game drops
  "1.21": "Tricky_Trials_Key_Art.png",
  "1.21.2": "Bundles_of_Bravery_Key_Art.png",
  "1.21.4": "The_Garden_Awakens_Key_Art.png",
  "1.21.5": "Spring_to_Life_Key_Art.jpg",
  "1.21.6": "Chase_the_Skies_Key_Art.jpg",
  "1.21.9": "The_Copper_Age_Key_Art.png",
  "1.21.11": "Mounts_of_Mayhem_Key_Art.png",
  // Year-based versioning
  "26.1": "Tiny_Takeover_Key_Art.png",
  "26.2": "Chaos_Cubed_Key_Art.png",
};

function parseVersionParts(version) {
  const core = String(version).split("-")[0]?.split("+")[0] ?? version;
  return core.split(".").map((part) => {
    const n = parseInt(part, 10);
    return Number.isFinite(n) ? n : 0;
  });
}

function compareVersions(a, b) {
  const pa = parseVersionParts(a);
  const pb = parseVersionParts(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function resolveArtKey(versionId, artKeys) {
  const keys = [...artKeys].sort(compareVersions);
  let best = null;
  for (const key of keys) {
    if (compareVersions(key, versionId) <= 0) best = key;
  }
  return best;
}

function detectFormat(buf) {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return "png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "jpg";
  }
  if (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  ) {
    return "webp";
  }
  return null;
}

function readDimensions(buf, format) {
  try {
    if (format === "png" && buf.length >= 24) {
      return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (format === "jpg") {
      for (let i = 0; i < Math.min(buf.length, 512_000) - 9; i++) {
        if (buf[i] === 0xff && (buf[i + 1] === 0xc0 || buf[i + 1] === 0xc2)) {
          return {
            width: buf.readUInt16BE(i + 7),
            height: buf.readUInt16BE(i + 5),
          };
        }
      }
    }
    if (format === "webp" && buf.length >= 30) {
      if (buf.toString("ascii", 12, 16) === "VP8X") {
        return {
          width: 1 + buf[24] + (buf[25] << 8) + (buf[26] << 16),
          height: 1 + buf[27] + (buf[28] << 8) + (buf[29] << 16),
        };
      }
      if (buf.toString("ascii", 12, 16) === "VP8 ") {
        return {
          width: buf.readUInt16LE(26) & 0x3fff,
          height: buf.readUInt16LE(28) & 0x3fff,
        };
      }
    }
  } catch {
    /* ignore */
  }
  return null;
}

async function resolveImageUrl(wikiFileTitle) {
  const title = wikiFileTitle.startsWith("File:")
    ? wikiFileTitle
    : `File:${wikiFileTitle}`;
  const api =
    "https://minecraft.wiki/api.php?action=query&titles=" +
    encodeURIComponent(title) +
    "&prop=imageinfo&iiprop=url|size|mime&format=json";

  const res = await fetch(api, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`API HTTP ${res.status}`);
  const data = await res.json();
  const page = Object.values(data.query?.pages || {})[0];
  const info = page?.imageinfo?.[0];
  if (!info?.url) throw new Error(`No imageinfo for ${title}`);
  return {
    url: info.url,
    width: info.width,
    height: info.height,
    size: info.size,
  };
}

async function downloadBinary(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "image/png,image/jpeg,image/webp,image/*;q=0.8,*/*;q=0.5",
      Referer: "https://minecraft.wiki/",
    },
    signal: AbortSignal.timeout(120000),
  });
  const buf = Buffer.from(await res.arrayBuffer());
  const ct = res.headers.get("content-type") || "";
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  if (ct.includes("text/html") || buf.length < 8_000) {
    throw new Error(`Unexpected payload (${ct}, ${buf.length} bytes)`);
  }
  return buf;
}

async function fetchReleaseVersions() {
  const res = await fetch(MOJANG_MANIFEST, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Mojang manifest HTTP ${res.status}`);
  const data = await res.json();
  return data.versions
    .filter((v) => v.type === "release")
    .map((v) => v.id);
}

/** Link dest → src (hardlink), fall back to copy. */
function linkOrCopy(src, dest) {
  if (existsSync(dest)) {
    try {
      unlinkSync(dest);
    } catch {
      /* ignore */
    }
  }
  try {
    linkSync(src, dest);
    return "link";
  } catch {
    copyFileSync(src, dest);
    return "copy";
  }
}

function cleanOutputExcept(keepRelative) {
  const keep = new Set(keepRelative);
  // wipe root version files + old layout leftovers, keep _shared + manifests
  if (!existsSync(OUT_DIR)) return;
  for (const name of readdirSync(OUT_DIR)) {
    if (name === "_shared") continue;
    if (name === "manifest.json" || name === "coverage.json" || name === ".gitkeep") {
      continue;
    }
    if (!keep.has(name)) {
      const p = join(OUT_DIR, name);
      try {
        rmSync(p, { recursive: true, force: true });
        console.log(`  · removed stale ${name}`);
      } catch (err) {
        console.warn(`  · could not remove ${name}: ${err.message}`);
      }
    }
  }
}

async function run() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(SHARED_DIR, { recursive: true });

  /** @type {Record<string, string>} artKey → shared relative path */
  const sharedFiles = {};
  /** content hash → shared path (dedupe identical wiki files) */
  const hashToShared = new Map();
  let downloaded = 0;
  const sourceEntries = Object.entries(ART_SOURCES);

  console.log(`1/3  Unique key arts (${sourceEntries.length}) → ${SHARED_DIR}`);
  console.log(FORCE ? "     force mode\n" : "     skip existing\n");

  for (const [artKey, wikiFile] of sourceEntries) {
    // Prefer any existing shared file for this exact art key (not prefix!)
    const existing = existsSync(SHARED_DIR)
      ? readdirSync(SHARED_DIR).find((f) => {
          const base = f.includes(".") ? f.slice(0, f.lastIndexOf(".")) : f;
          return base === artKey;
        })
      : null;

    if (!FORCE && existing) {
      const full = join(SHARED_DIR, existing);
      sharedFiles[artKey] = existing;
      const buf = readFileSync(full);
      const format = detectFormat(buf);
      const dim = format ? readDimensions(buf, format) : null;
      const hash = createHash("sha1").update(buf).digest("hex").slice(0, 12);
      hashToShared.set(hash, existing);
      console.log(
        `  ✔ ${artKey} → _shared/${existing}` +
          (dim ? ` (${dim.width}x${dim.height})` : ""),
      );
      downloaded++;
      continue;
    }

    try {
      process.stdout.write(`  … ${artKey} resolving… `);
      const meta = await resolveImageUrl(wikiFile);
      process.stdout.write(`${meta.width}x${meta.height}… `);
      const buf = await downloadBinary(meta.url);
      const format = detectFormat(buf);
      if (!format) {
        throw new Error(`Unknown format ${buf.slice(0, 12).toString("hex")}`);
      }
      const hash = createHash("sha1").update(buf).digest("hex").slice(0, 12);

      let filename;
      if (hashToShared.has(hash)) {
        // Reuse identical bytes (e.g. same classic art for multiple keys)
        filename = hashToShared.get(hash);
        console.log(`dedupe → ${filename}`);
      } else {
        filename = `${artKey}.${format}`;
        writeFileSync(join(SHARED_DIR, filename), buf);
        hashToShared.set(hash, filename);
        const dim = readDimensions(buf, format);
        console.log(
          `ok ${filename}` +
            (dim ? ` ${dim.width}x${dim.height}` : "") +
            ` ${Math.round(buf.length / 1024)}KB`,
        );
      }
      sharedFiles[artKey] = filename;
      downloaded++;
    } catch (err) {
      console.log(`FAIL: ${err.message}`);
    }
  }

  const artKeys = Object.keys(sharedFiles);
  if (artKeys.length === 0) {
    throw new Error("No art assets downloaded — aborting.");
  }

  console.log(`\n2/3  Fetching Mojang release list…`);
  const releases = await fetchReleaseVersions();
  console.log(`     ${releases.length} release versions\n`);

  console.log(`3/3  Materializing one image per release…`);
  /** @type {Record<string, string>} versionId → public filename */
  const versionManifest = {};
  /** @type {Record<string, string>} versionId → art key used */
  const coverage = {};
  const missing = [];
  const keepRoot = new Set();
  let linked = 0;

  for (const versionId of releases) {
    const artKey = resolveArtKey(versionId, artKeys);
    if (!artKey || !sharedFiles[artKey]) {
      missing.push(versionId);
      continue;
    }

    const sharedName = sharedFiles[artKey];
    const ext = extname(sharedName); // .webp / .jpg / .png
    const publicName = `${versionId}${ext}`;
    const src = join(SHARED_DIR, sharedName);
    const dest = join(OUT_DIR, publicName);

    if (!FORCE && existsSync(dest)) {
      // already present
    } else {
      linkOrCopy(src, dest);
    }

    versionManifest[versionId] = publicName;
    coverage[versionId] = artKey;
    keepRoot.add(publicName);
    linked++;
  }

  // Also keep art-key named aliases for keys that equal a real version
  // (optional) — root is per-version only for clear 1:1 listing.

  const body = JSON.stringify(versionManifest, null, 2) + "\n";
  writeFileSync(PUBLIC_MANIFEST, body);
  writeFileSync(TS_MANIFEST, body);
  writeFileSync(
    COVERAGE_REPORT,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        releaseCount: releases.length,
        coveredCount: linked,
        missingCount: missing.length,
        missing,
        artKeys: sharedFiles,
        versionToArtKey: coverage,
      },
      null,
      2,
    ) + "\n",
  );

  cleanOutputExcept([...keepRoot, "manifest.json", "coverage.json"]);

  // Remove unused shared files
  if (existsSync(SHARED_DIR)) {
    const usedShared = new Set(Object.values(sharedFiles));
    for (const name of readdirSync(SHARED_DIR)) {
      if (!usedShared.has(name)) {
        unlinkSync(join(SHARED_DIR, name));
        console.log(`  · removed unused shared ${name}`);
      }
    }
  }

  console.log(`\nDone.`);
  console.log(`  Shared assets : ${artKeys.length} (${downloaded} ready)`);
  console.log(`  Releases      : ${releases.length}`);
  console.log(`  Images linked : ${linked}`);
  console.log(`  Missing       : ${missing.length}${missing.length ? " → " + missing.join(", ") : ""}`);
  console.log(`  Manifest      : ${TS_MANIFEST}`);

  if (missing.length > 0) {
    console.error("\nERROR: some releases have no art key ≤ version. Extend ART_SOURCES.");
    process.exit(1);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
