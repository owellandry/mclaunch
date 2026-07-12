import { useEffect, useState } from "react";
import { FiClock, FiTrendingUp, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLauncherStore } from "@/application/store/useLauncherStore";
import { BackLink, EmptyState, PageHeader, Panel, StatTile } from "@/presentation/design-system";

const formatDuration = (seconds: number): string => {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

export function ActivityDetails() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const activityDetails = useLauncherStore((state) => state.activityDetails);
  const fetchActivityDetails = useLauncherStore((state) => state.fetchActivityDetails);
  const [isLoading, setIsLoading] = useState(activityDetails === null);

  useEffect(() => {
    if (activityDetails !== null) return;
    setIsLoading(true);
    void fetchActivityDetails().finally(() => setIsLoading(false));
  }, [fetchActivityDetails, activityDetails]);

  const entries = activityDetails?.entries ?? [];
  const summary = activityDetails?.summary;
  const maxPlayTime = Math.max(...entries.map((entry) => entry.playTime), 1);
  const activeEntries = [...entries].filter((entry) => entry.playTime > 0).reverse();
  const peakEntry = entries.reduce<(typeof entries)[number] | null>((best, entry) => {
    if (!best || entry.playTime > best.playTime) return entry;
    return best;
  }, null);
  const labelStep = entries.length > 20 ? 5 : 3;

  const back = (
    <BackLink label={t("dashboard.details_back")} onClick={() => navigate("/dashboard")} />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader back={back} title={t("dashboard.activity_title")} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Panel key={i} className="h-24 animate-pulse" />
          ))}
        </div>
        <Panel className="h-72 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={t("dashboard.activity_title")}
        description={t("dashboard.activity_subtitle")}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label={t("dashboard.total_last_7_days")} value={formatDuration(summary?.total_seconds_last_7_days ?? 0)} />
        <StatTile label={t("dashboard.average_day")} value={formatDuration(summary?.average_seconds_last_7_days ?? 0)} />
        <StatTile label={t("dashboard.current_streak")} value={summary?.current_streak_days ?? 0} />
        <StatTile label={t("dashboard.active_days")} value={summary?.active_days_last_30_days ?? 0} />
      </div>

      <Panel className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
              {t("dashboard.last_30_days")}
            </h2>
            <p className="mt-2 text-sm text-white/50">{t("dashboard.last_30_days_desc")}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-4 py-3 text-right">
            <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {t("dashboard.total_all_time")}
            </span>
            <span className="text-xl font-black text-white">
              {formatDuration(summary?.total_seconds_all_time ?? 0)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),200px]">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[640px] rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-4 py-5">
              <div className="relative h-64">
                <div className="pointer-events-none absolute inset-0 bottom-8">
                  {[0, 1, 2, 3].map((line) => (
                    <div
                      key={line}
                      className="absolute left-0 right-0 border-t border-dashed border-white/10"
                      style={{ bottom: `${(line / 3) * 100}%` }}
                    />
                  ))}
                </div>
                <div className="relative flex h-full items-end gap-2">
                  {entries.map((entry, index) => {
                    const date = new Date(`${entry.date}T00:00:00`);
                    const height =
                      entry.playTime <= 0
                        ? 8
                        : Math.max(24, Math.round((entry.playTime / maxPlayTime) * 100));
                    const isActive = entry.playTime > 0;
                    const showLabel =
                      index === 0 || index === entries.length - 1 || index % labelStep === 0;

                    return (
                      <div key={entry.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-x-0 bottom-0 h-full rounded-xl border border-white/5 bg-white/[0.04]" />
                          <div
                            className={`absolute inset-x-[3px] bottom-[3px] transition-all duration-200 group-hover:brightness-105 ${
                              isActive
                                ? "rounded-t-lg rounded-b-lg bg-gradient-to-t from-primary via-primary to-primary/70"
                                : "h-[8px] rounded-t-md bg-white/10"
                            }`}
                            style={isActive ? { height: `${height}%` } : undefined}
                          />
                          <div className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-black/85 px-3 py-2 text-center text-[10px] font-mono text-white opacity-0 transition-opacity group-hover:opacity-100">
                            <div>{formatDuration(entry.playTime)}</div>
                          </div>
                        </div>
                        <span className="h-4 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                          {showLabel
                            ? new Intl.DateTimeFormat(i18n.language, {
                                day: "2-digit",
                                month: "2-digit",
                              }).format(date)
                            : ""}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 content-start">
            <StatTile
              label={t("dashboard.best_day")}
              value={peakEntry ? formatDuration(peakEntry.playTime) : "0m"}
              hint={
                peakEntry
                  ? new Intl.DateTimeFormat(i18n.language, {
                      day: "2-digit",
                      month: "long",
                    }).format(new Date(`${peakEntry.date}T00:00:00`))
                  : t("dashboard.no_data")
              }
            />
            <StatTile
              label={t("dashboard.active_days")}
              value={summary?.active_days_last_30_days ?? 0}
              hint={`${t("dashboard.total_last_30_days")}: ${formatDuration(summary?.total_seconds_last_30_days ?? 0)}`}
            />
          </div>
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr,0.8fr]">
        <Panel className="flex flex-col gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            {t("dashboard.activity_highlights")}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile
              icon={<FiClock />}
              label={t("dashboard.total_last_30_days")}
              value={formatDuration(summary?.total_seconds_last_30_days ?? 0)}
            />
            <StatTile
              icon={<FiTrendingUp />}
              label={t("dashboard.longest_streak")}
              value={summary?.longest_streak_days ?? 0}
            />
            <StatTile
              icon={<FiZap />}
              label={t("dashboard.best_day")}
              value={summary?.best_day ? formatDuration(summary.best_day.playTime) : "0m"}
            />
          </div>
        </Panel>

        <Panel className="flex flex-col gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            {t("dashboard.recent_activity")}
          </h2>
          <div className="flex flex-col gap-2">
            {activeEntries.length === 0 ? (
              <EmptyState label={t("dashboard.no_activity_records")} />
            ) : (
              activeEntries.slice(0, 8).map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-4 py-3"
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.14em] text-white">
                      {new Intl.DateTimeFormat(i18n.language, {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      }).format(new Date(`${entry.date}T00:00:00`))}
                    </div>
                    <div className="mt-1 text-[11px] text-white/40">{entry.date}</div>
                  </div>
                  <strong className="text-sm font-black text-primary">
                    {formatDuration(entry.playTime)}
                  </strong>
                </div>
              ))
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}
