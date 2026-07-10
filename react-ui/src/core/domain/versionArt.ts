/**
 * @file versionArt.ts
 * @description Mapeo de versiones de Minecraft a sus imágenes oficiales del Minecraft Wiki.
 * Al seleccionar una versión en el Dashboard, el hero muestra el artwork oficial.
 */

const VERSION_ART_MAP: Record<string, string> = {
  "26.2":   "https://minecraft.wiki/images/26.2_banner.jpg",
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

/**
 * Retorna la URL del artwork oficial para una versión específica.
 * Si la versión no tiene artwork mapeado, retorna null.
 */
export function getVersionArt(versionId: string): string | null {
  if (!versionId) return null;

  // Busca exacta primero
  if (VERSION_ART_MAP[versionId]) return VERSION_ART_MAP[versionId];

  // Para versiones sin banner específico (e.g. 1.21.1, 1.21.2, 1.20.1, 1.20.2, 1.19.1, 1.19.2, 1.19.3, 1.19.4)
  // intenta con la versión mayor (e.g. 1.21, 1.20, 1.19)
  const majorVersion = versionId
    .split(".")
    .slice(0, 2)
    .join(".");

  if (majorVersion !== versionId && VERSION_ART_MAP[majorVersion]) {
    return VERSION_ART_MAP[majorVersion];
  }

  return null;
}
