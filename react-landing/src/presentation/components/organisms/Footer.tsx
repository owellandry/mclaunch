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
    <footer className="relative z-10 w-full bg-surface mt-auto overflow-hidden">
      
      {/* Decorative Top Border Line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
      <div className="h-1 w-full border-t-2 border-dashed border-surfaceLight" />

      {/* Decorative Grid Pattern for Footer */}
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(var(--color-primary)_1px,transparent_1px),linear-gradient(90deg,var(--color-primary)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-8 py-16 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-12">
        
        {/* Logo / Brand / Copyright */}
        <div className="flex flex-col items-center lg:items-start gap-6">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="h-10 w-10 bg-primary mc-cutout-small flex items-center justify-center shadow-[0_4px_0_var(--color-primary-shadow)] group-hover:-translate-y-1 transition-transform">
              <div className="w-4 h-4 border-2 border-white/80 mc-cutout-small" />
            </div>
            <strong className="text-3xl font-black uppercase tracking-tighter text-textMain group-hover:text-primary transition-colors">Slaumcher</strong>
          </Link>
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-textMuted text-center lg:text-left max-w-xs leading-relaxed">
            {t("footer.rights")}
          </div>
        </div>

        {/* Right Section: Links & Language */}
        <div className="flex flex-col sm:flex-row items-center lg:items-start gap-10 sm:gap-16">
          
          {/* Navigation Links */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mb-2">// LEGAL</span>
            <Link to="/privacy" className="text-sm font-bold uppercase tracking-widest text-textMain hover:text-primary transition-colors relative group">
              {t("footer.privacy")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
            <Link to="/terms" className="text-sm font-bold uppercase tracking-widest text-textMain hover:text-primary transition-colors relative group">
              {t("footer.terms")}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
            </Link>
          </div>

          {/* Language Selector */}
          <div className="flex flex-col items-center sm:items-start gap-4">
            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.3em] mb-2">// LANGUAGE</span>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-textMuted bg-background px-4 py-3 border-2 border-surfaceLight mc-cutout shadow-sm">
              <Globe size={16} className="text-primary" />
              <button 
                onClick={() => changeLanguage('es')} 
                className={`transition-colors px-2 py-1 ${i18n.language?.startsWith('es') ? 'bg-primary text-white mc-cutout-small' : 'hover:text-textMain'}`}
              >ES</button>
              <button 
                onClick={() => changeLanguage('en')} 
                className={`transition-colors px-2 py-1 ${i18n.language?.startsWith('en') ? 'bg-primary text-white mc-cutout-small' : 'hover:text-textMain'}`}
              >EN</button>
              <button 
                onClick={() => changeLanguage('pt')} 
                className={`transition-colors px-2 py-1 ${i18n.language?.startsWith('pt') ? 'bg-primary text-white mc-cutout-small' : 'hover:text-textMain'}`}
              >PT</button>
            </div>
          </div>
          
        </div>

      </div>
      
      {/* Bottom Bar */}
      <div className="w-full bg-background py-4 border-t-2 border-surfaceLight flex justify-center">
        <span className="text-[10px] font-mono font-bold text-textMuted uppercase tracking-[0.4em]">SYSTEM OFFLINE [ // ]</span>
      </div>
    </footer>
  );
}
