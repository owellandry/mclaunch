import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../components/atoms/Card";

const installSteps = [
  { title: "Escanear el sistema", desc: "Comprobando dependencias (Java, Node)..." },
  { title: "Preparar runtime", desc: "Descargando MC Launch core y assets." },
  { title: "Aplicar experiencia", desc: "Instalando configuraciones visuales." },
  { title: "Verificar instalación", desc: "Registrando atajos y cerrando." },
];

export function Installing() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => navigate("/done"), 500);
          return 100;
        }
        return prev + Math.floor(Math.random() * 5) + 1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [navigate]);

  const activeStep = useMemo(() => Math.min(installSteps.length - 1, Math.floor((progress / 100) * installSteps.length)), [progress]);

  return (
    <div className="flex-1 flex flex-col justify-center max-w-2xl mx-auto w-full animate-in fade-in zoom-in duration-300">
      <div className="flex items-end justify-between mb-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-primary mb-1">PROGRESO DE INSTALACIÓN</p>
          <h2 className="text-2xl font-black uppercase text-textMain">Instalando MC Launch</h2>
        </div>
        <span className="text-4xl font-black text-primary">{Math.min(progress, 100)}%</span>
      </div>

      <div className="h-4 bg-surfaceLight border border-white/10 rounded-full overflow-hidden mb-8">
        <div 
          className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/80 transition-all duration-300 shadow-[0_0_20px_var(--color-primary-shadow)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-col gap-3">
        {installSteps.map((step, index) => (
          <Card key={index} className={`p-4 transition-all duration-500 ${index === activeStep ? 'border-primary shadow-[0_0_15px_var(--color-primary-shadow)] bg-surface' : index < activeStep ? 'opacity-50 border-transparent bg-transparent' : 'opacity-20 border-transparent bg-transparent'}`}>
            <div className="flex items-center gap-4">
              <span className={`text-xl font-bold ${index <= activeStep ? 'text-primary' : 'text-textMuted'}`}>0{index + 1}</span>
              <div>
                <strong className={`block text-sm uppercase font-bold ${index <= activeStep ? 'text-textMain' : 'text-textMuted'}`}>{step.title}</strong>
                <p className="text-xs text-textMuted mt-1">{step.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
