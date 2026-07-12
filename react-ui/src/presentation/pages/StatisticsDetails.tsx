import { useEffect, useState } from "react";
import { FiShield, FiTarget, FiTrendingUp } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLauncherStore } from "@/application/store/useLauncherStore";
import { BackLink, EmptyState, PageHeader, Panel, StatTile } from "@/presentation/design-system";

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
  const back = (
    <BackLink label={t("dashboard.details_back")} onClick={() => navigate("/dashboard")} />
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader back={back} title={t("dashboard.statistics_title")} />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Panel key={i} className="h-24 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={back}
        title={t("dashboard.statistics_title")}
        description={t("dashboard.statistics_subtitle")}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { key: "mob_kills", value: summary?.mob_kills?.toLocaleString() ?? "0" },
          { key: "hours_played", value: formatPlaytime(summary?.play_seconds ?? 0) },
          { key: "deaths", value: summary?.deaths?.toLocaleString() ?? "0" },
          { key: "blocks_mined", value: summary?.blocks_mined?.toLocaleString() ?? "0" },
        ].map((item) => (
          <StatTile key={item.key} label={t(`dashboard.${item.key}`)} value={item.value} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <StatTile
          icon={<FiTarget />}
          label={t("dashboard.kill_death_ratio")}
          value={summary?.kill_death_ratio ?? 0}
        />
        <StatTile
          icon={<FiTrendingUp />}
          label={t("dashboard.blocks_per_hour")}
          value={summary?.blocks_per_hour ?? 0}
        />
        <StatTile
          icon={<FiShield />}
          label={t("dashboard.worlds_tracked")}
          value={summary?.worlds_tracked ?? 0}
        />
      </div>

      <Panel className="flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            {t("dashboard.world_breakdown")}
          </h2>
          <p className="mt-2 text-sm text-white/50">{t("dashboard.world_breakdown_desc")}</p>
        </div>

        <div className="flex flex-col gap-2">
          {worlds.length === 0 ? (
            <EmptyState label={t("dashboard.no_world_stats")} />
          ) : (
            worlds.map((world) => (
              <div
                key={world.world_name}
                className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-4 py-4 md:grid-cols-[1.2fr,0.7fr,0.7fr,0.7fr,0.7fr]"
              >
                <div className="col-span-2 md:col-span-1">
                  <div className="text-sm font-black uppercase tracking-[0.14em] text-white">
                    {world.world_name}
                  </div>
                  <div className="mt-1 text-xs text-white/40">
                    {world.last_played_at
                      ? new Intl.DateTimeFormat(i18n.language, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(world.last_played_at))
                      : t("dashboard.no_data")}
                  </div>
                </div>
                {[
                  { label: t("dashboard.mob_kills"), value: world.mob_kills.toLocaleString() },
                  { label: t("dashboard.deaths"), value: world.deaths.toLocaleString() },
                  { label: t("dashboard.blocks_mined"), value: world.blocks_mined.toLocaleString() },
                  {
                    label: t("dashboard.hours_played"),
                    value: formatPlaytime(world.play_seconds),
                    accent: true,
                  },
                ].map((cell) => (
                  <div key={cell.label}>
                    <div
                      className={`text-lg font-black ${cell.accent ? "text-primary" : "text-white"}`}
                    >
                      {cell.value}
                    </div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
                      {cell.label}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
