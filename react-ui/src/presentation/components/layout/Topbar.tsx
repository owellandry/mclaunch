import { useState, useRef, useEffect } from "react";
import { FiSearch, FiBell, FiCheck, FiTrash2, FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";
import { useAppStore } from "../../../application/store/useAppStore";
import { useNotificationStore } from "../../../application/store/useNotificationStore";
import { useTranslation } from "react-i18next";

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success': return <FiCheckCircle className="text-primary" />;
    case 'warning': return <FiAlertTriangle className="text-yellow-500" />;
    case 'error': return <FiXCircle className="text-red-500" />;
    default: return <FiInfo className="text-blue-500" />;
  }
}

function timeAgo(timestamp: number, t: any) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t("topbar.just_now");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("topbar.ago_m", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("topbar.ago_h", { count: hours });
  const days = Math.floor(hours / 24);
  return t("topbar.ago_d", { count: days });
}

export function Topbar() {
  const { profile, searchQuery, setSearchQuery } = useAppStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  const displayName = profile?.username || t("topbar.player");
  const count = unreadCount();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const minimize = () => window.api?.minimizeWindow?.();
  const maximize = () => window.api?.maximizeWindow?.();
  const close    = () => window.api?.closeWindow?.();

  return (
    <header
      className="h-14 flex items-center justify-between px-6 z-10 relative shrink-0 border-b border-black/5 select-none"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      {/* Title */}
      <div className="flex items-center gap-3" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        <h2 className="text-sm font-black tracking-[0.25em] text-textMain uppercase font-mono flex items-center gap-2">
          MINECRAFT
          <span className="bg-primary text-white px-2 py-0.5 text-[10px] mc-cutout-small shadow-[0_0_8px_var(--color-primary-shadow)]">
            LAUNCH
          </span>
        </h2>
      </div>

      <div className="flex items-center gap-4" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
        {/* Search */}
        <div className="flex items-center gap-3 bg-surfaceLight border border-black/5 px-4 py-2 w-64 focus-within:border-primary/50 transition-colors mc-cutout-small">
          <FiSearch className="text-textMuted" />
          <input
            className="bg-transparent border-none outline-none text-sm text-textMain w-full placeholder-textMuted font-mono"
            placeholder={t("topbar.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            title={t("topbar.notifications")}
            className={`w-10 h-10 bg-surfaceLight border flex items-center justify-center transition-colors mc-cutout-small relative
              ${showNotifications ? 'border-primary/50 text-textMain' : 'border-black/5 text-textMuted hover:text-textMain hover:border-primary/50'}`}
          >
            <FiBell />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center mc-cutout-small">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-surfaceLight border border-black/5 shadow-2xl mc-cutout-small z-50 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-black/5 bg-black/5">
                <h3 className="text-sm font-bold text-textMain uppercase tracking-widest">{t("topbar.notifications")}</h3>
                <div className="flex gap-2">
                  <button onClick={markAllAsRead} className="text-textMuted hover:text-primary transition-colors" title={t("topbar.mark_all_read")}>
                    <FiCheck />
                  </button>
                  <button onClick={clearAll} className="text-textMuted hover:text-red-500 transition-colors" title={t("topbar.clear_all")}>
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-textMuted text-xs">
                    {t("topbar.no_notifications")}
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      onClick={() => markAsRead(notif.id)}
                      className={`p-4 border-b border-black/5 flex gap-3 cursor-pointer hover:bg-black/5 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="shrink-0 mt-1">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={`text-sm truncate ${!notif.read ? 'font-bold text-textMain' : 'text-textMain'}`}>
                            {notif.title}
                          </h4>
                        </div>
                        <p className="text-xs text-textMuted line-clamp-2 leading-relaxed">
                          {notif.message}
                        </p>
                        <span className="text-[10px] text-textMuted/70 block mt-2 font-mono">
                          {timeAgo(notif.timestamp, t)}
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
        
        {/* Profile */}
        <div className="flex items-center gap-3 bg-surfaceLight border border-black/5 pl-4 pr-1 py-1 mc-cutout-small">
          <span className="text-sm font-bold text-textMain uppercase tracking-wider">{displayName}</span>
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-white font-black mc-cutout-small">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={minimize}
            title={t("topbar.minimize")}
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-black/8 transition-colors mc-cutout-small text-lg leading-none"
          >
            <span className="block w-3 h-[2px] bg-current mt-1" />
          </button>
          <button
            onClick={maximize}
            title={t("topbar.maximize")}
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-black/8 transition-colors mc-cutout-small"
          >
            <span className="block w-3 h-3 border-2 border-current" style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }} />
          </button>
          <button
            onClick={close}
            title={t("topbar.close")}
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-white hover:bg-red-500 transition-colors mc-cutout-small font-bold text-sm"
          >
            ✕
          </button>
        </div>
      </div>
    </header>
  );
}
