/**
 * @file InstallerLayout.tsx
 * @description Plantilla principal del instalador, con controles de ventana superior y un sidebar sutil.
 * 
 * Patrón: Atomic Design
 */
import { ReactNode } from "react";

export function InstallerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex flex-col min-h-screen bg-surface overflow-hidden select-none">
      {/* Fondos y gradientes */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,var(--color-primary-shadow)_0%,transparent_40%)] opacity-40 pointer-events-none" />
      <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(0,0,0,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.04)_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none" />

      {/* Barra de arrastre (Draggable Header) */}
      <header className="relative z-50 flex items-center justify-between px-4 py-3 bg-background/90 backdrop-blur-md border-b border-surfaceLight" style={{ WebkitAppRegion: 'drag' } as any}>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 bg-primary rounded-sm shadow-[0_0_10px_var(--color-primary-shadow)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">MC Launch</span>
            <strong className="text-xs text-textMain leading-none">Installer Setup</strong>
          </div>
        </div>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button onClick={() => window.installerApi?.minimizeWindow()} className="w-6 h-6 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-black/5 rounded transition-colors">_</button>
          <button onClick={() => window.installerApi?.maximizeWindow()} className="w-6 h-6 flex items-center justify-center text-textMuted hover:text-textMain hover:bg-black/5 rounded transition-colors">□</button>
          <button onClick={() => window.installerApi?.closeWindow()} className="w-6 h-6 flex items-center justify-center text-textMuted hover:text-white hover:bg-red-500 rounded transition-colors">×</button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="relative z-10 flex-1 flex flex-col p-6 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
