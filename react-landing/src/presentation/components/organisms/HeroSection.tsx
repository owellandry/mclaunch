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
    <section className="relative flex flex-col items-center justify-center min-h-[85vh] sm:min-h-[90vh] text-center w-full max-w-5xl mx-auto pt-20 sm:pt-24 lg:pt-32 pb-28 sm:pb-32">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,var(--color-primary-shadow)_0%,transparent_50%)] opacity-30 pointer-events-none -z-10 blur-3xl" />
      
      <div className="inline-flex items-center gap-3 px-4 sm:px-5 py-2 mb-8 sm:mb-10 bg-surface border-2 border-surfaceLight text-primary text-xs font-bold tracking-[0.2em] uppercase mc-cutout-small shadow-[0_0_20px_var(--color-primary-shadow)]">
        <Zap size={16} className="fill-primary" />
        <span>{t("hero.badge")}</span>
      </div>

      <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-black uppercase tracking-tighter text-textMain mb-6 sm:mb-8 leading-[0.9]">
        {t("hero.title_1")} <span className="text-primary block md:inline" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.1)' }}>{t("hero.title_mc")}</span><br />
        <span className="text-textMain/80">{t("hero.title_2")}</span>
      </h1>

      <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-textMuted max-w-3xl font-medium leading-relaxed mb-10 sm:mb-16 mx-auto tracking-wide px-2 sm:px-0">
        {t("hero.desc")}
      </p>

      <div className="flex flex-col items-center gap-6 w-full sm:w-auto">
        <Button 
          variant="primary" 
          className="w-full sm:w-auto px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg mc-button-cutout"
          icon={<Download size={24} />}
          onClick={() => {
            if (recommendedDownload) window.location.href = recommendedDownload.url;
          }}
        >
          {t("hero.btn_download")}
        </Button>
        <span className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-textMuted flex items-center gap-2">
          <Monitor size={16} /> {t("hero.detected")} <span className="text-textMain">{os === "unknown" ? "OS" : os}</span>
        </span>
      </div>

      {/* Scrolling Ticker Tape at bottom of Hero */}
      <div className="absolute -bottom-6 sm:-bottom-4 left-1/2 -translate-x-1/2 w-[120vw] sm:w-[110vw] overflow-hidden bg-primary py-2.5 sm:py-3 border-y-2 border-textMain flex whitespace-nowrap -rotate-2 z-20 shadow-[0_10px_30px_rgba(0,0,0,0.1)]">
        <div className="animate-scroll_20s_linear_infinite flex gap-4 text-textMain font-bold font-mono text-[11px] sm:text-sm tracking-[0.14em] sm:tracking-[0.2em] uppercase px-2">
          {Array(10).fill(t("hero.ticker_1")).map((text, i) => (
            <span key={`a-${i}`}>{text}</span>
          ))}
        </div>
        <div className="animate-scroll_20s_linear_infinite flex gap-4 text-textMain font-bold font-mono text-[11px] sm:text-sm tracking-[0.14em] sm:tracking-[0.2em] uppercase px-2">
          {Array(10).fill(t("hero.ticker_1")).map((text, i) => (
            <span key={`b-${i}`}>{text}</span>
          ))}
        </div>
      </div>

      {/* Decorative Ticker Tape Background (Opuesto) */}
      <div className="absolute bottom-5 sm:bottom-4 left-1/2 -translate-x-1/2 w-[120vw] sm:w-[110vw] overflow-hidden bg-surfaceLight/30 py-2 border-y-2 border-textMain/10 flex whitespace-nowrap rotate-1 z-0 pointer-events-none">
        <div className="animate-scroll_30s_linear_infinite_reverse flex gap-4 text-textMain/20 font-bold font-mono text-[11px] sm:text-sm tracking-[0.14em] sm:tracking-[0.2em] uppercase px-2">
          {Array(10).fill(t("hero.ticker_2")).map((text, i) => (
            <span key={`bg-a-${i}`}>{text}</span>
          ))}
        </div>
        <div className="animate-scroll_30s_linear_infinite_reverse flex gap-4 text-textMain/20 font-bold font-mono text-[11px] sm:text-sm tracking-[0.14em] sm:tracking-[0.2em] uppercase px-2">
          {Array(10).fill(t("hero.ticker_2")).map((text, i) => (
            <span key={`bg-b-${i}`}>{text}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
