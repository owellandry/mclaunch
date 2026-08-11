import { useEffect } from "react";

export type WindowLayoutMode = "compact" | "expanded";

/** True while the boot splash covers the destination route. */
let bootSplashActive = true;

export function setBootSplashActive(active: boolean): void {
  bootSplashActive = active;
}

/** Ask Electron to resize the shell for boot/onboarding vs the full launcher. */
export function setWindowLayout(mode: WindowLayoutMode): void {
  void window.api?.setWindowLayout?.(mode);
}

/**
 * Keep the native window size in sync with the active React view.
 * Ignores expanded requests while the boot splash is still covering the UI.
 */
export function useWindowLayout(mode: WindowLayoutMode): void {
  useEffect(() => {
    if (mode === "expanded" && bootSplashActive) return;
    setWindowLayout(mode);
  }, [mode]);
}
