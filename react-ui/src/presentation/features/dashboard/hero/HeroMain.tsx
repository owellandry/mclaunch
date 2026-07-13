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
    <div className="relative z-10 w-full min-w-0 max-w-[var(--hero-copy-max)]">
      <span
        className="font-semibold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]"
        style={{ fontSize: "var(--hero-eyebrow-size)" }}
      >
        {typeLabel}
      </span>

      <h1
        className="mt-[clamp(0.85rem,2.2vh,1.75rem)] mb-[clamp(0.85rem,2vh,1.4rem)] font-[Inter] font-black leading-[0.9] tracking-tight text-[var(--color-hero-heading)]"
        style={{ fontSize: "var(--hero-title-size)" }}
      >
        Minecraft {versionId || "—"}
      </h1>

      <p
        className="w-full max-w-[var(--hero-body-max)] font-[Inter] leading-relaxed text-[var(--color-hero-description)]/90"
        style={{ fontSize: "var(--hero-body-size)" }}
      >
        {t("dashboard.hero_desc")}
      </p>

      <div className="mt-[clamp(1.1rem,2.8vh,1.75rem)] flex flex-wrap items-center gap-2 sm:gap-3">
        <span
          className={`inline-flex items-center rounded-lg border px-3.5 py-2 font-bold uppercase tracking-[0.14em] sm:px-4 sm:py-2.5 ${
            isInstalled
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-white/15 bg-[var(--surface-elevated)] text-white/60"
          }`}
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          {isInstalled ? t("dashboard.installed_version") : t("dashboard.available_version")}
        </span>
        <span
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3.5 py-2 font-bold uppercase tracking-[0.12em] text-white/70 sm:px-4 sm:py-2.5"
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          <FiCpu className="shrink-0 opacity-70" style={{ fontSize: "1.05em" }} />
          {memoryMb} MB
        </span>
        <span
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[var(--surface-elevated)] px-3.5 py-2 font-bold uppercase tracking-[0.12em] text-white/70 sm:px-4 sm:py-2.5"
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          <FiHardDrive className="shrink-0 opacity-70" style={{ fontSize: "1.05em" }} />
          {hoursPlayed.toFixed(1)}h
        </span>
      </div>

      <div className="mt-[clamp(1.15rem,3.2vh,2.25rem)] flex flex-wrap items-center gap-3 sm:gap-5">
        <span
          className="font-bold tracking-wide text-white"
          style={{ fontSize: "var(--hero-body-size)" }}
        >
          {playerName}
        </span>
        <Link
          to="/dashboard/versions"
          className="inline-flex items-center gap-1.5 font-bold uppercase tracking-[0.16em] text-[var(--color-hero-eyebrow)] transition-colors hover:text-white"
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          {t("dashboard.select_version")}
          <FiChevronRight className="text-[1.15em]" />
        </Link>
      </div>
    </div>
  );
}
