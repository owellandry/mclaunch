import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "../organisms/Footer";

export function LandingLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden text-textMain selection:bg-primary/30 selection:text-white">
      <div className="noise-overlay" aria-hidden />

      <div
        className="pointer-events-none fixed left-0 top-0 h-full w-[70vw] opacity-[0.04]"
        style={{
          background: 'radial-gradient(ellipse at 0% 50%, var(--color-primary) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none fixed right-0 top-0 h-full w-[50vw] opacity-[0.03]"
        style={{
          background: 'radial-gradient(ellipse at 100% 30%, rgba(57, 255, 20, 0.3) 0%, transparent 70%)',
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
        aria-hidden
      />

      <header
        className={`sticky top-0 z-50 w-full transition-all duration-500 ${
          scrolled
            ? "bg-[#08100C]/80 backdrop-blur-xl border-b border-white/[0.04]"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-2.5">
            <img
              src="/logo_slaumcher.png"
              alt="Slaumcher"
              className="size-8 transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_10px_var(--color-primary-shadow)]"
            />
            <strong className="text-base font-black tracking-tight text-white/90 transition-colors group-hover:text-white">
              Slaumcher
            </strong>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="/#features"
              className="rounded-full px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/45 transition-all duration-200 hover:bg-white/5 hover:text-white/80 sm:px-5"
            >
              {t("nav.features")}
            </a>
            <a
              href="/#download"
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80 transition-all duration-200 hover:bg-white/[0.07] hover:border-white/20 hover:text-white sm:px-5"
            >
              {t("nav.download")}
            </a>
          </nav>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      <Footer />
    </div>
  );
}
