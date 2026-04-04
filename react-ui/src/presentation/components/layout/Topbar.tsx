import { FiSearch, FiBell } from "react-icons/fi";
import { useAppStore } from "../../../application/store/useAppStore";

export function Topbar() {
  const { profile } = useAppStore();
  const displayName = profile?.username || "Player";

  return (
    <header className="h-20 flex items-center justify-between px-8 z-10 relative shrink-0">
      <div className="flex items-center gap-6">
        <h2 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-2 font-mono">
          MINECRAFT <span className="bg-primary text-black px-2 py-0.5 text-sm mc-cutout-small">HUB</span>
        </h2>
      </div>

      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="flex items-center gap-3 bg-surfaceLight/50 border border-white/10 px-4 py-2 w-64 focus-within:border-primary/50 transition-colors mc-cutout-small">
          <FiSearch className="text-textMuted" />
          <input
            className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-textMuted font-mono"
            placeholder="Buscar..."
            readOnly
          />
        </div>

        {/* Notifications */}
        <button className="w-10 h-10 bg-surfaceLight/50 border border-white/10 flex items-center justify-center text-textMuted hover:text-white hover:border-primary/50 transition-colors mc-cutout-small">
          <FiBell />
        </button>
        
        {/* Profile */}
        <div className="flex items-center gap-3 bg-surfaceLight/50 border border-white/10 pl-4 pr-1 py-1 mc-cutout-small">
          <span className="text-sm font-bold text-white uppercase tracking-wider">{displayName}</span>
          <div className="w-8 h-8 bg-primary flex items-center justify-center text-black font-black mc-cutout-small">
            {displayName.slice(0, 1).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );
}
