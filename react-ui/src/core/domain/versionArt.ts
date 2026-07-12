/**
 * @file versionArt.ts
 * @description Mapeo de versiones de Minecraft a sus artworks locales.
 * Las imágenes se descargan con: node scripts/download-version-art.mjs
 * y se sirven desde /version-art/ (carpeta public/).
 */

const VERSION_ART_MAP: Record<string, string> = {
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

function getFileExtension(url: string): string {
  const clean = url.split("?")[0].split("#")[0];
  const ext = clean.split(".").pop()?.toLowerCase() || "jpg";
  return ext === "jpeg" ? "jpg" : ext;
}

function findRemoteUrl(versionId: string): { key: string; url: string } | null {
  if (VERSION_ART_MAP[versionId]) {
    return { key: versionId, url: VERSION_ART_MAP[versionId] };
  }
  const major = versionId.split(".").slice(0, 2).join(".");
  if (major !== versionId && VERSION_ART_MAP[major]) {
    return { key: major, url: VERSION_ART_MAP[major] };
  }
  return null;
}

/**
 * Retorna la ruta local de la imagen (en /version-art/) para una versión.
 * Si la versión no tiene artwork mapeado, retorna null.
 */
export function getVersionArt(versionId: string): string | null {
  if (!versionId) return null;
  const found = findRemoteUrl(versionId);
  if (!found) return null;

  const ext = getFileExtension(found.url);
  return `/version-art/${found.key}.${ext}`;
}

/**
 * Retorna el mapa de URLs remotas para el script de descarga.
 * NO usar en componentes — solo para node scripts/download-version-art.mjs
 */
export function getDownloadUrls(): Record<string, string> {
  return { ...VERSION_ART_MAP };
}
