import { useEffect, useState } from "react";
import { FiArrowLeft, FiClock, FiTrendingUp, FiZap } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/atoms/Card";
import { useLauncherStore } from "../../application/store/useLauncherStore";
import { useTranslation } from "react-i18next";

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

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-textMuted transition-colors hover:text-textMain"
          >
            <FiArrowLeft />
            {t("dashboard.details_back")}
          </button>
          <h1 className="text-4xl font-black uppercase tracking-tight text-textMain">
            {t("dashboard.activity_title")}
          </h1>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col gap-2">
              <div className="h-3 w-24 animate-pulse rounded bg-black/10" />
              <div className="h-8 w-16 animate-pulse rounded bg-black/10" />
            </Card>
          ))}
        </div>
        <Card className="h-72 animate-pulse bg-surfaceLight/30" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mb-4 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-textMuted transition-colors hover:text-textMain"
          >
            <FiArrowLeft />
            {t("dashboard.details_back")}
          </button>
          <h1 className="text-4xl font-black uppercase tracking-tight text-textMain">
            {t("dashboard.activity_title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-textMuted">
            {t("dashboard.activity_subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.total_last_7_days")}
          </span>
          <span className="text-3xl font-black text-textMain">
            {formatDuration(summary?.total_seconds_last_7_days ?? 0)}
          </span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.average_day")}
          </span>
          <span className="text-3xl font-black text-textMain">
            {formatDuration(summary?.average_seconds_last_7_days ?? 0)}
          </span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.current_streak")}
          </span>
          <span className="text-3xl font-black text-textMain">
            {summary?.current_streak_days ?? 0}
          </span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.active_days")}
          </span>
          <span className="text-3xl font-black text-textMain">
            {summary?.active_days_last_30_days ?? 0}
          </span>
        </Card>
      </div>

      <Card className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.18em] text-textMain">
              {t("dashboard.last_30_days")}
            </h2>
            <p className="mt-2 text-sm text-textMuted">
              {t("dashboard.last_30_days_desc")}
            </p>
          </div>
          <div className="rounded-2xl border border-black/5 bg-surfaceLight/60 px-4 py-3 text-right">
            <span className="block text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
              {t("dashboard.total_all_time")}
            </span>
            <span className="text-2xl font-black text-textMain">
              {formatDuration(summary?.total_seconds_all_time ?? 0)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),220px]">
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[720px] rounded-[28px] border border-black/5 bg-surfaceLight/45 px-4 py-5">
              <div className="relative h-72">
                <div className="pointer-events-none absolute inset-0 bottom-8">
                  {[0, 1, 2, 3].map((line) => (
                    <div
                      key={line}
                      className="absolute left-0 right-0 border-t border-dashed border-black/10"
                      style={{ bottom: `${(line / 3) * 100}%` }}
                    />
                  ))}
                </div>

                <div className="relative flex h-full items-end gap-2">
                  {entries.map((entry, index) => {
                    const date = new Date(`${entry.date}T00:00:00`);
                    const height = entry.playTime <= 0 ? 8 : Math.max(24, Math.round((entry.playTime / maxPlayTime) * 100));
                    const isActive = entry.playTime > 0;
                    const showLabel = index === 0 || index === entries.length - 1 || index % labelStep === 0;

                    return (
                      <div key={entry.date} className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-3">
                        <div className="relative flex-1">
                          <div className="absolute inset-x-0 bottom-0 h-full rounded-[20px] border border-black/5 bg-white/45" />
                          <div
                            className={`absolute inset-x-[3px] bottom-[3px] rounded-b-[14px] transition-all duration-200 group-hover:brightness-105 ${
                              isActive
                                ? "rounded-t-[14px] bg-gradient-to-t from-primary via-primary to-primary/70 shadow-[0_8px_22px_var(--color-primary-shadow)]"
                                : "h-[8px] rounded-t-[10px] bg-black/10"
                            }`}
                            style={isActive ? { height: `${height}%` } : undefined}
                          />
                          <div className="pointer-events-none absolute -top-3 left-1/2 z-10 -translate-x-1/2 rounded-xl bg-black/85 px-3 py-2 text-center text-[10px] font-mono text-white opacity-0 shadow-xl transition-opacity group-hover:opacity-100">
                            <div>{formatDuration(entry.playTime)}</div>
                            <div className="mt-1 text-[9px] uppercase tracking-[0.2em] text-white/70">
                              {new Intl.DateTimeFormat(i18n.language, {
                                day: "2-digit",
                                month: "short",
                              }).format(date)}
                            </div>
                          </div>
                        </div>
                        <span className="h-4 text-center text-[10px] font-bold uppercase tracking-[0.22em] text-textMuted">
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

          <div className="grid gap-3">
            <div className="rounded-2xl border border-black/5 bg-surfaceLight/60 px-4 py-4">
              <span className="block text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
                {t("dashboard.best_day")}
              </span>
              <strong className="mt-3 block text-2xl font-black text-textMain">
                {peakEntry ? formatDuration(peakEntry.playTime) : "0m"}
              </strong>
              <span className="mt-2 block text-xs text-textMuted">
                {peakEntry
                  ? new Intl.DateTimeFormat(i18n.language, {
                      day: "2-digit",
                      month: "long",
                    }).format(new Date(`${peakEntry.date}T00:00:00`))
                  : t("dashboard.no_data")}
              </span>
            </div>

            <div className="rounded-2xl border border-black/5 bg-surfaceLight/60 px-4 py-4">
              <span className="block text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
                {t("dashboard.active_days")}
              </span>
              <strong className="mt-3 block text-2xl font-black text-textMain">
                {summary?.active_days_last_30_days ?? 0}
              </strong>
              <span className="mt-2 block text-xs text-textMuted">
                {t("dashboard.total_last_30_days")}: {formatDuration(summary?.total_seconds_last_30_days ?? 0)}
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-[1.2fr,0.8fr] gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-black uppercase tracking-[0.18em] text-textMain">
            {t("dashboard.activity_highlights")}
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-black/5 bg-surfaceLight/60 p-4">
              <FiClock className="mb-3 text-xl text-primary" />
              <span className="block text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
                {t("dashboard.total_last_30_days")}
              </span>
              <strong className="mt-2 block text-2xl font-black text-textMain">
                {formatDuration(summary?.total_seconds_last_30_days ?? 0)}
              </strong>
            </div>
            <div className="rounded-2xl border border-black/5 bg-surfaceLight/60 p-4">
              <FiTrendingUp className="mb-3 text-xl text-primary" />
              <span className="block text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
                {t("dashboard.longest_streak")}
              </span>
              <strong className="mt-2 block text-2xl font-black text-textMain">
                {summary?.longest_streak_days ?? 0}
              </strong>
            </div>
            <div className="rounded-2xl border border-black/5 bg-surfaceLight/60 p-4">
              <FiZap className="mb-3 text-xl text-primary" />
              <span className="block text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
                {t("dashboard.best_day")}
              </span>
              <strong className="mt-2 block text-lg font-black text-textMain">
                {summary?.best_day ? formatDuration(summary.best_day.playTime) : "0m"}
              </strong>
              <span className="mt-1 block text-xs text-textMuted">
                {summary?.best_day
                  ? new Intl.DateTimeFormat(i18n.language, {
                      day: "2-digit",
                      month: "long",
                    }).format(new Date(`${summary.best_day.date}T00:00:00`))
                  : t("dashboard.no_data")}
              </span>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-black uppercase tracking-[0.18em] text-textMain">
            {t("dashboard.recent_activity")}
          </h2>
          <div className="flex flex-col gap-3">
            {activeEntries.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-surfaceLight/50 px-4 py-6 text-sm text-textMuted">
                {t("dashboard.no_activity_records")}
              </div>
            ) : (
              activeEntries.slice(0, 8).map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-surfaceLight/60 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-textMain">
                      {new Intl.DateTimeFormat(i18n.language, {
                        weekday: "long",
                        day: "2-digit",
                        month: "long",
                      }).format(new Date(`${entry.date}T00:00:00`))}
                    </div>
                    <div className="mt-1 text-xs text-textMuted">{entry.date}</div>
                  </div>
                  <strong className="text-lg font-black text-primary">{formatDuration(entry.playTime)}</strong>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
