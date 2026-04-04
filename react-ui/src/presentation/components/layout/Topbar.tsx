import { FiBookOpen, FiSearch, FiSliders } from "react-icons/fi";
import { useAppStore } from "../../../application/store/useAppStore";

export function Topbar() {
  const { profile } = useAppStore();
  const displayName = profile?.username || "Pilot Zero";

  return (
    <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-background/30 backdrop-blur-md z-10 relative">
      <div className="flex items-center gap-3 bg-surface/50 border border-white/10 rounded-lg px-4 py-2 w-96 focus-within:border-primary/50 transition-colors">
        <FiSearch className="text-textMain/70" />
        <input
          className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-textMain/50"
          placeholder="Buscar vistas, packs o presets..."
          readOnly
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="flex items-center gap-2 text-sm text-textMain/80 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
          <FiBookOpen />
          <span>Patch notes</span>
        </button>
        <button className="flex items-center gap-2 text-sm text-textMain/80 hover:text-white hover:bg-white/5 px-3 py-2 rounded-lg transition-colors">
          <FiSliders />
          <span>Command center</span>
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary/80 to-secondary flex items-center justify-center text-background font-bold shadow-[0_0_15px_rgba(102,252,241,0.3)] cursor-pointer hover:scale-105 transition-transform">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
