/**
 * @file HeroSection.tsx
 * @description Sección principal de la landing. Atrae al usuario y le presenta la llamada a la acción principal.
 */
import { Download, Monitor, Zap } from "lucide-react";
import { Button } from "../atoms/Button";
import { useLandingStore } from "../../../application/store/useLandingStore";

export function HeroSection() {
  const { recommendedDownload, os } = useLandingStore();

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[85vh] text-center w-full max-w-4xl mx-auto py-20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,var(--color-primary-shadow)_0%,transparent_60%)] opacity-20 pointer-events-none -z-10 blur-3xl" />
      
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8 shadow-[0_0_20px_var(--color-primary-shadow)]">
        <Zap size={14} className="fill-primary" />
        <span>La nueva era de los Launchers</span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-textMain mb-6 leading-none">
        Juega <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-primaryHover">Minecraft</span><br />
        Sin Límites
      </h1>

      <p className="text-lg md:text-xl text-textMuted max-w-2xl font-medium leading-relaxed mb-12">
        Un launcher atómico, ultra-rápido, y visualmente espectacular. 
        Soporte nativo para cuentas de Microsoft y mods de Fabric integrados directamente en el menú de inicio.
      </p>

      <div className="flex flex-col items-center gap-4 w-full sm:w-auto">
        <Button 
          variant="primary" 
          className="w-full sm:w-auto px-10 py-5 text-lg font-black tracking-widest"
          icon={<Download size={22} />}
          onClick={() => {
            if (recommendedDownload) window.location.href = recommendedDownload.url;
          }}
        >
          {recommendedDownload ? recommendedDownload.label : "Descargar MC Launch"}
        </Button>
        <span className="text-xs font-bold uppercase tracking-widest text-textMuted/60 flex items-center gap-2">
          <Monitor size={14} /> Detectado para {os === "unknown" ? "tu sistema" : os}
        </span>
      </div>
    </section>
  );
}
