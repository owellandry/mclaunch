import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiChevronRight, FiClock, FiCpu } from "react-icons/fi";

type HeroMainProps = {
  versionId: string;
  versionType: string;
  isInstalled: boolean;
  memoryMb: number;
  hoursPlayed: number;
};

export function HeroMain({
  versionId,
  versionType,
  isInstalled,
  memoryMb,
  hoursPlayed,
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
        className="mt-[clamp(0.7rem,1.8vh,1.35rem)] mb-[clamp(0.7rem,1.6vh,1.15rem)] font-black leading-[0.92] tracking-tight text-[var(--color-hero-heading)]"
        style={{ fontSize: "var(--hero-title-size)" }}
      >
        Minecraft {versionId || "—"}
      </h1>

      <p
        className="w-full max-w-[var(--hero-body-max)] leading-relaxed text-[var(--color-hero-description)]/80"
        style={{ fontSize: "var(--hero-body-size)" }}
      >
        {t("dashboard.hero_desc")}
      </p>

      <div className="mt-[clamp(1rem,2.4vh,1.5rem)] flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 font-bold uppercase tracking-[0.14em] ${
            isInstalled
              ? "bg-primary/20 text-primary"
              : "bg-white/10 text-white/70"
          }`}
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          {isInstalled ? t("dashboard.installed_version") : t("dashboard.available_version")}
        </span>

        <span
          className="inline-flex items-center gap-3 text-white/55"
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <FiCpu className="opacity-70" style={{ fontSize: "1.05em" }} />
            {memoryMb} MB
          </span>
          <span className="text-white/25" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FiClock className="opacity-70" style={{ fontSize: "1.05em" }} />
            {hoursPlayed.toFixed(1)}h
          </span>
        </span>

        <Link
          to="/dashboard/versions"
          className="inline-flex items-center gap-1 font-bold uppercase tracking-[0.14em] text-[var(--color-hero-eyebrow)] transition-colors hover:text-white"
          style={{ fontSize: "var(--hero-meta-size)" }}
        >
          {t("dashboard.select_version")}
          <FiChevronRight className="text-[1.1em]" />
        </Link>
      </div>
    </div>
  );
}
