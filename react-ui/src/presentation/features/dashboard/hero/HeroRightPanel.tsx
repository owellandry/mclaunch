import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiActivity, FiBarChart2 } from "react-icons/fi";
import type { ReactNode } from "react";
import { HoverLabel } from "@/presentation/design-system";

type HeroRightPanelProps = {
  weeklyActivity: number[];
  mobKills: number;
  deaths: number;
  blocksMined: number;
  downloadedCount: number;
  availableCount: number;
};

function formatSeconds(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function SectionTitle({
  icon,
  title,
  trailing,
}: {
  icon: ReactNode;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2.5 text-white">
        <span className="shrink-0 text-white/55">{icon}</span>
        <span className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
          {title}
        </span>
      </div>
      {trailing}
    </div>
  );
}

export function HeroRightPanel({
  weeklyActivity,
  mobKills,
  deaths,
  blocksMined,
  downloadedCount,
  availableCount,
}: HeroRightPanelProps) {
  const { t } = useTranslation();
  const max = Math.max(...weeklyActivity, 1);
  const weekTotal = weeklyActivity.reduce((a, b) => a + b, 0);

  return (
    <div
      data-hero-panel
      className="relative z-10 w-full max-w-[min(28rem,100%)] min-w-0 overflow-hidden rounded-2xl border border-white/[0.08] bg-[var(--surface-elevated)]/55 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl"
    >
      <div className="border-b border-white/[0.06] px-5 py-4">
        <SectionTitle
          icon={<FiActivity className="text-base" />}
          title={t("dashboard.weekly_activity")}
          trailing={
            <span className="shrink-0 font-mono text-xs text-white/50">
              {formatSeconds(weekTotal)}
            </span>
          }
        />
        <div className="flex h-20 items-end gap-2 sm:h-24">
          {weeklyActivity.map((value, index) => {
            const height = value <= 0 ? 10 : Math.max(14, Math.round((value / max) * 100));
            return (
              <HoverLabel
                key={index}
                label={formatSeconds(value)}
                side="top"
                className="min-h-0 min-w-0 flex-1 self-end"
                labelClassName="normal-case tracking-normal font-mono"
              >
                <div
                  data-activity-bar
                  className="w-full origin-bottom rounded-sm bg-primary/55 transition-colors hover:bg-primary/80 will-change-transform"
                  style={{ height: `${height}%` }}
                  aria-label={formatSeconds(value)}
                />
              </HoverLabel>
            );
          })}
        </div>
        <Link
          to="/dashboard/activity"
          className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-primary"
        >
          {t("dashboard.see_full_activity")} ›
        </Link>
      </div>

      <div className="px-5 py-4">
        <SectionTitle icon={<FiBarChart2 className="text-base" />} title={t("dashboard.your_stats")} />
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t("dashboard.mob_kills"), value: mobKills.toLocaleString() },
            { label: t("dashboard.deaths"), value: deaths.toLocaleString() },
            { label: t("dashboard.blocks_mined"), value: blocksMined.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0">
              <div className="truncate text-base font-black text-white">{stat.value}</div>
              <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-wider text-white/40">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/dashboard/statistics"
          className="mt-3 inline-block text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-primary"
        >
          {t("dashboard.see_stats")} ›
        </Link>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-black/20 px-5 py-3">
        <p className="min-w-0 truncate text-xs text-white/50">
          <span className="font-bold text-white/85">{downloadedCount}</span>
          <span className="text-white/30"> / </span>
          <span>{availableCount || "—"}</span>
          <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-white/35">
            {t("dashboard.downloaded_versions_label")}
          </span>
        </p>
        <Link
          to="/dashboard/versions"
          className="shrink-0 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-primary"
        >
          {t("dashboard.see_all_versions")} ›
        </Link>
      </div>
    </div>
  );
}
