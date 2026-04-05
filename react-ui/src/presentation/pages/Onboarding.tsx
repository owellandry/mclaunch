import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiCpu, FiFolder, FiUnlock } from "react-icons/fi";
import { FaMicrosoft } from "react-icons/fa";
import { useAppStore } from "../../application/store/useAppStore";
import { useTranslation } from "react-i18next";
import { useNotificationStore } from "../../application/store/useNotificationStore";

export function Onboarding() {
  const [memoryMb, setMemoryMb] = useState(4096);
  const [gameDir, setGameDir] = useState("./mclaunch_data");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { completeOnboarding, loginMicrosoft } = useAppStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleMicrosoftLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginMicrosoft();
      // Guardar ajustes adicionales (RAM y Directorio)
      completeOnboarding(useAppStore.getState().profile?.username || "Player", memoryMb, gameDir);
      addNotification(t("onboarding.login_success"), t("onboarding.login_success_desc"), "success");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      addNotification(t("onboarding.login_error"), err.message || t("onboarding.login_error_desc"), "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden bg-grid-pattern">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-shadow)_0%,transparent_70%)] opacity-30" />
      <div className="max-w-4xl w-full grid grid-cols-2 gap-12 relative z-10">
        <div className="flex flex-col justify-center">
          <div className="mb-12">
            <div className="w-24 h-24 bg-surfaceLight border-2 border-primary/30 text-primary mx-auto mb-8 flex items-center justify-center mc-cutout-small shadow-[0_0_30px_var(--color-primary-shadow)]">
              <FiUnlock className="text-5xl drop-shadow-[0_0_15px_var(--color-primary-shadow)]" />
            </div>
            <h1 className="text-5xl font-black text-textMain uppercase tracking-tighter mb-4 text-center leading-none">
              {t("onboarding.welcome")}
            </h1>
            <p className="text-textMuted font-mono text-center text-sm uppercase tracking-widest leading-relaxed">
              {t("onboarding.subtitle")}
            </p>
          </div>
        </div>

        <div className="bg-surfaceLight/80 backdrop-blur-2xl border border-black/10 p-10 mc-cutout shadow-2xl flex flex-col justify-center relative">
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
          
          <div className="space-y-8 relative z-10">
            <div className="text-center mb-8">
              <h2 className="text-lg font-black text-textMain uppercase tracking-widest mb-2">{t("onboarding.premium_only")}</h2>
              <p className="text-xs text-textMuted font-bold uppercase tracking-wider">{t("onboarding.premium_desc")}</p>
            </div>

            <button
              onClick={handleMicrosoftLogin}
              disabled={isLoggingIn}
              className="w-full bg-[#00A4EF] hover:bg-[#008bc9] disabled:bg-[#00A4EF]/50 text-white transition-all duration-300 py-5 font-black uppercase tracking-widest flex items-center justify-center gap-4 mc-cutout shadow-[0_0_20px_rgba(0,164,239,0.3)] hover:shadow-[0_0_30px_rgba(0,164,239,0.5)] disabled:shadow-none"
            >
              {isLoggingIn ? (
                <span className="animate-pulse">{t("onboarding.logging_in")}</span>
              ) : (
                <>
                  <FaMicrosoft className="text-2xl" /> {t("onboarding.login_microsoft")}
                </>
              )}
            </button>

            <div className="pt-8 border-t border-black/10 space-y-6">
              <h3 className="text-xs font-black text-textMuted uppercase tracking-widest text-center">
                {t("onboarding.advanced_settings")}
              </h3>
              <div className="space-y-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-2"><FiCpu className="text-primary" /> {t("onboarding.ram_mb")}</span>
                  <span className="text-primary font-mono bg-primary/10 px-2 py-0.5 mc-cutout-small">{memoryMb}</span>
                </label>
                <input
                  type="range"
                  min="1024"
                  max="16384"
                  step="512"
                  value={memoryMb}
                  onChange={(e) => setMemoryMb(Number(e.target.value))}
                  className="w-full accent-primary mt-2"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  <FiFolder className="text-primary" /> {t("onboarding.game_dir")}
                </label>
                <input
                  type="text"
                  value={gameDir}
                  onChange={(e) => setGameDir(e.target.value)}
                  className="w-full bg-surface border border-black/10 text-textMain px-4 py-3 font-mono focus:border-primary/50 outline-none transition-colors mc-cutout-small text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
