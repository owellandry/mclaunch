import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/application/store/useAppStore";
import { navItems } from "@/presentation/constants/nav";
import { getLogoSrc } from "@/presentation/constants/logoAssets";
import { HoverLabel } from "@/presentation/design-system";
import { SettingsModal } from "@/presentation/layout/SettingsModal";
import { gsap, useGSAP } from "@/presentation/lib/gsap";

const LOGO_OPTIONS = [
  { id: "logo_gren.svg", name: "Verde" },
  { id: "logo_blue.svg", name: "Azul" },
  { id: "logo_lemon.svg", name: "Limón" },
  { id: "logo_purple.svg", name: "Púrpura" },
  { id: "logo_yellow.svg", name: "Amarillo" },
];

function LogoPicker({ logo, onSelect }: { logo: string; onSelect: (id: string) => void }) {
  const pickerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.from(pickerRef.current, {
        opacity: 0,
        x: -12,
        scale: 0.94,
        duration: 0.35,
        ease: "power3.out",
      });
    },
    { scope: pickerRef },
  );

  return (
    <div
      ref={pickerRef}
      className="w-max shrink-0 bg-[var(--surface-elevated)] border border-white/10 rounded-xl p-2 flex flex-row gap-1.5"
    >
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      if (!contextSafe) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const logoBtn = rootRef.current?.querySelector<HTMLElement>("[data-sidebar-logo]");
        const nav = rootRef.current?.querySelector<HTMLElement>("[data-sidebar-nav]");
        const navItemsEls = gsap.utils.toArray<HTMLElement>("[data-sidebar-nav] a, [data-sidebar-nav] button");

        if (logoBtn) {
          gsap.from(logoBtn, {
            opacity: 0,
            scale: 0.7,
            rotation: -12,
            duration: 0.65,
            ease: "back.out(1.6)",
          });
        }

        if (nav) {
          gsap.from(nav, {
            opacity: 0,
            y: 16,
            duration: 0.55,
            delay: 0.12,
          });
        }

        if (navItemsEls.length) {
          gsap.from(navItemsEls, {
            opacity: 0,
            y: 10,
            scale: 0.85,
            duration: 0.4,
            stagger: 0.05,
            delay: 0.22,
            ease: "power2.out",
          });
        }

        const onEnter = contextSafe((event: Event) => {
          const el = event.currentTarget as HTMLElement;
          gsap.to(el, { scale: 1.12, duration: 0.22, ease: "power2.out", overwrite: "auto" });
        });
        const onLeave = contextSafe((event: Event) => {
          const el = event.currentTarget as HTMLElement;
          gsap.to(el, { scale: 1, duration: 0.28, ease: "power2.out", overwrite: "auto" });
        });

        navItemsEls.forEach((el) => {
          el.addEventListener("pointerenter", onEnter);
          el.addEventListener("pointerleave", onLeave);
        });

        return () => {
          navItemsEls.forEach((el) => {
            el.removeEventListener("pointerenter", onEnter);
            el.removeEventListener("pointerleave", onLeave);
          });
        };
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

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
    <aside
      ref={rootRef}
      className="absolute top-[var(--sidebar-offset)] left-[var(--sidebar-offset)] z-40 flex w-[var(--sidebar-w)] flex-col items-center gap-9"
    >
      <div ref={pickerRef} className="relative" data-sidebar-logo>
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

      <nav
        data-sidebar-nav
        className="flex flex-col items-center gap-2.5 rounded-2xl border border-white/[0.08] bg-[var(--surface-nav-rail-alpha)] px-2.5 py-3 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md"
      >
        {navItems.map(({ path, icon: Icon, labelKey }) => {
          const label = t(`sidebar.${labelKey}`);
          const isSettings = path === "/settings";
          const isActive =
            !isSettings &&
            (location.pathname === path ||
              (path !== "/dashboard" && location.pathname.startsWith(path)));

          if (isSettings) {
            return (
              <HoverLabel key={path} label={label} side="right" labelClassName="uppercase">
                <button
                  type="button"
                  onClick={() => setSettingsOpen(true)}
                  aria-label={label}
                  className="flex size-8 items-center justify-center rounded-xl text-white/75 transition-colors hover:bg-white/10 hover:text-white cursor-pointer will-change-transform"
                >
                  <Icon className="text-[15px]" aria-hidden />
                </button>
              </HoverLabel>
            );
          }

          return (
            <HoverLabel key={path} label={label} side="right" labelClassName="uppercase">
              <Link
                to={path}
                aria-label={label}
                className={`flex size-8 items-center justify-center rounded-xl transition-colors will-change-transform ${
                  isActive
                    ? "bg-white text-[var(--color-dark)] shadow-sm"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon className="text-[15px]" aria-hidden />
              </Link>
            </HoverLabel>
          );
        })}
      </nav>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </aside>
  );
}
