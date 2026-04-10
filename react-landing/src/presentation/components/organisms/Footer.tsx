/**
 * @file Footer.tsx
 * @description Pie de página con selector de idioma, links legales y copyright.
 */
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Globe } from "lucide-react";

export function Footer() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <footer className="relative z-10 w-full border-t-2 border-surfaceLight bg-surface mt-auto overflow-hidden">
      {/* Decorative Grid Pattern for Footer */}
      <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--color-primary)_1px,transparent_1px),linear-gradient(90deg,var(--color-primary)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Logo / Brand / Copyright */}
        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 bg-primary mc-cutout-small flex items-center justify-center shadow-sm">
              <div className="w-2.5 h-2.5 border-2 border-background mc-cutout-small" />
            </div>
            <strong className="text-xl font-black uppercase tracking-tighter text-textMain">Slaumcher</strong>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-textMuted/70 text-center md:text-left max-w-xs">
            {t("footer.rights")}
          </div>
        </div>

        {/* Links & Language */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-textMain">
            <Link to="/privacy" className="hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">{t("footer.privacy")}</Link>
            <Link to="/terms" className="hover:text-primary transition-colors border-b-2 border-transparent hover:border-primary pb-1">{t("footer.terms")}</Link>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-textMuted bg-background px-5 py-3 border-2 border-surfaceLight mc-cutout shadow-sm transition-all hover:border-primary/30">
            <Globe size={14} className="text-primary" />
            <button 
              onClick={() => changeLanguage('es')} 
              className={`transition-colors ${i18n.language?.startsWith('es') ? 'text-primary' : 'hover:text-textMain'}`}
            >ES</button>
            <span className="text-surfaceLight">|</span>
            <button 
              onClick={() => changeLanguage('en')} 
              className={`transition-colors ${i18n.language?.startsWith('en') ? 'text-primary' : 'hover:text-textMain'}`}
            >EN</button>
            <span className="text-surfaceLight">|</span>
            <button 
              onClick={() => changeLanguage('pt')} 
              className={`transition-colors ${i18n.language?.startsWith('pt') ? 'text-primary' : 'hover:text-textMain'}`}
            >PT</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
