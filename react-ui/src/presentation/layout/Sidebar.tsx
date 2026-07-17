import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/application/store/useAppStore";
import { navItems } from "@/presentation/constants/nav";
import { getLogoSrc } from "@/presentation/constants/logoAssets";
import { HoverLabel } from "@/presentation/design-system";

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
        <HoverLabel key={opt.id} label={opt.name} side="bottom" labelClassName="uppercase">
          <button
            type="button"
            aria-label={opt.name}
            onClick={() => onSelect(opt.id)}
            className={`size-11 shrink-0 flex items-center justify-center rounded-lg transition-all p-1.5 cursor-pointer ${
              logo === opt.id
                ? "ring-1 ring-primary bg-primary/15"
                : "bg-white/5 hover:bg-white/10 ring-0"
            }`}
          >
            <img
              src={getLogoSrc(opt.id)}
              alt=""
              aria-hidden
              className="size-8 max-w-none shrink-0 object-contain"
            />
          </button>
        </HoverLabel>
      ))}
    </div>
  );
}

export function Sidebar() {
  const { t } = useTranslation();
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
        <HoverLabel label="Slaumcher" side="right" disabled={pickerOpen} labelClassName="uppercase">
          <button
            type="button"
            aria-label="Slaumcher"
            onClick={() => setPickerOpen(!pickerOpen)}
            className={`flex items-center justify-center rounded-lg transition-all p-1 cursor-pointer ${
              pickerOpen ? "ring-2 ring-primary" : "hover:ring-1 hover:ring-white/30"
            }`}
          >
            <img
              src={getLogoSrc(logo)}
              alt=""
              aria-hidden
              className="w-10 h-10 object-contain"
            />
          </button>
        </HoverLabel>
        {pickerOpen && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50">
            <LogoPicker logo={logo} onSelect={handleSelect} />
          </div>
        )}
      </div>

      <nav className="flex flex-col items-center gap-3.5 px-3 py-3 rounded-[18px] bg-[var(--surface-nav-rail-alpha)]">
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const label = t(`sidebar.${labelKey}`);
          const isActive =
            location.pathname === path ||
            (path !== "/dashboard" && location.pathname.startsWith(path));
          return (
            <HoverLabel key={path} label={label} side="right" labelClassName="uppercase">
              <Link
                to={path}
                aria-label={label}
                className={`flex size-7 items-center justify-center rounded-lg transition-all ${
                  isActive
                    ? "bg-white text-[var(--color-dark)]"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="text-sm" aria-hidden />
              </Link>
            </HoverLabel>
          );
        })}
      </nav>
    </aside>
  );
}
