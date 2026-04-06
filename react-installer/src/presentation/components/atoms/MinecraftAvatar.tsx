import { memo, useEffect, useMemo, useState } from "react";

type MinecraftAvatarProps = {
  username: string;
  uuid?: string;
  skinUrl?: string | null;
  size?: number;
  className?: string;
  transitionName?: string;
};

const avatarAvailabilityCache = new Map<string, boolean>();

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

export const MinecraftAvatar = memo(function MinecraftAvatar({
  username,
  uuid,
  skinUrl,
  size = 32,
  className = "",
  transitionName,
}: MinecraftAvatarProps) {
  const avatarUrl = useMemo(() => getAvatarUrl(uuid, skinUrl, size), [size, skinUrl, uuid]);
  const [hasValidSkin, setHasValidSkin] = useState(() =>
    avatarUrl ? avatarAvailabilityCache.get(avatarUrl) ?? true : false
  );
  const transitionStyle = transitionName ? { viewTransitionName: transitionName } : undefined;

  useEffect(() => {
    if (!avatarUrl) {
      setHasValidSkin(false);
      return;
    }

    const cachedAvailability = avatarAvailabilityCache.get(avatarUrl);
    if (cachedAvailability !== undefined) {
      setHasValidSkin(cachedAvailability);
      return;
    }

    let isCancelled = false;
    const image = new Image();

    image.onload = () => {
      avatarAvailabilityCache.set(avatarUrl, true);
      if (!isCancelled) {
        setHasValidSkin(true);
      }
    };

    image.onerror = () => {
      avatarAvailabilityCache.set(avatarUrl, false);
      if (!isCancelled) {
        setHasValidSkin(false);
      }
    };

    image.decoding = "async";
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
      loading="lazy"
      decoding="async"
      onError={() => {
        avatarAvailabilityCache.set(avatarUrl, false);
        setHasValidSkin(false);
      }}
    />
  );
});
