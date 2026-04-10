/**
 * @file DownloadSection.tsx
 * @description Muestra una cuadrícula de características y las opciones de descarga disponibles.
 */
import { useLandingStore } from "../../../application/store/useLandingStore";
import { DownloadOption } from "../../../domain/entities/OS";
import { DownloadCard } from "../molecules/DownloadCard";
import { useTranslation } from "react-i18next";

export function DownloadSection() {
  const { os } = useLandingStore();
  const { t } = useTranslation();

  const allOptions: DownloadOption[] = [
    { os: "windows", label: t("nav.download") + " Windows", filename: "Slaumcher-Setup.exe", url: "#win" },
    { os: "mac", label: t("nav.download") + " macOS", filename: "Slaumcher.dmg", url: "#mac" },
    { os: "linux", label: t("nav.download") + " Linux", filename: "Slaumcher.AppImage", url: "#lin" },
  ];

  return (
    <section id="download" className="relative w-full py-20 sm:py-24 lg:py-32 border-t-2 border-surfaceLight scroll-mt-20">
      
      {/* Minecraft-style Section Header */}
      <div className="max-w-6xl mx-auto px-4 mb-10 sm:mb-16">
        <div className="flex items-center gap-4 text-primary font-mono text-xs sm:text-base tracking-[0.2em] uppercase min-w-0">
          <div className="px-4 sm:px-6 py-2 bg-surface border-2 border-surfaceLight mc-cutout-small font-bold text-textMain shrink-0">
            02 // {t("download.title")}
          </div>
          <div className="flex-1 h-px border-t-2 border-dashed border-surfaceLight" />
        </div>
      </div>

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[520px] sm:w-[700px] lg:w-[800px] h-[220px] sm:h-[280px] lg:h-[300px] bg-[radial-gradient(ellipse_at_top,var(--color-primary-shadow)_0%,transparent_70%)] opacity-20 pointer-events-none blur-[100px]" />

      <div className="text-center mb-12 sm:mb-20 relative z-10">
        <p className="text-textMuted max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium tracking-wide px-2 sm:px-0">
          {t("download.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto relative z-10 px-4">
        {allOptions.map((opt) => (
          <DownloadCard key={opt.os} option={opt} isRecommended={opt.os === os} />
        ))}
      </div>
    </section>
  );
}
