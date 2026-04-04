import { FiPlay } from "react-icons/fi";
import { useLauncherStore } from "../../application/store/useLauncherStore";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

const INSTALLATIONS = [
  {
    id: "aurora",
    label: "Vanilla 1.20.1",
    channel: "Lanzamiento",
    vibe: "Supervivencia",
    description: "¡Explora tu propio mundo único, sobrevive a la noche y crea cualquier cosa que puedas imaginar!",
  },
  {
    id: "pulse",
    label: "OptiFine 1.19.4",
    channel: "Modificado",
    vibe: "Creativo",
    description: "Gráficos mejorados, shaders y ajustes de rendimiento para la mejor experiencia de construcción.",
  },
];

export function Dashboard() {
  const { status, launch, selectedInstallId, setSelectedInstallId } = useLauncherStore();
  const isRunning = status === "running";
  const selectedInstall = INSTALLATIONS.find(i => i.id === selectedInstallId) || INSTALLATIONS[0];

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Hero Section matching Image 1 */}
      <div className="relative w-full h-[65%] overflow-hidden bg-surface rounded-2xl border border-white/5 shadow-2xl">
        {/* Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[2s] hover:scale-105"
          style={{ backgroundImage: `url('/src/assets/hero.png')` }}
        />
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
        
        {/* Top Nav (Optional, matching image 1's pill buttons) */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-2">
          {['JUEGOS', 'TIENDA', 'COMUNIDAD', 'SOPORTE'].map(nav => (
            <div key={nav} className="px-5 py-1.5 border border-white/20 rounded-full text-white text-xs font-bold tracking-wider backdrop-blur-md bg-black/20 hover:bg-white/10 cursor-pointer transition-colors">
              {nav}
            </div>
          ))}
        </div>

        {/* Bottom Content */}
        <div className="absolute bottom-10 left-10 max-w-xl">
          <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest mb-4 inline-block mc-cutout-small shadow-[0_0_10px_#A1E9A580]">
            {selectedInstall.channel}
          </span>
          <h1 className="text-5xl font-black text-white mb-3 uppercase tracking-tight leading-none drop-shadow-xl">
            {selectedInstall.label}
          </h1>
          <p className="text-white/90 font-medium leading-relaxed max-w-md text-sm drop-shadow-md">
            {selectedInstall.description}
          </p>
        </div>

        {/* The Cutout Button Container */}
        <div 
          className="absolute bottom-0 right-0 bg-background p-6 pl-8 pt-8"
          style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%, 0 100%, 40px 0)' }}
        >
          <Button 
            onClick={launch} 
            disabled={isRunning} 
            className={`py-4 px-10 text-lg shadow-[0_0_20px_#A1E9A533] ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRunning ? 'INICIANDO...' : "EXPLORAR"}
            {!isRunning && <FiPlay className="ml-2 fill-current" />}
          </Button>
        </div>
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-3 gap-6 flex-1 min-h-0">
        <Card className="flex flex-col">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Actividad Semanal</h3>
          <div className="flex items-end gap-2 h-20 mb-3 mt-auto">
            {[40, 70, 30, 90, 50, 20, 100].map((h, i) => (
              <div key={i} className="flex-1 bg-surface relative group h-full">
                <div 
                  className="absolute bottom-0 left-0 right-0 bg-primary transition-all group-hover:bg-primaryHover" 
                  style={{ height: `${h}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-textMuted font-mono px-1">
            <span>D</span><span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span>
          </div>
          <button className="w-full mt-4 py-2 bg-surface text-xs font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-wider mc-cutout-small">
            Ver Actividad Completa
          </button>
        </Card>

        <Card className="flex flex-col">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Tus Estadísticas</h3>
          <div className="grid grid-cols-2 gap-4 flex-1">
            <div className="bg-surface/50 p-4 flex flex-col justify-center items-center border border-white/5 mc-cutout-small">
              <span className="text-3xl font-black text-white mb-1">66<span className="text-primary text-lg">%</span></span>
              <span className="text-[10px] text-textMuted uppercase tracking-widest text-center">Tasa de Victoria</span>
            </div>
            <div className="bg-surface/50 p-4 flex flex-col justify-center items-center border border-white/5 mc-cutout-small">
              <span className="text-3xl font-black text-white mb-1">3.15</span>
              <span className="text-[10px] text-textMuted uppercase tracking-widest text-center">KDA</span>
            </div>
          </div>
          <button className="w-full mt-4 py-2 bg-surface text-xs font-bold text-white hover:bg-white/10 transition-colors uppercase tracking-wider mc-cutout-small">
            Ver Estadísticas
          </button>
        </Card>

        <Card className="flex flex-col">
          <h3 className="text-xs font-bold text-textMuted uppercase tracking-wider mb-4">Cambio Rápido</h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
            {INSTALLATIONS.map(inst => (
              <div 
                key={inst.id}
                onClick={() => setSelectedInstallId(inst.id)}
                className={`p-3 border cursor-pointer transition-all flex justify-between items-center mc-cutout-small ${
                  selectedInstallId === inst.id 
                    ? "border-primary bg-primary/10" 
                    : "border-white/5 bg-surface/50 hover:bg-surface"
                }`}
              >
                <div>
                  <h4 className="font-bold text-white text-sm uppercase">{inst.label}</h4>
                  <span className="text-[10px] text-textMuted uppercase tracking-wider">{inst.vibe}</span>
                </div>
                <div className={`w-3 h-3 ${selectedInstallId === inst.id ? 'bg-primary shadow-[0_0_10px_#A1E9A5CC]' : 'bg-surface border border-white/20'}`} style={{ clipPath: 'polygon(3px 0, 100% 0, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0 100%, 0 3px)' }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
