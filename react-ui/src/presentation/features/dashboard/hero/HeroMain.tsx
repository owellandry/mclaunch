import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiChevronRight, FiHardDrive, FiCpu } from "react-icons/fi";

type HeroMainProps = {
  versionId: string;
  versionType: string;
  isInstalled: boolean;
  memoryMb: number;
  hoursPlayed: number;
  playerName: string;
};

export function HeroMain({
  versionId,
  versionType,
  isInstalled,
  memoryMb,
  hoursPlayed,
  playerName,
}: HeroMainProps) {
  const { t } = useTranslation();

  const typeLabel =
    versionType === "snapshot"
      ? "Snapshot"
      : versionType === "old_beta" || versionType === "old_alpha"
        ? versionType
        : t("dashboard.vanilla_release");

  return (
    <div className="relative z-10 w-full max-w-[var(--hero-copy-max)] min-w-0">
      <span className="text-xs font-semibold tracking-wide text-[var(--color-hero-eyebrow)]">
        {typeLabel}
      </span>

      <h1 className="mt-[clamp(16px,3.5vh,48px)] mb-[clamp(12px,2.5vh,24px)] font-[Inter] font-black leading-[0.88] tracking-tight text-[clamp(1.5rem,4vw,2.875rem)] text-[var(--color-hero-heading)]">
        Minecraft {versionId || "—"}
      </h1>

      <p className="max-w-[min(22rem,100%)] font-[Inter] text-sm leading-relaxed text-[var(--color-hero-description)]">
        {t("dashboard.hero_desc")}
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
            isInstalled
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-white/15 bg-white/5 text-white/55"
          }`}
        >
          {isInstalled ? t("dashboard.installed_version") : t("dashboard.available_version")}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
          <FiCpu className="text-xs opacity-70" />
          {memoryMb} MB
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
          <FiHardDrive className="text-xs opacity-70" />
          {hoursPlayed.toFixed(1)}h
        </span>
      </div>

      <div className="mt-[clamp(16px,4vh,40px)] flex flex-wrap items-center gap-4">
        <span className="text-[11px] font-bold tracking-wide text-white/90">
          {playerName}
        </span>
        <Link
          to="/dashboard/versions"
          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--color-hero-eyebrow)] transition-colors hover:text-white"
        >
          {t("dashboard.select_version")}
          <FiChevronRight />
        </Link>
      </div>
    </div>
  );
}
