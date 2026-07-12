import { useEffect, type MouseEvent } from "react";
import { FaDiscord } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useDiscordStore } from "@/application/store/useDiscordStore";
import type { DiscordFriend } from "@/infrastructure/api/discordApi";

const statusColor: Record<string, string> = {
  online: "bg-emerald-400",
  idle: "bg-amber-400",
  dnd: "bg-red-500",
  offline: "bg-white/30",
  invisible: "bg-white/30",
  unknown: "bg-sky-400/70",
};

function FriendAvatar({ friend }: { friend: DiscordFriend }) {
  const label = friend.globalName || friend.username;
  const dimmed = friend.status === "offline" || friend.status === "invisible";
  return (
    <div
      className={`relative size-[min(40px,3.8vh)] shrink-0 ${dimmed ? "opacity-55" : ""}`}
      title={`${label}${friend.activity ? ` · ${friend.activity}` : ""} · ${friend.status}`}
    >
      {friend.avatarUrl ? (
        <img
          src={friend.avatarUrl}
          alt={label}
          className="size-full rounded-full border border-white/20 object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center rounded-full border border-white/20 bg-[#5865F2]/40 text-[10px] font-bold text-white">
          {label.slice(0, 1).toUpperCase()}
        </div>
      )}
      <span
        className={`absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--surface-dashboard)] ${
          statusColor[friend.status] ?? statusColor.unknown
        }`}
      />
    </div>
  );
}

/**
 * Vertical rail: Discord connect button + friend avatars.
 */
export function HeroSocialRail() {
  const { t } = useTranslation();
  const link = useDiscordStore((s) => s.link);
  const friends = useDiscordStore((s) => s.friends);
  const onlineCount = useDiscordStore((s) => s.onlineCount);
  const note = useDiscordStore((s) => s.note);
  const isLinking = useDiscordStore((s) => s.isLinking);
  const isLoading = useDiscordStore((s) => s.isLoading);
  const hydrate = useDiscordStore((s) => s.hydrate);
  const connect = useDiscordStore((s) => s.connect);
  const refreshFriends = useDiscordStore((s) => s.refreshFriends);
  const disconnect = useDiscordStore((s) => s.disconnect);

  useEffect(() => {
    void hydrate();
    const timer = window.setInterval(() => {
      void refreshFriends();
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [hydrate, refreshFriends]);

  // Prefer truly online first, then the rest (so the rail never looks empty if we have contacts).
  const visibleFriends = [...friends]
    .sort((a, b) => Number(b.isOnline) - Number(a.isOnline))
    .slice(0, 8);

  const handleDiscordClick = () => {
    if (isLinking) return;
    if (link) {
      void refreshFriends();
      return;
    }
    void connect();
  };

  const handleContextMenu = (event: MouseEvent) => {
    if (!link) return;
    event.preventDefault();
    if (window.confirm(t("discord.unlink_confirm"))) {
      void disconnect();
    }
  };

  const title = link
    ? `${t("discord.connected")}: ${link.globalName || link.username}` +
      (friends.length ? ` · ${friends.length} contactos` : "") +
      (note ? ` — ${note}` : "")
    : t("discord.connect");

  return (
    <div className="hidden shrink-0 flex-col items-center justify-center gap-3 xl:flex">
      <button
        type="button"
        onClick={handleDiscordClick}
        onContextMenu={handleContextMenu}
        disabled={isLinking}
        aria-label={link ? t("discord.connected") : t("discord.connect")}
        title={title}
        className={`relative flex size-[min(48px,4.5vh)] cursor-pointer items-center justify-center rounded-full border text-white shadow-[0_8px_24px_rgba(88,101,242,0.35)] transition-all hover:scale-105 disabled:cursor-wait disabled:opacity-70 ${
          link
            ? "border-emerald-400/50 bg-[#5865F2] hover:border-emerald-300"
            : "border-white/25 bg-[#5865F2]/90 hover:bg-[#5865F2] hover:border-white/40"
        }`}
      >
        <FaDiscord className={`text-[min(22px,2.2vh)] ${isLinking || isLoading ? "animate-pulse" : ""}`} />
        {link ? (
          <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[var(--surface-dashboard)] bg-emerald-400" />
        ) : null}
        {link && friends.length > 0 ? (
          <span className="absolute -top-1 -right-1 min-w-[16px] rounded-full bg-white px-1 text-center text-[9px] font-black text-[#5865F2]">
            {onlineCount > 0 ? onlineCount : friends.length}
          </span>
        ) : null}
      </button>

      {link && visibleFriends.length > 0 ? (
        <div className="flex flex-col items-center gap-2">
          {visibleFriends.map((friend) => (
            <FriendAvatar key={friend.id} friend={friend} />
          ))}
        </div>
      ) : null}

      {link && !isLoading && visibleFriends.length === 0 ? (
        <span
          className="max-w-[4.5rem] text-center text-[9px] font-medium leading-tight text-white/40"
          title={note ?? undefined}
        >
          {t("discord.no_online")}
        </span>
      ) : null}
    </div>
  );
}
