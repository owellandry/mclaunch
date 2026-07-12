import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAppStore } from "@/application/store/useAppStore";
import { navItems } from "@/presentation/constants/nav";
import { getLogoSrc } from "@/presentation/constants/logoAssets";

const LOGO_OPTIONS = [
  { id: "logo_gren.svg", name: "Verde" },
  { id: "logo_blue.svg", name: "Azul" },
  { id: "logo_lemon.svg", name: "Limón" },
  { id: "logo_purple.svg", name: "Púrpura" },
  { id: "logo_yellow.svg", name: "Amarillo" },
];

function LogoPicker({ logo, onSelect }: { logo: string; onSelect: (id: string) => void }) {
  return (
    <div className="w-max shrink-0 bg-[var(--surface-elevated)] border border-white/10 rounded-xl p-2 flex flex-row gap-1.5">
      {LOGO_OPTIONS.map((opt) => (
        <button
          key={opt.id}
          type="button"
          aria-label={opt.name}
          onClick={() => onSelect(opt.id)}
          className={`size-11 shrink-0 flex items-center justify-center rounded-lg transition-all p-1.5 cursor-pointer ${
            logo === opt.id
              ? "ring-1 ring-primary bg-primary/15"
              : "bg-white/5 hover:bg-white/10 ring-0"
          }`}
        >
          <img src={getLogoSrc(opt.id)} alt="" className="size-8 max-w-none shrink-0 object-contain" />
        </button>
      ))}
    </div>
  );
}

export function Sidebar() {
  const logo = useAppStore((state) => state.logo);
  const setLogo = useAppStore((state) => state.setLogo);
  const location = useLocation();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    setLogo(id);
    setPickerOpen(false);
  };

  return (
    <aside className="absolute top-[var(--sidebar-offset)] left-[var(--sidebar-offset)] z-40 flex w-[var(--sidebar-w)] flex-col items-center gap-9">
      <div ref={pickerRef} className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen(!pickerOpen)}
          className={`flex items-center justify-center rounded-lg transition-all p-1 cursor-pointer ${
            pickerOpen ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-white/30"
          }`}
        >
          <img src={getLogoSrc(logo)} alt="SLauncher" className="w-10 h-10 object-contain" />
        </button>
        {pickerOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50">
            <LogoPicker logo={logo} onSelect={handleSelect} />
          </div>
        )}
      </div>

      <nav className="flex flex-col items-center gap-3.5 px-3 py-3 rounded-[18px] bg-[var(--surface-nav-rail-alpha)]">
        {navItems.map(({ path, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path !== "/dashboard" && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                isActive
                  ? "bg-white text-[var(--color-dark)]"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              <Icon className="text-sm" />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
