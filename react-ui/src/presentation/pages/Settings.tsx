import { useState } from "react";
import { FiCpu, FiMonitor, FiSave, FiSliders, FiTrash2 } from "react-icons/fi";
import { useAppStore } from "../../application/store/useAppStore";
import { useNotificationStore } from "../../application/store/useNotificationStore";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";

const AVAILABLE_LOGOS = [
  { id: "logo_gren.svg", name: "Green (Default)" },
  { id: "logo_blue.svg", name: "Blue" },
  { id: "logo_lemon.svg", name: "Lemon" },
  { id: "logo_purple.svg", name: "Purple" },
  { id: "logo_yellow.svg", name: "Yellow" },
];

export function Settings() {
  const { config, setConfig, profile, logo, setLogo } = useAppStore();
  const [memory, setMemory] = useState(config.memoryMb);
  const [gameDir, setGameDir] = useState(config.gameDir);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setConfig({ ...config, memoryMb: memory, gameDir });
    setIsSaved(true);
    useNotificationStore.getState().addNotification("Ajustes guardados", "Tus configuraciones se han guardado correctamente.", "success");
    setTimeout(() => setIsSaved(false), 2000);
  };

  const { clearAll } = useAppStore();

  const handleClearCache = async () => {
    if (window.api) {
      await window.api.clearCache();
      useNotificationStore.getState().addNotification("Caché eliminado", "Se ha liberado espacio temporal de la aplicación.", "success");
    }
  };

  const handleClearAllData = async () => {
    if (confirm("¿Estás seguro de que quieres eliminar todos los datos? El launcher se reiniciará.")) {
      useNotificationStore.getState().addNotification("Limpieza profunda", "Eliminando todos los datos y reiniciando...", "warning");
      clearAll();
      if (window.api) {
        await window.api.clearAllData();
        window.api.restartApp();
      }
    }
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
                <Button onClick={handleSave} icon={<FiSave />} className={isSaved ? "bg-primary text-black" : "btn-secondary mc-button-cutout"}>
                  {isSaved ? "GUARDADO" : "GUARDAR CAMBIOS"}
                </Button>
              }
            />
            <div className="space-y-6 mt-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
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
                  <span className="w-24 px-3 py-2 bg-surfaceLight border border-black/5 text-center font-mono text-primary text-sm mc-cutout-small">
                    {memory} MB
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  Directorio Base
                </label>
                <input
                  type="text"
                  value={gameDir}
                  onChange={(e) => setGameDir(e.target.value)}
                  className="input-field w-full"
                />
              </div>

              <div className="space-y-2 pt-4 border-t border-black/5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  Personalización Visual
                </label>
                <div className="grid grid-cols-5 gap-4 mt-2">
                  {AVAILABLE_LOGOS.map((item) => (
                    <div 
                      key={item.id} 
                      className={`cursor-pointer border-2 p-2 flex flex-col items-center gap-2 mc-cutout-small transition-all ${logo === item.id ? 'border-primary bg-primary/10' : 'border-transparent bg-surfaceLight hover:bg-black/5'}`}
                      onClick={() => setLogo(item.id)}
                    >
                      <img src={`./logo/${item.id}`} alt={item.name} className="w-12 h-12 object-contain" />
                      <span className="text-[10px] font-bold text-textMuted uppercase tracking-wider text-center">{item.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-black/5">
                <label className="text-xs font-bold text-textMuted uppercase tracking-wider flex items-center gap-2">
                  Datos y Mantenimiento
                </label>
                <div className="flex items-center gap-4">
                  <Button onClick={handleClearCache} className="bg-surfaceLight border border-black/10 text-textMain hover:bg-black/5 transition-colors px-6 py-3 font-bold uppercase tracking-widest text-xs" icon={<FiTrash2 />}>
                    Eliminar Caché
                  </Button>
                  <Button onClick={handleClearAllData} className="bg-secondary/10 border border-secondary/20 text-secondary hover:bg-secondary/20 transition-colors px-6 py-3 font-bold uppercase tracking-widest text-xs" icon={<FiTrash2 />}>
                    Eliminar Datos Completos
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-span-5 flex flex-col gap-8">
          <Card>
            <SectionTitle eyebrow="Look and feel" title="Sistema Visual" subtitle="Aspectos de UI mockeados." icon={<FiMonitor />} />
            <div className="bg-surfaceLight/30 p-4 border border-black/5 space-y-2 mc-cutout-small">
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted uppercase tracking-wider text-[10px] font-bold">Modo cinemático</span>
                <span className="text-primary font-bold uppercase tracking-wider text-[10px]">Activo</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-textMuted uppercase tracking-wider text-[10px] font-bold">Densidad de paneles</span>
                <span className="text-textMain uppercase tracking-wider text-[10px] font-bold">Media</span>
              </div>
            </div>
          </Card>

          <Card className="flex-1">
            <SectionTitle eyebrow="Estado" title="Resumen" subtitle="Identidad y recursos activos." icon={<FiCpu />} />
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surfaceLight/20 p-3 border border-black/5 mc-cutout-small">
                <span className="text-[10px] text-textMuted uppercase tracking-widest block mb-1">Piloto Activo</span>
                <strong className="text-textMain text-sm uppercase tracking-wider">{profile?.username}</strong>
              </div>
              <div className="bg-surfaceLight/20 p-3 border border-black/5 mc-cutout-small">
                <span className="text-[10px] text-textMuted uppercase tracking-widest block mb-1">Onboarding</span>
                <strong className="text-primary text-sm uppercase tracking-wider">Completado</strong>
              </div>
              <div className="bg-surfaceLight/20 p-3 border border-black/5 mc-cutout-small">
                <span className="text-[10px] text-textMuted uppercase tracking-widest block mb-1">Versión Base</span>
                <strong className="text-textMain text-sm font-mono">{config.version}</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
