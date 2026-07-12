import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiActivity, FiBarChart2, FiPackage } from "react-icons/fi";

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
    <div className="relative z-10 flex w-full max-w-[min(24rem,100%)] flex-col gap-3 min-w-0">
      <div className="w-full rounded-xl border border-white/15 bg-[var(--surface-trending-inactive-alpha)] p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-white">
            <FiActivity className="text-primary" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
              {t("dashboard.weekly_activity")}
            </span>
          </div>
          <span className="font-mono text-xs text-white/70">{formatSeconds(weekTotal)}</span>
        </div>
        <div className="flex h-16 items-end gap-1.5">
          {weeklyActivity.map((value, index) => {
            const height = value <= 0 ? 8 : Math.max(12, Math.round((value / max) * 100));
            return (
              <div
                key={index}
                className="flex-1 rounded-t-md bg-gradient-to-t from-primary/80 to-primary/40"
                style={{ height: `${height}%` }}
                title={formatSeconds(value)}
              />
            );
          })}
        </div>
        <Link
          to="/dashboard/activity"
          className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)] hover:text-white"
        >
          {t("dashboard.see_full_activity")} ›
        </Link>
      </div>

      <div className="w-full rounded-xl border border-white/15 bg-[var(--surface-trending-inactive-alpha)] p-4 backdrop-blur-sm">
        <div className="mb-3 flex items-center gap-2 text-white">
          <FiBarChart2 className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
            {t("dashboard.your_stats")}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t("dashboard.mob_kills"), value: mobKills.toLocaleString() },
            { label: t("dashboard.deaths"), value: deaths.toLocaleString() },
            { label: t("dashboard.blocks_mined"), value: blocksMined.toLocaleString() },
          ].map((stat) => (
            <div key={stat.label} className="min-w-0">
              <div className="truncate text-sm font-black text-white">{stat.value}</div>
              <div className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-wider text-white/45">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/dashboard/statistics"
          className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)] hover:text-white"
        >
          {t("dashboard.see_stats")} ›
        </Link>
      </div>

      <div className="w-full rounded-xl border border-white/15 bg-[var(--surface-trending-inactive-alpha)] p-4 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2 text-white">
          <FiPackage className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.18em]">
            {t("dashboard.select_version")}
          </span>
        </div>
        <p className="text-sm text-white/70">
          <span className="font-black text-white">{downloadedCount}</span>
          {" / "}
          <span className="text-white/50">{availableCount || "—"}</span>
          <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
            {t("dashboard.downloaded_versions_label")}
          </span>
        </p>
        <Link
          to="/dashboard/versions"
          className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)] hover:text-white"
        >
          {t("dashboard.see_all_versions")} ›
        </Link>
      </div>
    </div>
  );
}
