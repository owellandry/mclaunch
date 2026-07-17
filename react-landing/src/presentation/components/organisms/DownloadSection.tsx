import { useLandingStore } from "../../../application/store/useLandingStore";
import type { DownloadOption } from "../../../domain/entities/OS";
import { DownloadCard } from "../molecules/DownloadCard";
import { Reveal } from "../atoms/Reveal";
import { useTranslation } from "react-i18next";

export function DownloadSection() {
  const { os } = useLandingStore();
  const { t } = useTranslation();

  const allOptions: DownloadOption[] = [
    {
      os: "windows",
      label: `${t("nav.download")} Windows`,
      filename: "Slaumcher-Setup.exe",
      url: "#win",
    },
    {
      os: "mac",
      label: `${t("nav.download")} macOS`,
      filename: "Slaumcher.dmg",
      url: "#mac",
    },
    {
      os: "linux",
      label: `${t("nav.download")} Linux`,
      filename: "Slaumcher.AppImage",
      url: "#lin",
    },
  ];

  return (
    <section id="download" className="relative w-full scroll-mt-24 py-16 sm:py-28">
      <Reveal variant="fade-up">
        <div className="mb-12 max-w-2xl sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            {t("download.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white/90 sm:text-4xl">
            {t("download.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45 sm:text-base">
            {t("download.subtitle")}
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {allOptions.map((opt, i) => (
          <Reveal key={opt.os} variant="fade-up" delay={i * 100}>
            <DownloadCard option={opt} isRecommended={opt.os === os} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
