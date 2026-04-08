import { useEffect, useState } from "react";
import { FiArrowLeft, FiShield, FiTarget, FiTrendingUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/atoms/Card";
import { useLauncherStore } from "../../application/store/useLauncherStore";
import { useTranslation } from "react-i18next";

const formatPlaytime = (seconds: number): string => {
  if (seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours <= 0) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
};

export function StatisticsDetails() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const detailedStatistics = useLauncherStore((state) => state.detailedStatistics);
  const fetchDetailedStatistics = useLauncherStore((state) => state.fetchDetailedStatistics);
  const [isLoading, setIsLoading] = useState(detailedStatistics === null);

  useEffect(() => {
    if (detailedStatistics !== null) return;
    setIsLoading(true);
    void fetchDetailedStatistics().finally(() => setIsLoading(false));
  }, [fetchDetailedStatistics, detailedStatistics]);

  const summary = detailedStatistics?.summary;
  const worlds = detailedStatistics?.worlds ?? [];

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
            {t("dashboard.statistics_title")}
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
        <div className="grid grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="h-36 animate-pulse bg-surfaceLight/30" />
          ))}
        </div>
        <Card className="h-64 animate-pulse bg-surfaceLight/30" />
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
            {t("dashboard.statistics_title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-textMuted">
            {t("dashboard.statistics_subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { key: "mob_kills", value: summary?.mob_kills?.toLocaleString() ?? "0" },
          { key: "hours_played", value: formatPlaytime(summary?.play_seconds ?? 0) },
          { key: "deaths", value: summary?.deaths?.toLocaleString() ?? "0" },
          { key: "blocks_mined", value: summary?.blocks_mined?.toLocaleString() ?? "0" },
        ].map((item) => (
          <Card key={item.key} className="flex flex-col gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
              {t(`dashboard.${item.key}`)}
            </span>
            <span className="text-3xl font-black text-textMain">{item.value}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="flex flex-col gap-4">
          <FiTarget className="text-2xl text-primary" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.kill_death_ratio")}
          </span>
          <strong className="text-4xl font-black text-textMain">
            {summary?.kill_death_ratio ?? 0}
          </strong>
        </Card>
        <Card className="flex flex-col gap-4">
          <FiTrendingUp className="text-2xl text-primary" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.blocks_per_hour")}
          </span>
          <strong className="text-4xl font-black text-textMain">
            {summary?.blocks_per_hour ?? 0}
          </strong>
        </Card>
        <Card className="flex flex-col gap-4">
          <FiShield className="text-2xl text-primary" />
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.worlds_tracked")}
          </span>
          <strong className="text-4xl font-black text-textMain">
            {summary?.worlds_tracked ?? 0}
          </strong>
        </Card>
      </div>

      <Card className="flex flex-col gap-5">
        <div>
          <h2 className="text-lg font-black uppercase tracking-[0.18em] text-textMain">
            {t("dashboard.world_breakdown")}
          </h2>
          <p className="mt-2 text-sm text-textMuted">
            {t("dashboard.world_breakdown_desc")}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {worlds.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-black/10 bg-surfaceLight/50 px-4 py-6 text-sm text-textMuted">
              {t("dashboard.no_world_stats")}
            </div>
          ) : (
            worlds.map((world) => (
              <div
                key={world.world_name}
                className="grid grid-cols-[1.2fr,0.8fr,0.8fr,0.8fr,0.8fr] items-center gap-4 rounded-2xl border border-black/5 bg-surfaceLight/60 px-4 py-4"
              >
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.18em] text-textMain">
                    {world.world_name}
                  </div>
                  <div className="mt-1 text-xs text-textMuted">
                    {world.last_played_at
                      ? new Intl.DateTimeFormat(i18n.language, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(world.last_played_at))
                      : t("dashboard.no_data")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-textMain">{world.mob_kills.toLocaleString()}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-textMuted">
                    {t("dashboard.mob_kills")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-textMain">{world.deaths.toLocaleString()}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-textMuted">
                    {t("dashboard.deaths")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-textMain">{world.blocks_mined.toLocaleString()}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-textMuted">
                    {t("dashboard.blocks_mined")}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-primary">{formatPlaytime(world.play_seconds)}</div>
                  <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.25em] text-textMuted">
                    {t("dashboard.hours_played")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
