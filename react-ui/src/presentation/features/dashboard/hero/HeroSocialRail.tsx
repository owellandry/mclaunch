import { useEffect, type MouseEvent } from "react";
import { FaDiscord, FaCommentDots } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useDiscordStore } from "@/application/store/useDiscordStore";
import type { DiscordFriend } from "@/infrastructure/api/discordApi";
import { HoverLabel } from "@/presentation/design-system";

const statusColor: Record<string, string> = {
  online: "bg-emerald-400",
  idle: "bg-amber-400",
  dnd: "bg-red-500",
  offline: "bg-white/30",
  invisible: "bg-white/30",
  unknown: "bg-sky-400/70",
};

function FriendAvatar({
  friend,
  onInvite,
}: {
  friend: DiscordFriend;
  onInvite: (id: string) => void;
}) {
  const label = friend.globalName || friend.username;
  const dimmed = friend.status === "offline" || friend.status === "invisible";
  const hoverText = (
    <span className="flex flex-col gap-0.5 normal-case tracking-normal">
      <span className="text-[11px] font-black text-white">{label}</span>
      <span className="text-[9px] font-semibold text-white/55">
        {friend.activity ? `${friend.activity} · ` : ""}
        {friend.status}
      </span>
    </span>
  );

  return (
    <HoverLabel label={hoverText} side="left" labelClassName="max-w-[12rem] whitespace-normal normal-case tracking-normal">
      <button
        type="button"
        onClick={() => onInvite(friend.id)}
        aria-label={`${label}${friend.activity ? ` · ${friend.activity}` : ""} · ${friend.status}`}
        className={`group relative size-[min(40px,3.8vh)] shrink-0 cursor-pointer ${dimmed ? "opacity-55" : ""}`}
      >
        {friend.avatarUrl ? (
          <img
            src={friend.avatarUrl}
            alt=""
            aria-hidden
            className="size-full rounded-full border border-white/20 object-cover transition group-hover:border-primary"
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
        <span className="pointer-events-none absolute inset-0 hidden items-center justify-center rounded-full bg-black/50 text-white group-hover:flex">
          <FaCommentDots className="text-[11px]" />
        </span>
      </button>
    </HoverLabel>
  );
}

/**
 * Social widget rail — Discord friends (Social RPC prototype) + invite open.
 */
export function HeroSocialRail() {
  const { t } = useTranslation();
  const link = useDiscordStore((s) => s.link);
  const friends = useDiscordStore((s) => s.friends);
  const onlineCount = useDiscordStore((s) => s.onlineCount);
  const note = useDiscordStore((s) => s.note);
  const socialMode = useDiscordStore((s) => s.socialMode);
  const isLinking = useDiscordStore((s) => s.isLinking);
  const isLoading = useDiscordStore((s) => s.isLoading);
  const hydrate = useDiscordStore((s) => s.hydrate);
  const connect = useDiscordStore((s) => s.connect);
  const refreshFriends = useDiscordStore((s) => s.refreshFriends);
  const disconnect = useDiscordStore((s) => s.disconnect);
  const openFriend = useDiscordStore((s) => s.openFriend);

  useEffect(() => {
    void hydrate();
    const timer = window.setInterval(() => {
      void refreshFriends();
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [hydrate, refreshFriends]);

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

  const connectLabel = link
    ? t("discord.connected")
    : t("discord.connect");

  const connectHover = link ? (
    <span className="flex max-w-[14rem] flex-col gap-0.5 normal-case tracking-normal">
      <span className="text-[11px] font-black text-white">
        {link.globalName || link.username}
      </span>
      <span className="text-[9px] font-semibold text-white/55">
        {socialMode === "rpc" ? "Social RPC" : "Backend"}
        {friends.length ? ` · ${friends.length}` : ""}
      </span>
      {note ? <span className="text-[9px] font-medium text-white/40">{note}</span> : null}
    </span>
  ) : (
    t("discord.connect")
  );

  return (
    <div className="hidden shrink-0 flex-col items-center justify-center gap-3 xl:flex">
      <HoverLabel label={connectHover} side="left" labelClassName="whitespace-normal">
        <button
          type="button"
          onClick={handleDiscordClick}
          onContextMenu={handleContextMenu}
          disabled={isLinking}
          aria-label={connectLabel}
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
      </HoverLabel>

      {link && visibleFriends.length > 0 ? (
        <div className="flex flex-col items-center gap-2">
          {visibleFriends.map((friend) => (
            <FriendAvatar
              key={friend.id}
              friend={friend}
              onInvite={(id) => {
                void openFriend(id);
              }}
            />
          ))}
        </div>
      ) : null}

      {link && !isLoading && visibleFriends.length === 0 ? (
        <HoverLabel label={note ?? t("discord.no_online")} side="left" disabled={!note}>
          <span className="max-w-[4.5rem] text-center text-[9px] font-medium leading-tight text-white/40">
            {t("discord.no_online")}
          </span>
        </HoverLabel>
      ) : null}
    </div>
  );
}
