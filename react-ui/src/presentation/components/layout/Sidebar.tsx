import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiLayers, FiServer, FiSettings, FiStar } from "react-icons/fi";
import { useLauncherStore } from "../../../application/store/useLauncherStore";
import { useAppStore } from "../../../application/store/useAppStore";

const NAV_ITEMS = [
  { id: "dashboard", path: "/dashboard", label: "Inicio", icon: FiGrid, hint: "Cabina principal" },
  { id: "library", path: "/library", label: "Biblioteca", icon: FiLayers, hint: "Instancias y packs" },
  { id: "servers", path: "/servers", label: "Servidores", icon: FiServer, hint: "Multijugador mock" },
  { id: "settings", path: "/settings", label: "Ajustes", icon: FiSettings, hint: "Tuning visual" },
];

export function Sidebar() {
  const location = useLocation();
  const { status } = useLauncherStore();
  const { config } = useAppStore();
  const progressValue = status === "running" ? 72 : status === "done" ? 100 : status === "error" ? 24 : 48;
  const memoryInGb = `${(config.memoryMb / 1024).toFixed(1)} GB`;

  return (
    <aside className="w-72 border-r border-white/5 flex flex-col h-full bg-background/50 backdrop-blur-xl z-10 relative">
      <div className="p-8 pb-4 flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(102,252,241,0.2)]">
          <FiStar className="text-xl" />
        </div>
        <div>
          <p className="text-xs text-textMain/70 uppercase tracking-widest font-semibold">MC Launch</p>
          <strong className="text-white font-bold text-lg">Nebula Console</strong>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 flex flex-col gap-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                isActive 
                  ? "bg-white/10 text-white shadow-inner border border-white/5" 
                  : "text-textMain/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className={`text-xl ${isActive ? "text-primary" : ""}`} />
              <div className="flex flex-col">
                <span className="font-semibold text-sm">{item.label}</span>
                <span className="text-[10px] opacity-70">{item.hint}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-white/5">
        <div className="glass-panel p-4 mb-4 rounded-xl border border-white/5">
          <p className="text-xs text-textMain/70 uppercase tracking-widest font-semibold mb-1">Live preset</p>
          <strong className="text-white text-sm block mb-2">Aurora Build</strong>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-surface rounded text-xs text-textMain">{memoryInGb}</span>
            <span className="px-2 py-1 bg-surface rounded text-xs text-textMain">{config.version}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-surface"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-primary transition-all duration-1000"
                strokeWidth="3"
                strokeDasharray={`${progressValue}, 100`}
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-bold text-white">{progressValue}%</span>
          </div>
          <div>
            <p className="text-xs text-textMain/70">Progreso del flujo</p>
            <strong className="text-sm text-white">{status === "running" ? "Iniciando..." : "Operativo"}</strong>
          </div>
        </div>
      </div>
    </aside>
  );
}
