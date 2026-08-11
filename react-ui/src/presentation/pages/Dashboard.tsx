import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLauncherStore } from "@/application/store/useLauncherStore";
import { useAppStore } from "@/application/store/useAppStore";
import { getLatestRelease } from "@/core/domain/launcher";
import { getVersionArt } from "@/core/domain/versionArt";
import heroFallback from "@/assets/hero.png";
import { DashboardContent } from "@/presentation/features/dashboard/DashboardContent";

function resolveLaunchLabel(
  status: string,
  isInstalled: boolean,
  progress: { percentage: number } | null,
  t: (key: string, opts?: Record<string, unknown>) => string,
): string {
  if (status === "playing") return t("dashboard.playing");
  if (status === "running") {
    if (progress && progress.percentage < 100 && !isInstalled) {
      return t("dashboard.downloading", { percent: progress.percentage });
    }
    return t("dashboard.starting");
  }
  if (!isInstalled) return t("dashboard.download");
  return t("dashboard.play");
}

export function Dashboard() {
  const { t } = useTranslation();
  const status = useLauncherStore((state) => state.status);
  const launch = useLauncherStore((state) => state.launch);
  const progress = useLauncherStore((state) => state.progress);
  const availableVersions = useLauncherStore((state) => state.availableVersions);
  const downloadedVersions = useLauncherStore((state) => state.downloadedVersions);
  const weeklyActivity = useLauncherStore((state) => state.weeklyActivity);
  const statistics = useLauncherStore((state) => state.statistics);

  const config = useAppStore((state) => state.config);

  const versionId = useMemo(() => {
    return config.version || getLatestRelease(availableVersions);
  }, [config.version, availableVersions]);

  const versionMeta = useMemo(() => {
    return availableVersions.find((v) => v.id === versionId);
  }, [availableVersions, versionId]);

  const isInstalled = downloadedVersions.includes(versionId);
  const isBusy = status === "running" || status === "playing";
  const heroBgImage = getVersionArt(versionId) || heroFallback;

  const launchLabel = resolveLaunchLabel(status, isInstalled, progress, t);

  return (
    <DashboardContent
      heroBgImage={heroBgImage}
      versionId={versionId}
      versionType={versionMeta?.type ?? "release"}
      isInstalled={isInstalled}
      memoryMb={config.memoryMb}
      hoursPlayed={statistics.hours_played}
      isLaunchDisabled={isBusy}
      launchLabel={launchLabel}
      onLaunch={launch}
      weeklyActivity={weeklyActivity}
      mobKills={statistics.mob_kills}
      deaths={statistics.deaths}
      blocksMined={statistics.blocks_mined}
      downloadedCount={downloadedVersions.length}
      availableCount={availableVersions.length}
    />
  );
}
