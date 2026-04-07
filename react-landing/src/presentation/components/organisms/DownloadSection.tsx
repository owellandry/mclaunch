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
    { os: "windows", label: t("nav.download") + " Windows", filename: "MCLaunch-Setup.exe", url: "#win" },
    { os: "mac", label: t("nav.download") + " macOS", filename: "MCLaunch-Setup.dmg", url: "#mac" },
    { os: "linux", label: t("nav.download") + " Linux", filename: "MCLaunch-x86_64.AppImage", url: "#lin" },
  ];

  return (
    <section id="download" className="relative w-full py-20 border-t border-surfaceLight scroll-mt-20">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-textMain mb-4">
          {t("download.title")}
        </h2>
        <p className="text-textMuted max-w-lg mx-auto text-sm md:text-base font-medium">
          {t("download.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {allOptions.map((opt) => (
          <DownloadCard key={opt.os} option={opt} isRecommended={opt.os === os} />
        ))}
      </div>
    </section>
  );
}
