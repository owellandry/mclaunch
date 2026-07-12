import { useEffect, useState } from "react";

export type TextureInfo = {
  width: number;
  height: number;
};

const textureInfoCache = new Map<string, TextureInfo | null>();

export function useTextureInfo(url?: string | null, defaultWidth = 64, defaultHeight = 64): TextureInfo | null {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!url) return;
    if (textureInfoCache.has(url)) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      textureInfoCache.set(url, { width: img.naturalWidth || defaultWidth, height: img.naturalHeight || defaultHeight });
      if (!cancelled) forceUpdate(n => n + 1);
    };
    img.onerror = () => {
      textureInfoCache.set(url, null);
      if (!cancelled) forceUpdate(n => n + 1);
    };
    img.decoding = "async";
    img.src = url;
    return () => { cancelled = true; };
  }, [url, defaultWidth, defaultHeight]);

  if (!url) return null;
  const cached = textureInfoCache.get(url);
  return cached !== undefined ? cached : null;
}
