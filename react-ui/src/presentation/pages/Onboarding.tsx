import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUnlock } from "react-icons/fi";
import { FaMicrosoft } from "react-icons/fa";
import { useAppStore } from "../../application/store/useAppStore";
import { useTranslation } from "react-i18next";
import { useNotificationStore } from "../../application/store/useNotificationStore";

export function Onboarding() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { completeOnboarding, loginMicrosoft } = useAppStore();
  const { addNotification } = useNotificationStore();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const memoryMb = 4096;
  const gameDir = "./mclaunch_data";

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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Window drag bar + controls — shown here because MainLayout/Topbar is not mounted on this route */}
      <div
        className="fixed top-0 left-0 right-0 h-10 z-50 flex items-center justify-end pr-1"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-1" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button
            onClick={() => window.api?.minimizeWindow?.()}
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-white/8 transition-colors mc-cutout-small"
          >
            <span className="block w-3 h-[2px] bg-current mt-1" />
          </button>
          <button
            onClick={() => window.api?.maximizeWindow?.()}
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-white/8 transition-colors mc-cutout-small"
          >
            <span className="block w-3 h-3 border-2 border-current" style={{ clipPath: "polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)" }} />
          </button>
          <button
            onClick={() => window.api?.closeWindow?.()}
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-white hover:bg-red-500 transition-colors mc-cutout-small font-bold text-sm"
          >
            ✕
          </button>
        </div>
      </div>

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
              className="w-full bg-[#00A4EF] hover:bg-[#008bc9] disabled:bg-[#00A4EF]/50 text-white transition-all duration-300 py-5 font-black uppercase tracking-widest flex items-center justify-center gap-3 mc-cutout shadow-[0_0_20px_rgba(0,164,239,0.3)] hover:shadow-[0_0_30px_rgba(0,164,239,0.5)] disabled:shadow-none"
            >
              {isLoggingIn ? (
                <span className="animate-pulse">{t("onboarding.logging_in")}</span>
              ) : (
                <>
                  <span className="inline-flex h-6 w-6 items-center justify-center shrink-0">
                    <FaMicrosoft className="text-[1.2rem] leading-none" />
                  </span>
                  <span className="leading-none">{t("onboarding.login_microsoft")}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
