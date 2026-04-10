import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/atoms/Card";
import { SlimeAnimationMob } from "../components/atoms/SlimeAnimationMob";
import { clearTransitionDirection, INSTALLER_SLIME_TRANSITION_NAME } from "../lib/viewTransition";
import { Button } from "../components/atoms/Button";

const installSteps = [
  { key: "detect", title: "Escanear el sistema", desc: "Detectando sistema operativo, arquitectura y entorno disponible." },
  { key: "resolve", title: "Resolver release", desc: "Buscando la release oficial tagueada mas adecuada en GitHub." },
  { key: "download", title: "Descargar launcher", desc: "Descargando el artefacto oficial seleccionado para tu equipo." },
  { key: "install", title: "Aplicar instalacion", desc: "Instalando el launcher y dejando la ruta lista para abrir." },
  { key: "verify", title: "Verificar resultado", desc: "Comprobando que la instalacion terminara en una app utilizable." },
] as const;

const getActiveStepIndex = (phase: "detect" | "resolve" | "download" | "install" | "verify"): number => {
  const index = installSteps.findIndex((step) => step.key === phase);
  return index >= 0 ? index : 0;
};

export function Installing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(4);
  const [phase, setPhase] = useState<(typeof installSteps)[number]["key"]>("detect");
  const [statusMessage, setStatusMessage] = useState("Preparando la instalacion real del launcher...");
  const [logs, setLogs] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    clearTransitionDirection();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const pushLog = (message: string): void => {
      setLogs((current) => [message, ...current].slice(0, 6));
    };

    const unsubscribe = window.installerApi?.onInstallerEvent?.((event) => {
      if (!isMounted) return;

      if (event.type === "state") {
        setPhase(event.phase);
        setProgress(event.progress);
        setStatusMessage(event.message);
        setErrorMessage("");
        return;
      }

      if (event.type === "log") {
        pushLog(event.message);
        return;
      }

      if (event.type === "done") {
        setProgress(100);
        setStatusMessage(event.message);
        pushLog(`Release instalada: ${event.releaseTag}`);
        navigate("/done", { viewTransition: true });
        return;
      }

      if (event.type === "error") {
        setErrorMessage(event.message);
        pushLog(`Error: ${event.message}`);
      }
    });

    const boot = async (): Promise<void> => {
      try {
        const currentState = await window.installerApi?.getInstallState?.();
        if (!isMounted) return;

        if (currentState?.status === "done") {
          navigate("/done", { replace: true, viewTransition: true });
          return;
        }

        if (currentState?.status === "running") {
          setPhase(currentState.phase);
          setProgress(currentState.progress);
          setStatusMessage(currentState.message);
        } else if (currentState?.status === "error") {
          setErrorMessage(currentState.message);
          setStatusMessage(currentState.message);
        }

        await window.installerApi?.startInstall?.();
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudo iniciar la instalacion.";
        if (!isMounted) return;
        setErrorMessage(message);
        setStatusMessage(message);
        pushLog(`Error: ${message}`);
      } finally {
        if (isMounted) setIsStarting(false);
      }
    };

    void boot();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [navigate]);

  const activeStep = useMemo(() => getActiveStepIndex(phase), [phase]);

  return (
    <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-4xl grid grid-cols-[280px_minmax(0,1fr)] gap-5 items-center installer-install-grid">
        <Card className="p-5 relative overflow-hidden installer-slime-card h-full">
          <div className="relative flex items-center justify-center h-full">
            <SlimeAnimationMob size={178} transitionName={INSTALLER_SLIME_TRANSITION_NAME} />
          </div>
        </Card>

        <div className="flex flex-col justify-center gap-4 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-primary mb-2">
                Instalacion oficial en progreso
              </p>
              <h2 className="text-4xl font-black uppercase tracking-tight text-textMain leading-none">
                Instalando
                <br />
                MC Launch
              </h2>
            </div>

            <div className="shrink-0 text-right">
              <span className="block text-4xl font-black text-primary leading-none">
                {Math.min(progress, 100)}%
              </span>
              <span className="text-[11px] uppercase tracking-[0.28em] text-textMuted">
                Estado actual
              </span>
            </div>
          </div>

          <p className="text-textMuted text-sm leading-relaxed max-w-xl">
            {statusMessage}
          </p>

          <div className="h-4 bg-surfaceLight/70 border border-black/8 overflow-hidden mc-button-cutout">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-[0_0_18px_var(--color-primary-shadow)] mc-button-cutout"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl border border-black/8 bg-surfaceLight/55 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-textMuted">
                Paso actual
              </div>
              <div className="mt-2 text-sm font-black uppercase tracking-[0.16em] text-textMain">
                {installSteps[activeStep].title}
              </div>
              <div className="mt-2 text-xs leading-6 text-textMuted">
                {installSteps[activeStep].desc}
              </div>
            </div>

            <div className="rounded-2xl border border-black/8 bg-surfaceLight/55 px-4 py-4">
              <div className="text-xs uppercase tracking-[0.18em] text-textMuted">
                Actividad reciente
              </div>
              <div className="mt-3 grid gap-2">
                {logs.length === 0 ? (
                  <div className="text-xs text-textMuted">
                    {isStarting ? "Iniciando flujo de instalacion..." : "Esperando eventos del instalador..."}
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div key={`${log}-${index}`} className="text-xs leading-5 text-textMain/85">
                      {log}
                    </div>
                  ))
                )}
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-red-200">Error</div>
                <div className="mt-2 text-sm text-red-50">{errorMessage}</div>
                <div className="mt-4">
                  <Button
                    onClick={() => window.location.reload()}
                    variant="secondary"
                    className="px-5 py-2 text-xs"
                  >
                    Reintentar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
