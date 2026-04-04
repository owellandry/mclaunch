import { useState } from "react";
import { FiCpu, FiMonitor, FiSave, FiSliders } from "react-icons/fi";
import { useAppStore } from "../../application/store/useAppStore";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";

export function Settings() {
  const { config, setConfig, profile } = useAppStore();
  const [memory, setMemory] = useState(config.memoryMb);
  const [gameDir, setGameDir] = useState(config.gameDir);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setConfig({ ...config, memoryMb: memory, gameDir });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 pb-8">
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-7">
          <Card className="h-full">
            <SectionTitle
              eyebrow="Configuración Core"
              title="Ajustes del Launcher"
              subtitle="Control de recursos y rutas del sistema."
              icon={<FiSliders />}
              action={
                <Button onClick={handleSave} icon={<FiSave />} className={isSaved ? "bg-green-500/20 text-green-400 border-green-500/50" : ""}>
                  {isSaved ? "Guardado" : "Guardar Cambios"}
                </Button>
              }
            />
            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  Memoria RAM Asignada
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1024"
                    max="16384"
                    step="512"
                    value={memory}
                    onChange={(e) => setMemory(Number(e.target.value))}
                    className="flex-1 accent-primary"
                  />
                  <span className="w-24 px-3 py-2 bg-surface rounded-lg border border-white/10 text-center font-mono text-primary text-sm shadow-inner">
                    {memory} MB
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-white flex items-center gap-2">
                  Directorio Base
                </label>
                <input
                  type="text"
                  value={gameDir}
                  onChange={(e) => setGameDir(e.target.value)}
                  className="w-full bg-surface/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary/50 transition-colors font-mono text-sm"
                />
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-5 flex flex-col gap-8">
          <Card>
            <SectionTitle eyebrow="Look and feel" title="Sistema Visual" subtitle="Aspectos de UI mockeados." icon={<FiMonitor />} />
            <div className="bg-surface/30 p-4 rounded-xl border border-white/5 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMain">Modo cinemático</span>
                <span className="text-primary font-bold">Activo</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMain">Densidad de paneles</span>
                <span className="text-white">Media</span>
              </div>
            </div>
          </Card>

          <Card className="flex-1">
            <SectionTitle eyebrow="Estado" title="Resumen" subtitle="Identidad y recursos activos." icon={<FiCpu />} />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface/20 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-textMain uppercase tracking-widest block mb-1">Piloto Activo</span>
                <strong className="text-white text-sm">{profile?.username}</strong>
              </div>
              <div className="bg-surface/20 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-textMain uppercase tracking-widest block mb-1">Onboarding</span>
                <strong className="text-green-400 text-sm">Completado</strong>
              </div>
              <div className="bg-surface/20 p-3 rounded-lg border border-white/5">
                <span className="text-[10px] text-textMain uppercase tracking-widest block mb-1">Versión Base</span>
                <strong className="text-white text-sm">{config.version}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
