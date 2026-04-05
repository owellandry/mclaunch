import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiLayers, FiServer, FiSettings } from "react-icons/fi";
import { useAppStore } from "../../../application/store/useAppStore";

const NAV_ITEMS = [
  { id: "dashboard", path: "/dashboard", label: "Inicio", icon: FiGrid },
  { id: "library", path: "/library", label: "Biblioteca", icon: FiLayers },
  { id: "servers", path: "/servers", label: "Servidores", icon: FiServer },
  { id: "settings", path: "/settings", label: "Ajustes", icon: FiSettings },
];

export function Sidebar() {
  const location = useLocation();
  const { logo } = useAppStore();

  return (
    <aside className="w-20 border-r border-black/5 flex flex-col items-center py-6 bg-surface/80 backdrop-blur-xl z-20">
      {/* Brand Icon — logo */}
      <div className="mb-8 flex flex-col items-center gap-1.5">
        <img
          src={`./logo/${logo}`}
          alt="MCLaunch"
          className="w-12 h-12 "
        />
        <span className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">MC</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (location.pathname === '/' && item.path === '/dashboard');
          return (
            <Link
              key={item.id}
              to={item.path}
              title={item.label}
              className={`w-12 h-12 flex items-center justify-center transition-all ${
                isActive 
                  ? "bg-surfaceLight text-primary border border-black/5 mc-cutout-small" 
                  : "text-textMuted hover:bg-black/5 hover:text-textMain rounded-xl"
              }`}
            >
              <Icon className={`text-xl ${isActive ? "drop-shadow-[0_0_8px_#A1E9A5CC]" : ""}`} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
