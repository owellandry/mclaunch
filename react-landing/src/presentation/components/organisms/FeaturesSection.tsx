/**
 * @file FeaturesSection.tsx
 * @description Muestra una cuadrícula de características y las opciones de descarga disponibles.
 */
import { useLandingStore } from "../../../application/store/useLandingStore";
import { DownloadOption } from "../../../domain/entities/OS";
import { DownloadCard } from "../molecules/DownloadCard";

const allOptions: DownloadOption[] = [
  { os: "windows", label: "Descargar Windows", filename: "MCLaunch-Setup.exe", url: "#win" },
  { os: "mac", label: "Descargar macOS", filename: "MCLaunch-Setup.dmg", url: "#mac" },
  { os: "linux", label: "Descargar Linux", filename: "MCLaunch-x86_64.AppImage", url: "#lin" },
];

export function FeaturesSection() {
  const { os } = useLandingStore();

  return (
    <section id="download" className="relative w-full py-20 border-t border-surfaceLight">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-textMain mb-4">
          Multiplataforma
        </h2>
        <p className="text-textMuted max-w-lg mx-auto text-sm md:text-base font-medium">
          Descarga la versión oficial para tu sistema operativo y comienza a disfrutar de una experiencia de juego sin precedentes.
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
