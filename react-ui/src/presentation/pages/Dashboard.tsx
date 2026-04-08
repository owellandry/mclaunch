/**
 * @file Dashboard.tsx
 * @description Página principal Dashboard. Punto de entrada post-login, muestra actividad, progreso de descarga y botón principal de Jugar.
 * 
 * Patrón: Atomic Design
 */
import { useDeferredValue, useMemo } from "react";
import { FiPlay } from "react-icons/fi";
import { useLauncherStore } from "../../application/store/useLauncherStore";
import { useAppStore } from "../../application/store/useAppStore";
import { useNotificationStore } from "../../application/store/useNotificationStore";
import { Card } from "../components/atoms/Card";
import { Button } from "../components/atoms/Button";
import { useTranslation } from "react-i18next";
import heroImage from "../../assets/hero.png";

export function Dashboard() {
  const { t, i18n } = useTranslation();
  const status = useLauncherStore((state) => state.status);
  const launch = useLauncherStore((state) => state.launch);
  const availableVersions = useLauncherStore((state) => state.availableVersions);
  const downloadedVersions = useLauncherStore((state) => state.downloadedVersions);
  const launchedVersionWasDownloaded = useLauncherStore((state) => state.launchedVersionWasDownloaded);
  const weeklyActivity = useLauncherStore((state) => state.weeklyActivity);
  const statistics = useLauncherStore((state) => state.statistics);
  const progress = useLauncherStore((state) => state.progress);
  const homeBanners = useLauncherStore((state) => state.homeBanners);
  const config = useAppStore((state) => state.config);
  const setConfig = useAppStore((state) => state.setConfig);
  const searchQuery = useAppStore((state) => state.searchQuery);
  const isRunning = status === "running";
  const isPlaying = status === "playing";
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const selectedVersion = config.version || "1.20.1";
  const isDownloaded = downloadedVersions.includes(selectedVersion);
  const featuredBanner = homeBanners[0] ?? null;
  const heroTitle = featuredBanner?.title || `Minecraft ${selectedVersion}`;
  const heroDescription = featuredBanner?.subtitle || t("dashboard.hero_desc");
  const heroImageUrl = featuredBanner?.imageUrl || heroImage;
  
  let buttonText = isDownloaded ? t("dashboard.play") : t("dashboard.download");
  if (isRunning) {
    if (!launchedVersionWasDownloaded && progress) {
      buttonText = t("dashboard.downloading", { percent: progress.percentage });
    } else {
      buttonText = t("dashboard.starting");
    }
  } else if (isPlaying) {
    buttonText = t("dashboard.playing");
  }

  const filteredVersions = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.toLowerCase();
    return availableVersions.filter((version) => version.id.toLowerCase().includes(normalizedQuery));
  }, [availableVersions, deferredSearchQuery]);

  const handleMainAction = () => {
    if (!isDownloaded) {
      useNotificationStore.getState().addNotification("Iniciando Descarga", `Se comenzó a descargar la versión ${selectedVersion}. Esto puede tardar unos minutos.`, "info");
    }
    launch();
  };

  const handleFeaturedBannerClick = () => {
    if (!featuredBanner?.targetUrl) return;
    void window.api?.openExternal?.(featuredBanner.targetUrl);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Hero Section matching Image 1 */}
      <div className="relative w-full h-[65%] overflow-hidden bg-surface rounded-2xl border border-black/10 shadow-xl">
        {/* Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] hover:scale-105"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        {/* Top Nav (Optional, matching image 1's pill buttons) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
          {[
            { key: 'games', label: 'JUEGOS' },
            { key: 'store', label: 'TIENDA' },
            { key: 'community', label: 'COMUNIDAD' },
            { key: 'support', label: 'SOPORTE' }
          ].map(nav => (
            <div key={nav.key} className="px-5 py-1.5 border border-white/40 rounded-full text-white text-xs font-bold tracking-wider backdrop-blur-md bg-black/40 hover:bg-white/20 cursor-pointer transition-colors shadow-sm">
              {t(`dashboard.${nav.key}`, nav.label)}
            </div>
          ))}
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-10 left-10 max-w-xl">
          <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest mb-4 inline-block mc-cutout-small shadow-[0_0_10px_var(--color-primary-shadow)]">
            {featuredBanner?.placement ? `${t("dashboard.featured_banner")} · ${featuredBanner.placement}` : t("dashboard.vanilla_release")}
          </span>
          <h1 className="text-5xl font-black text-textMain mb-3 uppercase tracking-tight leading-none drop-shadow-xl">
            {heroTitle}
          </h1>
          <p className="text-textMuted font-bold leading-relaxed max-w-md text-sm drop-shadow-md">
            {heroDescription}
          </p>
          {featuredBanner?.targetUrl ? (
            <button
              type="button"
              onClick={handleFeaturedBannerClick}
              className="mt-5 inline-flex items-center border border-white/20 bg-black/40 px-4 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-white transition-colors hover:bg-black/55 mc-cutout-small"
            >
              {t("dashboard.open_banner")}
            </button>
          ) : null}
        </div>

        {/* The Cutout Button Container */}
        <div 
          className="absolute bottom-0 right-0 bg-background p-6 pl-8 pt-8"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 0 100%, 40px 0)' }}
        >
          <Button
            onClick={handleMainAction}
            disabled={isRunning || isPlaying}
            className={`py-4 px-10 text-lg shadow-[0_0_20px_var(--color-primary-shadow)] relative overflow-hidden ${isRunning || isPlaying ? 'cursor-not-allowed' : ''}`}
          >
            {/* Progress Bar Background */}
            {isRunning && progress && (
              <div 
                className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            )}
            
            <span className="relative z-10 flex items-center">
              {buttonText}
              {!isRunning && !isPlaying && <FiPlay className="ml-2 fill-current" />}
            </span>
          </Button>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">

        {/* Actividad Semanal */}
        <Card className="flex flex-col min-h-0">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">{t("dashboard.weekly_activity")}</h3>
          <div className="flex items-end gap-2 flex-1 mb-3 min-h-0">
            {(() => {
              const maxSec = Math.max(...weeklyActivity, 1);
              const fmtTime = (s: number) => {
                if (s === 0) return "Sin actividad";
                const h = Math.floor(s / 3600);
                const m = Math.floor((s % 3600) / 60);
                return h > 0 ? `${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m` : `${m}m`;
              };
              return weeklyActivity.map((sec, i) => (
                <div key={i} className="flex-1 bg-surfaceLight relative group h-full">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-primary transition-all group-hover:bg-primaryHover"
                    style={{ height: `${Math.round((sec / maxSec) * 100)}%` }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black/80 text-white text-[10px] font-mono rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {fmtTime(sec)}
                  </div>
                </div>
              ));
            })()}
          </div>
          <div className="flex justify-between text-[10px] text-textMuted font-mono px-1 shrink-0">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              return (
                <span key={i}>
                  {new Intl.DateTimeFormat(i18n.language, { weekday: "short" }).format(d).replace(/\.$/, "").slice(0, 2)}
                </span>
              );
            })}
          </div>
          <button className="w-full mt-4 py-2 bg-surfaceLight text-xs font-bold text-textMain hover:bg-black/5 transition-colors uppercase tracking-wider mc-cutout-small shrink-0">
            {t("dashboard.see_full_activity")}
          </button>
        </Card>

        {/* Tus Estadísticas */}
        <Card className="flex flex-col min-h-0">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">{t("dashboard.your_stats")}</h3>
          <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
            <div className="bg-surfaceLight/50 flex flex-col justify-center items-center border border-black/5 mc-cutout-small">
              <span className="text-4xl font-black text-textMain leading-none">{statistics.win_rate}<span className="text-primary text-xl">%</span></span>
              <span className="text-[10px] text-textMuted uppercase tracking-widest text-center mt-2">{t("dashboard.win_rate")}</span>
            </div>
            <div className="bg-surfaceLight/50 flex flex-col justify-center items-center border border-black/5 mc-cutout-small">
              <span className="text-4xl font-black text-textMain leading-none">{statistics.kda}</span>
              <span className="text-[10px] text-textMuted uppercase tracking-widest text-center mt-2">{t("dashboard.kda")}</span>
            </div>
          </div>
          <button className="w-full mt-4 py-2 bg-surfaceLight text-xs font-bold text-textMain hover:bg-black/5 transition-colors uppercase tracking-wider mc-cutout-small shrink-0">
            {t("dashboard.see_stats")}
          </button>
        </Card>

        {/* Selector de Versión */}
        <Card className="flex flex-col min-h-0">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">{t("dashboard.select_version")}</h3>
          <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-2 min-h-0">
            {filteredVersions.length === 0 ? (
              <div className="text-textMuted text-xs flex items-center justify-center h-full">{t("dashboard.loading_versions")}</div>
            ) : (
              filteredVersions.map(v => (
                <div
                  key={v.id}
                  onClick={() => setConfig({ ...config, version: v.id })}
                  className={`px-4 py-3 border cursor-pointer transition-all flex justify-between items-center mc-cutout-small shrink-0 ${
                    selectedVersion === v.id
                      ? "border-primary bg-primary/10"
                      : "border-black/5 bg-surfaceLight/50 hover:bg-surfaceLight"
                  }`}
                >
                  <div>
                    <h4 className={`font-bold text-sm uppercase leading-tight ${selectedVersion === v.id ? 'text-primary' : 'text-textMain'}`}>
                      Minecraft {v.id}
                    </h4>
                    <span className="text-xs text-textMuted tracking-wide">
                      {new Date(v.releaseTime).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    className={`w-4 h-4 shrink-0 ${selectedVersion === v.id ? 'bg-primary shadow-[0_0_10px_var(--color-primary-shadow)]' : 'bg-surfaceLight border border-black/20'}`}
                    style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }}
                  />
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-4 py-2 bg-surfaceLight text-xs font-bold text-textMain hover:bg-black/5 transition-colors uppercase tracking-wider mc-cutout-small shrink-0">
            {t("dashboard.see_all_versions")}
          </button>
        </Card>

      </div>
    </div>
  );
}
