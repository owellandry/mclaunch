/**
 * @file download-version-art.mjs
 * @description Descarga los artworks de cada versión de Minecraft a public/version-art/
 *
 * Uso: node scripts/download-version-art.mjs
 */
import { writeFileSync, existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const VERSION_ART_MAP = {
  "26.2":   "https://www.minecraft.net/content/dam/minecraftnet/games/minecraft/key-art/SPGD-26_Video-Banner-A_Trailer-Thumbnail_1920x1080.jpg",
  "26.1":   "https://minecraft.wiki/images/26.1_banner.jpg",
  "1.21.5": "https://minecraft.wiki/images/1.21.5_banner.jpg",
  "1.21.4": "https://minecraft.wiki/images/1.21.4_banner.jpg",
  "1.21":   "https://minecraft.wiki/images/1.21_banner.jpg",
  "1.20":   "https://minecraft.wiki/images/1.20_banner.jpg",
  "1.19":   "https://minecraft.wiki/images/1.19_banner.jpg",
  "1.18":   "https://minecraft.wiki/images/Caves%26Cliffs2Java.jpg",
  "1.17":   "https://minecraft.wiki/images/Java_Edition_1.17.jpg",
  "1.16":   "https://minecraft.wiki/images/Java_Edition_1.16.png",
};

function getExt(url) {
  const clean = url.split("?")[0].split("#")[0];
  const e = clean.split(".").pop()?.toLowerCase() || "jpg";
  return e === "jpeg" ? "jpg" : e;
}

const OUT_DIR = join(__dirname, "..", "public", "version-art");

async function run() {
  await mkdir(OUT_DIR, { recursive: true });

  let ok = 0;
  const entries = Object.entries(VERSION_ART_MAP);

  for (const [version, url] of entries) {
    const ext = getExt(url);
    const filename = `${version}${ext === "jpg" ? ".jpg" : `.${ext}`}`;
    const filePath = join(OUT_DIR, filename);

    if (existsSync(filePath)) {
      console.log(`  ✔ ${filename} ya existe`);
      ok++;
      continue;
    }

    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(filePath, buf);
      console.log(`  ✓ ${filename} descargado (${buf.length} bytes)`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${filename} → ${err.message}`);
    }
  }

  console.log(`\nHecho: ${ok}/${entries.length} imágenes.`);
}

run().catch(console.error);
