import { useState, useRef, useEffect } from "react";
import { FiSearch, FiBell, FiCheck, FiTrash2, FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";
import { useAppStore } from "../../../application/store/useAppStore";
import { useNotificationStore } from "../../../application/store/useNotificationStore";

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success': return <FiCheckCircle className="text-primary" />;
    case 'warning': return <FiAlertTriangle className="text-yellow-500" />;
    case 'error': return <FiXCircle className="text-red-500" />;
    default: return <FiInfo className="text-blue-500" />;
  }
}

function timeAgo(timestamp: number) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "hace un momento";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function Topbar() {
  const { profile, searchQuery, setSearchQuery } = useAppStore();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotificationStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  
  const displayName = profile?.username || "Player";
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

  return (
    <header className="h-20 flex items-center justify-between px-8 z-10 relative shrink-0 border-b border-black/5">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-black tracking-widest text-textMain uppercase flex items-center gap-2 font-mono">
          MINECRAFT <span className="bg-primary text-white px-2 py-0.5 text-sm mc-cutout-small">HUB</span>
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="flex items-center gap-3 bg-surfaceLight border border-black/5 px-4 py-2 w-64 focus-within:border-primary/50 transition-colors mc-cutout-small">
          <FiSearch className="text-textMuted" />
          <input
            className="bg-transparent border-none outline-none text-sm text-textMain w-full placeholder-textMuted font-mono"
            placeholder="Buscar..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
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
                <h3 className="text-sm font-bold text-textMain uppercase tracking-widest">Notificaciones</h3>
                <div className="flex gap-2">
                  <button onClick={markAllAsRead} className="text-textMuted hover:text-primary transition-colors" title="Marcar todas como leídas">
                    <FiCheck />
                  </button>
                  <button onClick={clearAll} className="text-textMuted hover:text-red-500 transition-colors" title="Limpiar todas">
                    <FiTrash2 />
                  </button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-textMuted text-xs">
                    No tienes notificaciones
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
                          {timeAgo(notif.timestamp)}
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
      </div>
    </header>
  );
}
