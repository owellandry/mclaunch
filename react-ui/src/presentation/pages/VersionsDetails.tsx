import { useEffect, useMemo } from "react";
import { FiCheckCircle, FiClock, FiDownloadCloud } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLauncherStore } from "@/application/store/useLauncherStore";
import { useAppStore } from "@/application/store/useAppStore";
import { BackLink, EmptyState, PageHeader, Panel, StatTile } from "@/presentation/design-system";

export function VersionsDetails() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const versionCatalog = useLauncherStore((state) => state.versionCatalog);
  const fetchVersionCatalog = useLauncherStore((state) => state.fetchVersionCatalog);
  const config = useAppStore((state) => state.config);
  const setConfig = useAppStore((state) => state.setConfig);

  useEffect(() => {
    void fetchVersionCatalog();
  }, [fetchVersionCatalog]);

  const versions = versionCatalog?.versions ?? [];
  const installedVersions = useMemo(
    () => versions.filter((version) => version.installed),
    [versions],
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        back={
          <BackLink label={t("dashboard.details_back")} onClick={() => navigate("/dashboard")} />
        }
        title={t("dashboard.versions_title")}
        description={t("dashboard.versions_subtitle")}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label={t("dashboard.available_versions_label")}
          value={versionCatalog?.summary.available_versions ?? 0}
        />
        <StatTile
          label={t("dashboard.downloaded_versions_label")}
          value={versionCatalog?.summary.downloaded_versions ?? 0}
        />
        <StatTile label={t("dashboard.selected_version_label")} value={config.version || "—"} />
        <StatTile
          label={t("dashboard.latest_download_label")}
          value={
            versionCatalog?.summary.latest_downloaded_at
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(versionCatalog.summary.latest_downloaded_at))
              : t("dashboard.no_data")
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.85fr,1.15fr]">
        <Panel className="flex flex-col gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            {t("dashboard.downloaded_versions_label")}
          </h2>
          <div className="flex flex-col gap-2">
            {installedVersions.length === 0 ? (
              <EmptyState label={t("dashboard.no_versions_downloaded")} />
            ) : (
              installedVersions.slice(0, 10).map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.14em] text-white">
                      {version.id}
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {version.installedAt
                        ? new Intl.DateTimeFormat(i18n.language, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(version.installedAt))
                        : t("dashboard.no_data")}
                    </div>
                  </div>
                  <FiCheckCircle className="text-lg text-primary" />
                </div>
              ))
            )}
          </div>
        </Panel>

        <Panel className="flex flex-col gap-4">
          <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
            {t("dashboard.all_versions")}
          </h2>
          <div className="flex max-h-[34rem] flex-col gap-2 overflow-y-auto pr-1">
            {versions.map((version) => {
              const isSelected = version.id === config.version;
              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setConfig({ ...config, version: version.id })}
                  className={`grid grid-cols-1 items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors cursor-pointer sm:grid-cols-[1fr,auto,auto] ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-[var(--surface-dashboard)] hover:border-white/20"
                  }`}
                >
                  <div>
                    <div
                      className={`text-sm font-black uppercase tracking-[0.14em] ${
                        isSelected ? "text-primary" : "text-white"
                      }`}
                    >
                      Minecraft {version.id}
                    </div>
                    <div className="mt-1 text-xs text-white/40">
                      {new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(
                        new Date(version.releaseTime),
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
                    <FiClock />
                    {version.type}
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] w-fit ${
                      version.installed
                        ? "bg-primary/15 text-primary"
                        : "bg-white/5 text-white/45"
                    }`}
                  >
                    {version.installed ? <FiDownloadCloud /> : null}
                    {version.installed
                      ? t("dashboard.installed_version")
                      : t("dashboard.available_version")}
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>
      </div>
    </div>
  );
}
