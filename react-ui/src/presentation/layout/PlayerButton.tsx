/**
 * @file PlayerButton.tsx
 * @description Botón de perfil de jugador con nombre y avatar.
 *
 * Patrón: Atomic Design — Atom
 */
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/application/store/useAppStore";
import { MinecraftAvatar } from "@/presentation/components/minecraft/MinecraftAvatar";
import { startViewTransition, PLAYER_AVATAR_TRANSITION_NAME } from "@/presentation/lib/viewTransition";
import { useTranslation } from "react-i18next";

export function PlayerButton() {
  const profile = useAppStore((state) => state.profile);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const displayName = profile?.username || t("topbar.player");

  const openSkinStudio = () => {
    startViewTransition(() => navigate("/profile"));
  };

  return (
    <button
      type="button"
      onClick={openSkinStudio}
      aria-label={t("topbar.profile")}
      className="flex items-center gap-0 cursor-pointer [view-transition-name:player-profile-chip]"
    >
      <span className="bg-[var(--surface-elevated)] border border-white/10 border-r-0 rounded-l-lg px-3 py-1 text-sm font-medium text-white uppercase tracking-wider">
        {displayName}
      </span>
      <MinecraftAvatar
        username={displayName}
        uuid={profile?.uuid}
        skinUrl={profile?.skinUrl}
        size={32}
        transitionName={PLAYER_AVATAR_TRANSITION_NAME}
        className="rounded-r-lg! border-l-0!"
      />
    </button>
  );
}
