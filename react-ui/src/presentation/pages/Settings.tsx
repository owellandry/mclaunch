import { useRef, useState } from "react";
import { FiLogOut, FiSave, FiTrash2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/application/store/useAppStore";
import { useNotificationStore } from "@/application/store/useNotificationStore";
import { Button, PageHeader, Panel } from "@/presentation/design-system";
import { MinecraftAvatar } from "@/presentation/components/minecraft/MinecraftAvatar";
import { getLogoSrc } from "@/presentation/constants/logoAssets";

export function Settings() {
  const config = useAppStore((state) => state.config);
  const setConfig = useAppStore((state) => state.setConfig);
  const profile = useAppStore((state) => state.profile);
  const logo = useAppStore((state) => state.logo);
  const setLogo = useAppStore((state) => state.setLogo);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const logoutMicrosoft = useAppStore((state) => state.logoutMicrosoft);
  const clearAll = useAppStore((state) => state.clearAll);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const availableLogos = [
    { id: "logo_gren.svg", name: t("settings.green") },
    { id: "logo_blue.svg", name: t("settings.blue") },
    { id: "logo_lemon.svg", name: t("settings.lemon") },
    { id: "logo_purple.svg", name: t("settings.purple") },
    { id: "logo_yellow.svg", name: t("settings.yellow") },
  ];

  const [memory, setMemory] = useState(config.memoryMb);
  const [gameDir, setGameDir] = useState(config.gameDir);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-4 py-3 font-mono text-sm text-white outline-none transition-colors focus:border-primary/50";

  const handleSave = () => {
    setConfig({ ...config, memoryMb: memory, gameDir });
    setIsSaved(true);
    addNotification(t("settings.settings_saved"), t("settings.settings_saved_desc"), "success");
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setIsSaved(false), 2000);
  };

  const handleClearCache = async () => {
    if (window.api) {
      await window.api.clearCache();
      addNotification(t("settings.cache_cleared"), t("settings.cache_cleared_desc"), "success");
    }
  };

  const handleClearAllData = async () => {
    if (confirm(t("settings.confirm_clear"))) {
      addNotification(t("settings.deep_clean"), t("settings.deep_clean_desc"), "warning");
      clearAll();
      if (window.api) {
        await window.api.clearAllData();
        window.api.restartApp();
      }
    }
  };

  const handleLogout = async () => {
    addNotification(t("settings.logout"), t("settings.logout_desc"), "warning");
    await logoutMicrosoft();
    navigate("/onboarding");
  };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("settings.core_config")}
        title={t("settings.launcher_settings")}
        description={t("settings.sys_resources")}
        action={
          <Button variant={isSaved ? "primary" : "secondary"} onClick={handleSave} icon={<FiSave />}>
            {isSaved ? t("settings.saved") : t("settings.save_changes")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Panel className="xl:col-span-7 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {t("settings.ram_allocation")}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={memory}
                onChange={(e) => setMemory(Number(e.target.value))}
                className="flex-1 accent-primary"
              />
              <span className="w-24 rounded-xl border border-white/10 bg-[var(--surface-dashboard)] px-3 py-2 text-center font-mono text-sm text-primary">
                {memory} MB
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {t("settings.base_dir")}
            </label>
            <input
              type="text"
              value={gameDir}
              onChange={(e) => setGameDir(e.target.value)}
              className={fieldClass}
            />
          </div>

          <div className="space-y-2 border-t border-white/10 pt-5">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {t("settings.language")}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={`${fieldClass} appearance-none`}
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>

          <div className="space-y-3 border-t border-white/10 pt-5">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {t("settings.visual_customization")}
            </label>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
              {availableLogos.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setLogo(item.id)}
                  className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-2 transition-all ${
                    logo === item.id
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/[0.03] hover:border-white/20"
                  }`}
                >
                  <img src={getLogoSrc(item.id)} alt={item.name} className="h-10 w-10 object-contain" />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/50">
                    {item.name.split(" ")[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 pt-5">
            <Button variant="secondary" onClick={handleClearCache} icon={<FiTrash2 />}>
              {t("settings.clear_cache")}
            </Button>
            <Button variant="danger" onClick={handleClearAllData} icon={<FiTrash2 />}>
              {t("settings.clear_all_data")}
            </Button>
          </div>
        </Panel>

        <div className="xl:col-span-5 flex flex-col gap-4">
          <Panel className="space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-hero-eyebrow)]">
              {t("settings.status")}
            </p>
            <h2 className="text-lg font-black text-white">{t("settings.summary")}</h2>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-[var(--surface-dashboard)] p-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {t("settings.active_pilot")}
                </span>
                <div className="flex items-center gap-3">
                  <MinecraftAvatar
                    username={profile?.username || "Player"}
                    uuid={profile?.uuid}
                    skinUrl={profile?.skinUrl}
                    size={36}
                  />
                  <strong className="text-sm font-bold uppercase tracking-wider text-white">
                    {profile?.username}
                  </strong>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-[var(--surface-dashboard)] p-3">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {t("settings.startup")}
                </span>
                <strong className="text-sm font-bold uppercase tracking-wider text-primary">
                  {t("settings.completed")}
                </strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-[var(--surface-dashboard)] p-3 sm:col-span-2">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                  {t("settings.base_version")}
                </span>
                <strong className="font-mono text-sm text-white">{config.version || "—"}</strong>
              </div>
            </div>

            <Button variant="danger" onClick={handleLogout} className="w-full py-3" icon={<FiLogOut />}>
              {t("settings.logout")}
            </Button>
          </Panel>
        </div>
      </div>
    </div>
  );
}
