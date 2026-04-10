/**
 * @file LandingLayout.tsx
 * @description Plantilla principal para la landing page. Incluye la estructura base, el navbar minimalista y el footer.
 */
import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Footer } from "../organisms/Footer";

export function LandingLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex flex-col min-h-screen bg-[#050505] overflow-hidden text-[#f2f5ec] selection:bg-primary/30 selection:text-white">
      {/* Fondos y gradientes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary-shadow)_0%,transparent_40%)] opacity-20 pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(rgba(255,255,255,1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,1)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      {/* Navbar Simple */}
      <header className="relative z-50 flex items-center justify-between px-8 py-8 w-full max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="h-8 w-8 bg-primary shadow-[0_0_20px_var(--color-primary-shadow)] mc-cutout-small group-hover:bg-primaryHover transition-colors flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-black/30 mc-cutout-small" />
          </div>
          <strong className="text-2xl font-black uppercase tracking-tighter text-white group-hover:text-primary transition-colors">Slaumcher</strong>
        </Link>
        <nav className="hidden md:flex gap-10">
          <a href="/#features" className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">{t("nav.features")}</a>
          <a href="/#download" className="text-xs font-bold uppercase tracking-[0.2em] text-white/50 hover:text-primary transition-colors">{t("nav.download")}</a>
        </nav>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex flex-col w-full max-w-7xl mx-auto px-6">
        {children}
      </main>

      {/* Footer Extraído */}
      <Footer />
    </div>
  );
}
