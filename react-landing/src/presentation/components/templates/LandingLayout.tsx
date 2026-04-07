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
    <div className="relative flex flex-col min-h-screen bg-surface overflow-hidden text-textMain selection:bg-primary/30">
      {/* Fondos y gradientes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,var(--color-primary-shadow)_0%,transparent_50%)] opacity-30 pointer-events-none" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      {/* Navbar Simple */}
      <header className="relative z-50 flex items-center justify-between px-8 py-6 w-full max-w-7xl mx-auto">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-6 w-6 bg-primary rounded-sm shadow-[0_0_15px_var(--color-primary-shadow)] mc-cutout-small group-hover:bg-primaryHover transition-colors" />
          <strong className="text-xl font-black uppercase tracking-widest text-textMain group-hover:text-primary transition-colors">MC Launch</strong>
        </Link>
        <nav className="hidden md:flex gap-8">
          <a href="/#features" className="text-sm font-bold uppercase tracking-widest text-textMuted hover:text-primary transition-colors">{t("nav.features")}</a>
          <a href="/#download" className="text-sm font-bold uppercase tracking-widest text-textMuted hover:text-primary transition-colors">{t("nav.download")}</a>
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
