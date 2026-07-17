import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FiActivity, FiBarChart2, FiPackage } from "react-icons/fi";
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

/** Same chrome as Titlebar SearchBox: elevated surface + white/10 border + rounded-lg */
const chrome =
  "rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-2xl transition-colors hover:border-primary/50";

function formatSeconds(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function PanelBlock({
  icon,
  title,
  trailing,
  children,
}: {
  icon: ReactNode;
  title: string;
  trailing?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={`w-full min-w-0 ${chrome}`}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3 text-white">
          <span className="shrink-0 text-white/60">{icon}</span>
          <span className="truncate text-[11px] font-bold uppercase tracking-[0.18em] text-white/90">
            {title}
          </span>
        </div>
        {trailing}
      </div>
      {children}
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
    <div className="relative z-10 flex w-full max-w-[min(24rem,100%)] min-w-0 flex-col gap-2">
      <PanelBlock
        icon={<FiActivity className="text-sm" />}
        title={t("dashboard.weekly_activity")}
        trailing={
          <span className="shrink-0 font-mono text-xs text-white/50">{formatSeconds(weekTotal)}</span>
        }
      >
        <div className="flex h-14 items-end gap-1.5">
          {weeklyActivity.map((value, index) => {
            const height = value <= 0 ? 8 : Math.max(12, Math.round((value / max) * 100));
            return (
              <HoverLabel
                key={index}
                label={formatSeconds(value)}
                side="top"
                className="min-h-0 min-w-0 flex-1 self-end"
                labelClassName="normal-case tracking-normal font-mono"
              >
                <div
                  className="w-full rounded-sm bg-primary/50 transition-colors hover:bg-primary/70"
                  style={{ height: `${height}%` }}
                  aria-label={formatSeconds(value)}
                />
              </HoverLabel>
            );
          })}
        </div>
        <Link
          to="/dashboard/activity"
          className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-primary"
        >
          {t("dashboard.see_full_activity")} ›
        </Link>
      </PanelBlock>

      <PanelBlock icon={<FiBarChart2 className="text-sm" />} title={t("dashboard.your_stats")}>
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
          className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-primary"
        >
          {t("dashboard.see_stats")} ›
        </Link>
      </PanelBlock>

      <PanelBlock icon={<FiPackage className="text-sm" />} title={t("dashboard.select_version")}>
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
          className="mt-3 inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-primary"
        >
          {t("dashboard.see_all_versions")} ›
        </Link>
      </PanelBlock>
    </div>
  );
}
