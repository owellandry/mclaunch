/**
 * @file InstallerLayout.tsx
 * @description Plantilla principal del instalador, con controles de ventana superior y un sidebar sutil.
 *
 * Patron: Atomic Design
 */
import { ReactNode } from "react";

export function InstallerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-screen overflow-hidden select-none">
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      <header
        className="relative z-50 flex items-center justify-between px-4 py-2.5 bg-background/90 backdrop-blur-md border-b border-surfaceLight"
        style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
      >
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-primary rounded-sm shadow-[0_0_10px_var(--color-primary-shadow)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">Slaumcher</span>
            <strong className="text-xs text-textMain leading-none">Installer Setup</strong>
          </div>
        </div>

        <div className="flex items-center gap-1 ml-2" style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
          <button
            onClick={() => window.installerApi?.minimizeWindow()}
            title="Minimizar"
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-black/8 transition-colors mc-cutout-small text-lg leading-none"
          >
            <span className="block w-3 h-[2px] bg-current mt-1" />
          </button>
          <button
            onClick={() => window.installerApi?.maximizeWindow()}
            title="Maximizar"
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-black/8 transition-colors mc-cutout-small"
          >
            <span
              className="block w-3 h-3 border-2 border-current"
              style={{ clipPath: "polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)" }}
            />
          </button>
          <button
            onClick={() => window.installerApi?.closeWindow()}
            title="Cerrar"
            className="w-8 h-8 flex items-center justify-center text-textMuted hover:text-white hover:bg-red-500 transition-colors mc-cutout-small font-bold text-sm"
          >
            ✕
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col p-5 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
