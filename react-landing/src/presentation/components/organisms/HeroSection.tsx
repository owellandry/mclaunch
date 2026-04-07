/**
 * @file HeroSection.tsx
 * @description Sección principal de la landing. Atrae al usuario y le presenta la llamada a la acción principal.
 */
import { Download, Monitor, Zap } from "lucide-react";
import { Button } from "../atoms/Button";
import { useLandingStore } from "../../../application/store/useLandingStore";
import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { recommendedDownload, os } = useLandingStore();
  const { t } = useTranslation();

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[90vh] text-center w-full max-w-5xl mx-auto py-24 md:py-32">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,var(--color-primary-shadow)_0%,transparent_50%)] opacity-30 pointer-events-none -z-10 blur-3xl" />
      
      <div className="inline-flex items-center gap-3 px-5 py-2 mb-10 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm text-primary text-xs font-bold tracking-[0.2em] uppercase shadow-[0_0_20px_var(--color-primary-shadow)]">
        <Zap size={16} className="fill-primary" />
        <span>{t("hero.badge")}</span>
      </div>

      <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter text-white mb-8 leading-[0.9]">
        {t("hero.title_1")} <span className="text-primary block md:inline">{t("hero.title_mc")}</span><br />
        <span className="text-white/90">{t("hero.title_2")}</span>
      </h1>

      <p className="text-lg md:text-2xl text-white/60 max-w-3xl font-medium leading-relaxed mb-16 mx-auto tracking-wide">
        {t("hero.desc")}
      </p>

      <div className="flex flex-col items-center gap-6 w-full sm:w-auto">
        <Button 
          variant="primary" 
          className="w-full sm:w-auto px-12 py-6 text-lg"
          icon={<Download size={24} />}
          onClick={() => {
            if (recommendedDownload) window.location.href = recommendedDownload.url;
          }}
        >
          {t("hero.btn_download")}
        </Button>
        <span className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40 flex items-center gap-2">
          <Monitor size={16} /> {t("hero.detected")} <span className="text-white/80">{os === "unknown" ? "OS" : os}</span>
        </span>
      </div>
    </section>
  );
}
