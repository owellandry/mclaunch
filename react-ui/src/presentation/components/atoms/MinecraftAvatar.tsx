/**
 * @file MinecraftAvatar.tsx
 * @description Componente atómico MinecraftAvatar. Muestra el rostro 2D de una skin de Minecraft basado en el nombre de usuario.
 * 
 * Patrón: Atomic Design
 */
import { useEffect, useState } from "react";

type MinecraftAvatarProps = {
  username: string;
  uuid?: string;
  skinUrl?: string | null;
  size?: number;
  className?: string;
  transitionName?: string;
};

function getInitial(username: string): string {
  return username.trim().slice(0, 1).toUpperCase() || "?";
}

function normalizeSkinUrl(skinUrl?: string | null): string | null {
  if (!skinUrl) {
    return null;
  }

  return skinUrl.replace(/^http:\/\//i, "https://");
}

function getAvatarUrl(uuid?: string, skinUrl?: string | null, size = 32): string | null {
  if (uuid) {
    return `https://mc-heads.net/avatar/${uuid}/${size * 2}`;
  }

  return normalizeSkinUrl(skinUrl);
}

export function MinecraftAvatar({
  username,
  uuid,
  skinUrl,
  size = 32,
  className = "",
  transitionName,
}: MinecraftAvatarProps) {
  const avatarUrl = getAvatarUrl(uuid, skinUrl, size);
  const [hasValidSkin, setHasValidSkin] = useState(Boolean(avatarUrl));
  const transitionStyle = transitionName ? { viewTransitionName: transitionName } : undefined;

  useEffect(() => {
    if (!avatarUrl) {
      setHasValidSkin(false);
      return;
    }

    let isCancelled = false;
    const image = new Image();

    image.onload = () => {
      if (!isCancelled) {
        setHasValidSkin(true);
      }
    };

    image.onerror = () => {
      if (!isCancelled) {
        setHasValidSkin(false);
      }
    };

    image.src = avatarUrl;

    return () => {
      isCancelled = true;
    };
  }, [avatarUrl]);

  if (!hasValidSkin || !avatarUrl) {
    return (
      <div
        className={`bg-primary flex items-center justify-center text-white font-black mc-cutout-small ${className}`}
        style={{ width: size, height: size, ...transitionStyle }}
      >
        {getInitial(username)}
      </div>
    );
  }

  return (
    <img
      src={avatarUrl}
      alt={`Avatar de ${username}`}
      title={username}
      className={`bg-surfaceLight mc-cutout-small ${className}`}
      style={{ width: size, height: size, imageRendering: "pixelated", ...transitionStyle }}
      onError={() => setHasValidSkin(false)}
    />
  );
}
