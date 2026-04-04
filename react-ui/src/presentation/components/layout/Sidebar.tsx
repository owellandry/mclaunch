import { Link, useLocation } from "react-router-dom";
import { FiGrid, FiLayers, FiServer, FiSettings, FiTarget } from "react-icons/fi";

const NAV_ITEMS = [
  { id: "dashboard", path: "/dashboard", label: "Inicio", icon: FiGrid },
  { id: "library", path: "/library", label: "Biblioteca", icon: FiLayers },
  { id: "servers", path: "/servers", label: "Servidores", icon: FiServer },
  { id: "settings", path: "/settings", label: "Ajustes", icon: FiSettings },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-20 border-r border-white/5 flex flex-col items-center py-6 bg-surface/50 backdrop-blur-xl z-20">
      {/* Brand Icon */}
      <div className="w-12 h-12 bg-primary text-black flex items-center justify-center shadow-[0_0_15px_rgba(74,222,128,0.4)] mb-8 mc-cutout-small">
        <FiTarget className="text-2xl" />
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
                  ? "bg-surfaceLight text-primary border border-white/10 mc-cutout-small" 
                  : "text-textMuted hover:bg-white/5 hover:text-white rounded-xl"
              }`}
            >
              <Icon className={`text-xl ${isActive ? "drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]" : ""}`} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
