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
    <footer className="relative z-10 w-full border-t-2 border-surfaceLight bg-background mt-auto">
      <div className="max-w-7xl mx-auto px-8 py-16 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Copyright */}
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-textMuted text-center md:text-left">
          {t("footer.rights")}
        </div>

        {/* Links & Language */}
        <div className="flex flex-col md:flex-row items-center gap-10">
          <div className="flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-textMuted">
            <Link to="/privacy" className="hover:text-primary transition-colors">{t("footer.privacy")}</Link>
            <Link to="/terms" className="hover:text-primary transition-colors">{t("footer.terms")}</Link>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-textMuted bg-surface px-5 py-3 border-2 border-surfaceLight mc-cutout-small">
            <Globe size={14} className="text-primary" />
            <button 
              onClick={() => changeLanguage('es')} 
              className={`hover:text-textMain transition-colors ${i18n.language?.startsWith('es') ? 'text-primary' : ''}`}
            >ES</button>
            <span className="text-surfaceLight">|</span>
            <button 
              onClick={() => changeLanguage('en')} 
              className={`hover:text-textMain transition-colors ${i18n.language?.startsWith('en') ? 'text-primary' : ''}`}
            >EN</button>
            <span className="text-surfaceLight">|</span>
            <button 
              onClick={() => changeLanguage('pt')} 
              className={`hover:text-textMain transition-colors ${i18n.language?.startsWith('pt') ? 'text-primary' : ''}`}
            >PT</button>
          </div>
        </div>

      </div>
    </footer>
  );
}
