import { useEffect, useState } from "react";

export type TextureInfo = {
  width: number;
  height: number;
};

type CacheEntry = {
  info: TextureInfo | null;
  status: "loading" | "ready" | "error";
};

const textureInfoCache = new Map<string, CacheEntry>();

/**
 * Resolves skin/cape PNG dimensions. While loading, returns provisional defaults
 * so the 3D figure can mount immediately instead of flashing an empty state.
 */
export function useTextureInfo(
  url?: string | null,
  defaultWidth = 64,
  defaultHeight = 64,
): TextureInfo | null {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!url) return;

    const existing = textureInfoCache.get(url);
    if (existing?.status === "ready" || existing?.status === "error") return;
    if (existing?.status === "loading") return;

    textureInfoCache.set(url, {
      status: "loading",
      info: { width: defaultWidth, height: defaultHeight },
    });
    forceUpdate((n) => n + 1);

    let cancelled = false;
    const img = new Image();
    // Don't set crossOrigin — Mojang CDNs often omit CORS; we only need naturalWidth/Height.
    img.onload = () => {
      textureInfoCache.set(url, {
        status: "ready",
        info: {
          width: img.naturalWidth || defaultWidth,
          height: img.naturalHeight || defaultHeight,
        },
      });
      if (!cancelled) forceUpdate((n) => n + 1);
    };
    img.onerror = () => {
      textureInfoCache.set(url, { status: "error", info: null });
      if (!cancelled) forceUpdate((n) => n + 1);
    };
    img.decoding = "async";
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url, defaultWidth, defaultHeight]);

  if (!url) return null;

  const cached = textureInfoCache.get(url);
  if (!cached) {
    return { width: defaultWidth, height: defaultHeight };
  }
  if (cached.status === "error") return null;
  return cached.info ?? { width: defaultWidth, height: defaultHeight };
}
