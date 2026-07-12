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
        onClick={() => setShowNotifications(!showNotifications)}
        aria-label={t("topbar.notifications")}
        className={`w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--surface-elevated)] border transition-colors relative cursor-pointer
          ${showNotifications
            ? 'border-primary/50 text-white'
            : 'border-white/10 text-white/60 hover:text-white hover:border-primary/50'}`}
      >
        <FiBell />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-[var(--surface-overlay)] border border-white/10 rounded-xl z-50 overflow-hidden flex flex-col animate-[fade-in_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]">
          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">{t("topbar.notifications")}</h3>
            <div className="flex gap-2">
              <button onClick={markAllAsRead} className="text-white/40 hover:text-primary transition-colors" aria-label={t("topbar.mark_all_read")}>
                <FiCheck />
              </button>
              <button onClick={clearAll} className="text-white/40 hover:text-red-500 transition-colors" aria-label={t("topbar.clear_all")}>
                <FiTrash2 />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-white/40 text-xs">
                {t("topbar.no_notifications")}
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-4 border-b border-white/5 flex gap-3 cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                >
                  <div className="shrink-0 mt-1">
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`text-sm truncate ${!notif.read ? 'font-bold text-white' : 'text-white/80'}`}>
                        {notif.title}
                      </h4>
                    </div>
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[10px] text-white/30 block mt-2 font-mono">
                      {timeAgo(notif.timestamp, (key, opts) => String(t(key, opts)))}
                    </span>
                  </div>
                  {!notif.read && (
                    <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
