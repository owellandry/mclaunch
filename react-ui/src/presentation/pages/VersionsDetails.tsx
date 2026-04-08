import { useEffect, useMemo } from "react";
import { FiArrowLeft, FiCheckCircle, FiClock, FiDownloadCloud } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/atoms/Card";
import { useLauncherStore } from "../../application/store/useLauncherStore";
import { useAppStore } from "../../application/store/useAppStore";
import { useTranslation } from "react-i18next";

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
  const installedVersions = useMemo(() => versions.filter((version) => version.installed), [versions]);

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
            {t("dashboard.versions_title")}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-textMuted">
            {t("dashboard.versions_subtitle")}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.available_versions_label")}
          </span>
          <span className="text-3xl font-black text-textMain">
            {versionCatalog?.summary.available_versions ?? 0}
          </span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.downloaded_versions_label")}
          </span>
          <span className="text-3xl font-black text-textMain">
            {versionCatalog?.summary.downloaded_versions ?? 0}
          </span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.selected_version_label")}
          </span>
          <span className="text-3xl font-black text-primary">
            {config.version}
          </span>
        </Card>
        <Card className="flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-textMuted">
            {t("dashboard.latest_download_label")}
          </span>
          <span className="text-sm font-black text-textMain">
            {versionCatalog?.summary.latest_downloaded_at
              ? new Intl.DateTimeFormat(i18n.language, {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(new Date(versionCatalog.summary.latest_downloaded_at))
              : t("dashboard.no_data")}
          </span>
        </Card>
      </div>

      <div className="grid grid-cols-[0.8fr,1.2fr] gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-black uppercase tracking-[0.18em] text-textMain">
            {t("dashboard.downloaded_versions_label")}
          </h2>
          <div className="flex flex-col gap-3">
            {installedVersions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-black/10 bg-surfaceLight/50 px-4 py-6 text-sm text-textMuted">
                {t("dashboard.no_versions_downloaded")}
              </div>
            ) : (
              installedVersions.slice(0, 10).map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between rounded-2xl border border-black/5 bg-surfaceLight/60 px-4 py-3"
                >
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-textMain">{version.id}</div>
                    <div className="mt-1 text-xs text-textMuted">
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
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-black uppercase tracking-[0.18em] text-textMain">
            {t("dashboard.all_versions")}
          </h2>
          <div className="flex max-h-[34rem] flex-col gap-3 overflow-y-auto pr-2">
            {versions.map((version) => {
              const isSelected = version.id === config.version;
              return (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setConfig({ ...config, version: version.id })}
                  className={`grid grid-cols-[1fr,auto,auto] items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-colors ${
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-black/5 bg-surfaceLight/60 hover:bg-surfaceLight"
                  }`}
                >
                  <div>
                    <div className={`text-sm font-black uppercase tracking-[0.18em] ${isSelected ? "text-primary" : "text-textMain"}`}>
                      Minecraft {version.id}
                    </div>
                    <div className="mt-1 text-xs text-textMuted">
                      {new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium" }).format(new Date(version.releaseTime))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-textMuted">
                    <FiClock />
                    {version.type}
                  </div>
                  <div
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${
                      version.installed
                        ? "bg-primary/15 text-primary"
                        : "bg-black/5 text-textMuted"
                    }`}
                  >
                    {version.installed ? <FiDownloadCloud /> : null}
                    {version.installed ? t("dashboard.installed_version") : t("dashboard.available_version")}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
