import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaMicrosoft } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useAppStore } from "@/application/store/useAppStore";
import { useNotificationStore } from "@/application/store/useNotificationStore";
import { WindowControls } from "@/presentation/layout/WindowControls";
import loginBgGif from "@/assets/login-bg.gif";

export function Onboarding() {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const loginMicrosoft = useAppStore((state) => state.loginMicrosoft);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const memoryMb = 4096;
  const gameDir = "./slaumcher_data";

  const handleMicrosoftLogin = async () => {
    setIsLoggingIn(true);
    try {
      await loginMicrosoft();
      completeOnboarding(
        useAppStore.getState().profile?.username || "Player",
        memoryMb,
        gameDir,
      );
      addNotification(t("onboarding.login_success"), t("onboarding.login_success_desc"), "success");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : t("onboarding.login_error_desc");
      addNotification(t("onboarding.login_error"), message, "error");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--surface-dashboard)] p-6">
      <img
        src={loginBgGif}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[var(--surface-dashboard)]/55" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--color-primary-shadow)_0%,transparent_65%)] opacity-30" />

      <div
        className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-end pr-6"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <WindowControls />
        </div>
      </div>

      <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 items-center gap-10 md:grid-cols-2">
        <div className="text-center md:text-left">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-hero-eyebrow)] drop-shadow-sm">
            SLAUMCHER
          </p>
          <h1 className="mt-4 font-black leading-[0.9] tracking-tight text-[clamp(2rem,5vw,3rem)] text-[var(--color-hero-heading)] drop-shadow-md">
            {t("onboarding.welcome")}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[var(--color-hero-description)]/90 md:mx-0 mx-auto drop-shadow-sm">
            {t("onboarding.subtitle")}
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[var(--surface-elevated)]/90 p-8 backdrop-blur-xl">
          <div className="mb-8 text-center">
            <h2 className="text-sm font-black uppercase tracking-[0.22em] text-white">
              {t("onboarding.premium_only")}
            </h2>
            <p className="mt-2 text-xs font-medium text-white/50">
              {t("onboarding.premium_desc")}
            </p>
          </div>

          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isLoggingIn}
            className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full bg-[var(--microsoft-blue)] py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors hover:bg-[var(--microsoft-blue-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoggingIn ? (
              <span className="animate-pulse">{t("onboarding.logging_in")}</span>
            ) : (
              <>
                <FaMicrosoft className="text-lg" />
                <span>{t("onboarding.login_microsoft")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <a
        href="https://cubyt.co/"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(event) => {
          event.preventDefault();
          const url = "https://cubyt.co/";
          try {
            const openExternal = window.api?.openExternal;
            if (typeof openExternal === "function") {
              void Promise.resolve(openExternal(url)).catch(() => {
                window.open(url, "_blank", "noopener,noreferrer");
              });
              return;
            }
          } catch {
            // Fallback when Electron API is incomplete or unavailable.
          }
          window.open(url, "_blank", "noopener,noreferrer");
        }}
        className="absolute bottom-5 right-6 z-10 cursor-pointer text-xs font-normal text-white/40 transition-colors hover:text-white/70"
      >
        by <span className="text-white/60">cubytlab</span>
      </a>
    </div>
  );
}
