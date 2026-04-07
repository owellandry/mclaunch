import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/atoms/Button";
import { Card } from "../components/atoms/Card";
import { SlimeAnimationMob } from "../components/atoms/SlimeAnimationMob";
import { clearTransitionDirection, INSTALLER_SLIME_TRANSITION_NAME } from "../lib/viewTransition";

const installSteps = [
  { title: "Escanear el sistema", desc: "Comprobando dependencias y espacio disponible." },
  { title: "Preparar runtime", desc: "Descargando MC Launch core y assets iniciales." },
  { title: "Aplicar experiencia", desc: "Instalando configuraciones y accesos utiles." },
  { title: "Verificar instalacion", desc: "Validando el entorno final del launcher." },
];

export function Installing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    clearTransitionDirection();
  }, []);

  useEffect(() => {
    let finishTimer: number | undefined;

    const timer = window.setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(timer);
          if (finishTimer == null) {
            finishTimer = window.setTimeout(() => {
              navigate("/done", { viewTransition: true });
            }, 350);
          }
          return 100;
        }

        return Math.min(100, prev + Math.floor(Math.random() * 5) + 1);
      });
    }, 100);

    return () => {
      window.clearInterval(timer);
      if (finishTimer != null) {
        window.clearTimeout(finishTimer);
      }
    };
  }, [navigate]);

  const activeStep = useMemo(() => {
    return Math.min(
      installSteps.length - 1,
      Math.floor((progress / 100) * installSteps.length),
    );
  }, [progress]);

  return (
    <div className="flex-1 flex items-center justify-center animate-in fade-in zoom-in duration-300">
      <div className="w-full max-w-4xl grid grid-cols-[280px_minmax(0,1fr)] gap-5 items-center installer-install-grid">
        <Card className="p-5 relative overflow-hidden installer-slime-card h-full">
          <div className="relative flex items-center justify-center h-full">
            <SlimeAnimationMob
              size={178}
              transitionName={INSTALLER_SLIME_TRANSITION_NAME}
            />
          </div>
        </Card>

        <div className="flex flex-col justify-center gap-4 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold tracking-[0.35em] text-primary mb-2">
                Instalacion en progreso
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
            Estamos preparando los archivos base, accesos y configuracion inicial del launcher.
            Apenas termine, pasamos automaticamente al cierre del instalador.
          </p>

          <div className="h-4 bg-surfaceLight/70 border border-black/8 overflow-hidden mc-button-cutout">
            <div
              className="h-full bg-primary transition-all duration-300 shadow-[0_0_18px_var(--color-primary-shadow)] mc-button-cutout"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex items-center pt-1">
            <div className="text-xs text-textMuted uppercase tracking-[0.18em]">
              {installSteps[activeStep].title}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
