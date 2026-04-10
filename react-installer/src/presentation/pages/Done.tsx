import { useEffect, useState } from "react";
import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";

type DoneState = {
  releaseTag: string;
  assetName: string;
  installPath: string;
  platform: string;
  arch: string;
};

export function Done() {
  const [details, setDetails] = useState<DoneState | null>(null);
  const [launchError, setLaunchError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const load = async (): Promise<void> => {
      const state = await window.installerApi?.getInstallState?.();
      if (!isMounted || !state || state.status !== "done") return;

      setDetails({
        releaseTag: state.releaseTag,
        assetName: state.assetName,
        installPath: state.installPath,
        platform: state.platform,
        arch: state.arch,
      });
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLaunch = async (): Promise<void> => {
    setLaunchError("");

    try {
      await window.installerApi?.launchApp?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo abrir el launcher instalado.";
      setLaunchError(message);
    }
  };

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
            El instalador descargo la release oficial de GitHub y dejo el launcher preparado para abrirse.
          </p>

          <Card className="p-4 bg-surface/80 border-black/8 mb-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <strong className="block text-sm uppercase text-textMain">
                    Release oficial instalada
                  </strong>
                  <p className="text-xs text-textMuted mt-1">
                    La instalacion ya no es mock: se bajo y aplico una release real compatible con este sistema.
                  </p>
                </div>
                <span className="text-primary text-lg font-black">100%</span>
              </div>

              {details ? (
                <div className="grid gap-2 text-xs text-textMuted">
                  <div>
                    <strong className="text-textMain">Tag:</strong> {details.releaseTag}
                  </div>
                  <div>
                    <strong className="text-textMain">Artefacto:</strong> {details.assetName}
                  </div>
                  <div>
                    <strong className="text-textMain">Sistema:</strong> {details.platform}/{details.arch}
                  </div>
                  <div className="break-all">
                    <strong className="text-textMain">Ruta:</strong> {details.installPath}
                  </div>
                </div>
              ) : null}
            </div>
          </Card>

          {launchError ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-50">
              {launchError}
            </div>
          ) : null}

          <div className="flex gap-3 flex-wrap">
            <Button onClick={() => void handleLaunch()} variant="primary" className="px-8 py-3 text-sm">
              Abrir Launcher
            </Button>
            <Button onClick={() => window.installerApi?.closeWindow()} variant="ghost" className="px-6 py-3 text-sm">
              Cerrar instalador
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
