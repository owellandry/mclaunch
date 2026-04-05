import { useState } from "react";
import { FiCpu, FiMonitor, FiSave, FiSliders, FiTrash2 } from "react-icons/fi";
import { useAppStore } from "../../application/store/useAppStore";
import { useNotificationStore } from "../../application/store/useNotificationStore";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";
import { useTranslation } from "react-i18next";

export function Settings() {
  const { config, setConfig, profile, logo, setLogo, language, setLanguage } = useAppStore();
  const { t } = useTranslation();

  const AVAILABLE_LOGOS = [
    { id: "logo_gren.svg", name: t("settings.green") },
    { id: "logo_blue.svg", name: t("settings.blue") },
    { id: "logo_lemon.svg", name: t("settings.lemon") },
    { id: "logo_purple.svg", name: t("settings.purple") },
    { id: "logo_yellow.svg", name: t("settings.yellow") },
  ];
  const [memory, setMemory] = useState(config.memoryMb);
  const [gameDir, setGameDir] = useState(config.gameDir);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setConfig({ ...config, memoryMb: memory, gameDir });
    setIsSaved(true);
    useNotificationStore.getState().addNotification(t("settings.settings_saved"), t("settings.settings_saved_desc"), "success");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const { clearAll } = useAppStore();

  const handleClearCache = async () => {
    if (window.api) {
      await window.api.clearCache();
      useNotificationStore.getState().addNotification(t("settings.cache_cleared"), t("settings.cache_cleared_desc"), "success");
    }
  };

  const handleClearAllData = async () => {
    if (confirm(t("settings.confirm_clear"))) {
      useNotificationStore.getState().addNotification(t("settings.deep_clean"), t("settings.deep_clean_desc"), "warning");
      clearAll();
      if (window.api) {
        await window.api.clearAllData();
        window.api.restartApp();
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7">
          <Card className="h-full">
            <SectionTitle
              eyebrow={t("settings.core_config")}
              title={t("settings.launcher_settings")}
              subtitle={t("settings.sys_resources")}
              icon={<FiSliders />}
              action={
                <Button onClick={handleSave} icon={<FiSave />} className={isSaved ? "bg-primary text-black" : "btn-secondary mc-button-cutout"}>
                  {isSaved ? t("settings.saved") : t("settings.save_changes")}
                </Button>
              }
            />
            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
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
                  <span className="w-24 px-3 py-2 bg-surfaceLight border border-black/5 text-center font-mono text-primary text-sm mc-cutout-small">
                    {memory} MB
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  {t("settings.base_dir")}
                </label>
                <input
                  type="text"
                  value={gameDir}
                  onChange={(e) => setGameDir(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-black/5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  {t("settings.language")}
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="input-field w-full appearance-none"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="space-y-2 pt-4 border-t border-black/5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  {t("settings.visual_customization")}
                </label>
                <div className="grid grid-cols-5 gap-4 mt-2">
                  {AVAILABLE_LOGOS.map((item) => (
                    <div 
                      key={item.id} 
                      className={`cursor-pointer border-2 p-2 flex flex-col items-center gap-2 mc-cutout-small transition-all ${logo === item.id ? 'border-primary bg-primary/10' : 'border-transparent bg-surfaceLight hover:bg-black/5'}`}
                      onClick={() => setLogo(item.id)}
                    >
                      <img src={`./logo/${item.id}`} alt={item.name} className="w-12 h-12 object-contain" />
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider text-center">{item.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-black/5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  {t("settings.data_maintenance")}
                </label>
                <div className="flex items-center gap-4">
                  <Button onClick={handleClearCache} className="bg-surfaceLight border border-black/10 text-textMain hover:bg-black/5 transition-colors px-6 py-3 font-bold uppercase tracking-widest text-xs" icon={<FiTrash2 />}>
                    {t("settings.clear_cache")}
                  </Button>
                  <Button onClick={handleClearAllData} className="bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-colors px-6 py-3 font-bold uppercase tracking-widest text-xs" icon={<FiTrash2 />}>
                    {t("settings.clear_all_data")}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-5 flex flex-col gap-8">
          <Card>
            <SectionTitle eyebrow={t("settings.appearance")} title={t("settings.visual_system")} subtitle={t("settings.ui_aspects")} icon={<FiMonitor />} />
            <div className="bg-surfaceLight/30 p-4 border border-black/5 space-y-2 mc-cutout-small">
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted uppercase tracking-wider text-[10px] font-bold">{t("settings.cinematic_mode")}</span>
                <span className="text-primary font-bold uppercase tracking-wider text-[10px]">{t("settings.active")}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted uppercase tracking-wider text-[10px] font-bold">{t("settings.panel_density")}</span>
                <span className="text-textMain uppercase tracking-wider text-[10px] font-bold">{t("settings.medium")}</span>
              </div>
            </div>
          </Card>

          <Card className="flex-1">
            <SectionTitle eyebrow={t("settings.status")} title={t("settings.summary")} subtitle={t("settings.identity_resources")} icon={<FiCpu />} />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surfaceLight/20 p-3 border border-black/5 mc-cutout-small">
                <span className="text-[10px] text-textMuted uppercase tracking-widest block mb-1">{t("settings.active_pilot")}</span>
                <strong className="text-textMain text-sm uppercase tracking-wider">{profile?.username}</strong>
              </div>
              <div className="bg-surfaceLight/20 p-3 border border-black/5 mc-cutout-small">
                <span className="text-[10px] text-textMuted uppercase tracking-widest block mb-1">{t("settings.startup")}</span>
                <strong className="text-primary text-sm uppercase tracking-wider">{t("settings.completed")}</strong>
              </div>
              <div className="bg-surfaceLight/20 p-3 border border-black/5 mc-cutout-small">
                <span className="text-[10px] text-textMuted uppercase tracking-widest block mb-1">{t("settings.base_version")}</span>
                <strong className="text-textMain text-sm font-mono">{config.version}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
