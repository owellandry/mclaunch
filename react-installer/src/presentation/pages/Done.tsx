import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";

export function Done() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-lg text-center flex flex-col items-center">
        
        <div className="w-24 h-24 rounded-full bg-surface border border-primary/40 flex items-center justify-center mb-8 shadow-[0_0_50px_var(--color-primary-shadow)] mc-cutout-small relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--color-primary-shadow)_0%,transparent_100%)] opacity-80" />
          <span className="text-5xl text-primary font-bold relative z-10">✓</span>
        </div>

        <p className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">Completado</p>
        <h1 className="text-4xl font-black uppercase tracking-tight text-textMain mb-4">
          ¡Launcher Instalado!
        </h1>
        <p className="text-textMuted text-sm leading-relaxed mb-8">
          MC Launch ha sido configurado en tu sistema con éxito. Ya puedes iniciar sesión con tu cuenta de Microsoft, descargar versiones de Minecraft y explorar los mods nativos.
        </p>
        
        <Card className="p-4 bg-surfaceLight border-l-4 border-l-primary/50 text-left w-full mb-8 flex justify-between items-center mc-cutout-small">
          <div>
            <h3 className="font-bold text-textMain text-sm uppercase">Ejecutar MC Launch</h3>
            <p className="text-textMuted text-xs mt-1">El acceso directo está en tu escritorio.</p>
          </div>
          <span className="text-primary animate-pulse text-lg">▶</span>
        </Card>

        <Button onClick={() => window.installerApi?.closeWindow()} variant="primary" className="px-12 py-4 text-sm tracking-[0.2em] font-black w-full">
          Cerrar Instalador
        </Button>
      </div>
    </div>
  );
}
