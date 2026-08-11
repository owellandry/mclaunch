/**
 * @file NotificationBell.tsx
 * @description Botón de campana con contador y dropdown de notificaciones.
 *
 * Patrón: Atomic Design — Atom
 */
import { useState, useRef, useEffect } from "react";
import { FiBell, FiCheck, FiTrash2 } from "react-icons/fi";
import { useNotificationStore } from "@/application/store/useNotificationStore";
import { useTranslation } from "react-i18next";
import { getNotificationIcon, timeAgo } from "@/presentation/lib/notificationUtils";

export function NotificationBell() {
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const clearAll = useNotificationStore((state) => state.clearAll);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={notifRef}>
      <button
        type="button"
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label={t("topbar.notifications")}
        aria-expanded={showNotifications}
        className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border bg-[var(--surface-elevated)] transition-colors
          ${
            showNotifications
              ? "border-primary/50 text-white"
              : "border-white/10 text-white/60 hover:border-primary/50 hover:text-white"
          }`}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-12 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-white/[0.1] bg-[var(--surface-elevated)]/95 shadow-[0_24px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl animate-[fade-in_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
            <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-white">
              {t("topbar.notifications")}
            </h3>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-primary"
                aria-label={t("topbar.mark_all_read")}
              >
                <FiCheck />
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="flex size-8 cursor-pointer items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-red-400"
                aria-label={t("topbar.clear_all")}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center text-xs text-white/40">
                {t("topbar.no_notifications")}
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  type="button"
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`flex w-full cursor-pointer gap-3 border-b border-white/[0.05] p-4 text-left transition-colors hover:bg-white/[0.04] ${
                    !notif.read ? "bg-primary/[0.06]" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{getNotificationIcon(notif.type)}</div>
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`truncate text-sm ${
                        !notif.read ? "font-bold text-white" : "font-medium text-white/75"
                      }`}
                    >
                      {notif.title}
                    </h4>
                    <p className="mt-1 text-xs leading-relaxed text-white/45 line-clamp-2">
                      {notif.message}
                    </p>
                    <span className="mt-2 block font-mono text-[10px] text-white/30">
                      {timeAgo(notif.timestamp, (key, opts) => String(t(key, opts)))}
                    </span>
                  </div>
                  {!notif.read ? (
                    <div className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
