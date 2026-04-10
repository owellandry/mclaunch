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
    <div className="relative flex flex-col min-h-screen bg-background overflow-hidden text-textMain selection:bg-primary/30 selection:text-textMain">
      {/* Fondos y gradientes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary-shadow)_0%,transparent_40%)] opacity-20 pointer-events-none" />

      {/* Navbar Simple */}
      <header className="relative z-50 flex items-center justify-between w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Link to="/" className="flex items-center gap-4 group">
          <div className="h-8 w-8 bg-primary shadow-[0_0_20px_var(--color-primary-shadow)] mc-cutout-small group-hover:bg-primaryHover transition-colors flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/80 mc-cutout-small" />
          </div>
          <strong className="text-2xl font-black uppercase tracking-tighter text-textMain group-hover:text-primary transition-colors">Slaumcher</strong>
        </Link>
        <nav className="hidden md:flex gap-10">
          <a href="/#features" className="text-xs font-bold uppercase tracking-[0.2em] text-textMuted hover:text-primary transition-colors">{t("nav.features")}</a>
          <a href="/#download" className="text-xs font-bold uppercase tracking-[0.2em] text-textMuted hover:text-primary transition-colors">{t("nav.download")}</a>
        </nav>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex flex-col w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Footer Extraído */}
      <Footer />
    </div>
  );
}
