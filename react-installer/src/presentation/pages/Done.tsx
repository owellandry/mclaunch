import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";

export function Done() {
  return (
    <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className="w-full max-w-3xl flex flex-col justify-center">
        <div className="flex flex-col justify-center">
          <p className="text-primary font-bold tracking-[0.3em] uppercase text-xs mb-2">
            Instalacion completa
          </p>
          <h1 className="text-4xl font-black uppercase tracking-tight text-textMain mb-4 leading-none">
            MC Launch ya
            <br />
            esta listo
          </h1>
          <p className="text-textMuted text-sm leading-relaxed mb-6 max-w-xl">
            El launcher quedo configurado correctamente. Desde aqui ya puedes cerrar el
            instalador y continuar con la siguiente fase de pruebas del entorno.
          </p>

          <Card className="p-4 bg-surface/80 border-black/8 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <strong className="block text-sm uppercase text-textMain">
                  Entorno principal preparado
                </strong>
                <p className="text-xs text-textMuted mt-1">
                  Archivos base, accesos y configuracion inicial ya fueron generados.
                </p>
              </div>
              <span className="text-primary text-lg font-black">100%</span>
            </div>
          </Card>

          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => (window as any).installerApi?.launchApp?.()}
              variant="primary"
              className="px-8 py-3 text-sm"
            >
              Abrir Launcher
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}