import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  FiCheck,
  FiCpu,
  FiFolder,
  FiGlobe,
  FiLogOut,
  FiSave,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/application/store/useAppStore";
import { useNotificationStore } from "@/application/store/useNotificationStore";
import { Button, Modal } from "@/presentation/design-system";
import { MinecraftAvatar } from "@/presentation/components/minecraft/MinecraftAvatar";
import { getLogoSrc } from "@/presentation/constants/logoAssets";

type SettingsModalProps = {
  open: boolean;
  onClose: () => void;
};

function Section({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] text-white/60">
          {icon}
        </span>
        <div className="min-w-0">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-xs leading-relaxed text-white/40">{description}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function SettingsModal({ open, onClose }: SettingsModalProps) {
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
    { id: "logo_gren.svg", name: t("settings.green"), swatch: "#22d95d" },
    { id: "logo_blue.svg", name: t("settings.blue"), swatch: "#4d8cff" },
    { id: "logo_lemon.svg", name: t("settings.lemon"), swatch: "#c5f267" },
    { id: "logo_purple.svg", name: t("settings.purple"), swatch: "#c084fc" },
    { id: "logo_yellow.svg", name: t("settings.yellow"), swatch: "#fde047" },
  ];

  const [memory, setMemory] = useState(config.memoryMb);
  const [gameDir, setGameDir] = useState(config.gameDir);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    setMemory(config.memoryMb);
    setGameDir(config.gameDir);
    setIsSaved(false);
  }, [open, config.memoryMb, config.gameDir]);

  const ramPercent = ((memory - 1024) / (16384 - 1024)) * 100;

  const fieldClass =
    "w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-primary/50 focus:bg-black/35";

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
    onClose();
    navigate("/onboarding");
  };

  return (
    <Modal open={open} onClose={onClose} hideClose className="max-w-2xl">
      <div className="relative border-b border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-80"
            style={{
              background:
                "radial-gradient(ellipse 80% 120% at 0% 0%, var(--color-primary-shadow), transparent 55%), linear-gradient(135deg, rgba(255,255,255,0.04), transparent 40%)",
            }}
          />
        </div>

        <div className="relative flex items-start justify-between gap-4 px-6 pb-4 pt-6 sm:px-7">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-hero-eyebrow)]">
              {t("settings.core_config")}
            </p>
            <h2 className="mt-1.5 text-2xl font-black tracking-tight text-white">
              {t("settings.launcher_settings")}
            </h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-white/45">
              {t("settings.sys_resources")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/20 text-white/55 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <div className="relative mx-6 mb-5 flex min-h-[4.25rem] items-center gap-3.5 overflow-visible rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 sm:mx-7 sm:gap-4 sm:px-4 sm:py-3.5">
          <div className="shrink-0">
            <MinecraftAvatar
              username={profile?.username || "Player"}
              uuid={profile?.uuid}
              skinUrl={profile?.skinUrl}
              size={40}
            />
          </div>
          <div className="min-w-0 flex-1 py-0.5">
            <p className="truncate text-sm font-bold leading-snug text-white">
              {profile?.username || t("topbar.player")}
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-white/45">
              {t("settings.active_pilot")}
            </p>
          </div>
          <div className="hidden shrink-0 py-0.5 text-right sm:block">
            <p className="font-mono text-xs leading-snug text-white/70">{config.version || "—"}</p>
            <p className="mt-1 text-[10px] font-bold uppercase leading-none tracking-[0.14em] text-primary/90">
              {t("settings.completed")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6 sm:px-7">
        <Section icon={<FiCpu className="text-sm" />} title={t("settings.ram_allocation")}>
          <div className="rounded-2xl border border-white/[0.08] bg-black/20 p-4">
            <div className="mb-4 flex items-end justify-between gap-3">
              <span className="text-xs text-white/45">1 GB — 16 GB</span>
              <span className="rounded-lg bg-primary/15 px-2.5 py-1 font-mono text-sm font-bold text-primary">
                {memory} MB
              </span>
            </div>
            <div className="relative flex h-8 items-center">
              <div className="pointer-events-none absolute inset-x-0 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary/60 to-primary"
                  style={{ width: `${ramPercent}%` }}
                />
              </div>
              <input
                type="range"
                min="1024"
                max="16384"
                step="512"
                value={memory}
                onChange={(e) => setMemory(Number(e.target.value))}
                className="relative z-10 w-full cursor-pointer accent-primary"
                aria-label={t("settings.ram_allocation")}
              />
            </div>
          </div>
        </Section>

        <Section icon={<FiFolder className="text-sm" />} title={t("settings.base_dir")}>
          <input
            type="text"
            value={gameDir}
            onChange={(e) => setGameDir(e.target.value)}
            className={`${fieldClass} font-mono`}
          />
        </Section>

        <Section icon={<FiGlobe className="text-sm" />} title={t("settings.language")}>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: "es", label: "Español" },
              { value: "en", label: "English" },
              { value: "pt", label: "Português" },
            ].map((option) => {
              const active = language === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setLanguage(option.value)}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-bold uppercase tracking-[0.12em] transition-colors cursor-pointer ${
                    active
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-white/10 bg-black/20 text-white/55 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section
          icon={
            <img
              src={getLogoSrc(logo)}
              alt=""
              aria-hidden
              className="size-4 object-contain"
            />
          }
          title={t("settings.visual_customization")}
          description={t("settings.ui_aspects")}
        >
          <div className="grid grid-cols-5 gap-2">
            {availableLogos.map((item) => {
              const active = logo === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-label={item.name}
                  onClick={() => setLogo(item.id)}
                  className={`group relative flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-3 transition-all ${
                    active
                      ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_var(--color-primary-shadow)]"
                      : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.04]"
                  }`}
                >
                  <span
                    className="absolute top-2 right-2 size-1.5 rounded-full"
                    style={{ backgroundColor: item.swatch }}
                    aria-hidden
                  />
                  <img
                    src={getLogoSrc(item.id)}
                    alt=""
                    aria-hidden
                    className="h-9 w-9 object-contain"
                  />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-white/45 group-hover:text-white/65">
                    {item.name.split(" ")[0]}
                  </span>
                  {active ? (
                    <span className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-[var(--color-dark)]">
                      <FiCheck className="text-[11px]" strokeWidth={3} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </Section>

        <Section icon={<FiTrash2 className="text-sm" />} title={t("settings.data_maintenance")}>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button variant="secondary" onClick={handleClearCache} icon={<FiTrash2 />}>
              {t("settings.clear_cache")}
            </Button>
            <Button variant="danger" onClick={handleClearAllData} icon={<FiTrash2 />}>
              {t("settings.clear_all_data")}
            </Button>
            <Button
              variant="danger"
              onClick={handleLogout}
              icon={<FiLogOut />}
              className="sm:ml-auto"
            >
              {t("settings.logout")}
            </Button>
          </div>
        </Section>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/[0.07] bg-black/25 px-6 py-4 sm:px-7">
        <p className="hidden text-xs text-white/35 sm:block">
          {isSaved ? t("settings.settings_saved_desc") : t("settings.sys_resources")}
        </p>
        <Button
          variant={isSaved ? "primary" : "secondary"}
          onClick={handleSave}
          icon={isSaved ? <FiCheck /> : <FiSave />}
          className="!min-w-[10.5rem]"
        >
          {isSaved ? t("settings.saved") : t("settings.save_changes")}
        </Button>
      </div>
    </Modal>
  );
}
