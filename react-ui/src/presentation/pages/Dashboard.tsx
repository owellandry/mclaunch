import { FiActivity, FiPlay, FiStar, FiTerminal } from "react-icons/fi";
import { useLauncherStore } from "../../application/store/useLauncherStore";
import { useAppStore } from "../../application/store/useAppStore";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";

const INSTALLATIONS = [
  {
    id: "aurora",
    label: "Aurora Build",
    channel: "Curada",
    vibe: "PvE cinematic",
    description: "Shaders suaves, HUD limpio y experiencia enfocada en exploración.",
  },
  {
    id: "pulse",
    label: "Pulse Ranked",
    channel: "Competitiva",
    vibe: "PvP veloz",
    description: "Perfil ligero con UI agresiva, hotkeys priorizadas y cero distracciones.",
  },
];

export function Dashboard() {
  const { profile } = useAppStore();
  const { status, launch, logs, clearLogs, selectedInstallId, setSelectedInstallId } = useLauncherStore();

  const isRunning = status === "running";
  const selectedInstall = INSTALLATIONS.find(i => i.id === selectedInstallId) || INSTALLATIONS[0];

  return (
    <div className="grid grid-cols-12 gap-8 h-full">
      {/* Columna Principal */}
      <div className="col-span-8 flex flex-col gap-8 overflow-y-auto pr-2 pb-8">
        
        {/* Hero Section */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 p-8 h-64 flex items-end shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
          <img 
            src="/src/assets/hero.png" 
            alt="Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <div className="relative z-20 w-full flex justify-between items-end">
            <div>
              <span className="px-3 py-1 bg-primary/20 text-primary text-xs font-bold rounded-full mb-3 inline-block border border-primary/30">
                {selectedInstall.channel}
              </span>
              <h1 className="text-4xl font-bold text-white mb-2">{selectedInstall.label}</h1>
              <p className="text-textMain/80 max-w-md">{selectedInstall.description}</p>
            </div>
            
            <Button 
              onClick={launch} 
              disabled={isRunning} 
              className={`py-4 px-10 text-xl font-bold ${isRunning ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
            >
              <FiPlay className={isRunning ? 'animate-pulse' : ''} />
              {isRunning ? 'Iniciando...' : 'JUGAR'}
            </Button>
          </div>
        </div>

        {/* Selección Rápida */}
        <Card>
          <SectionTitle 
            eyebrow="Instancias" 
            title="Selección Rápida" 
            subtitle="Cambia entre perfiles preconfigurados al instante." 
            icon={<FiStar />} 
          />
          <div className="grid grid-cols-2 gap-4">
            {INSTALLATIONS.map(inst => (
              <div 
                key={inst.id}
                onClick={() => setSelectedInstallId(inst.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedInstallId === inst.id 
                    ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(102,252,241,0.1)]" 
                    : "border-white/5 bg-surface/30 hover:bg-surface hover:border-white/20"
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-white">{inst.label}</h3>
                  <span className="text-xs text-textMain/60">{inst.vibe}</span>
                </div>
                <p className="text-xs text-textMain/80">{inst.channel}</p>
              </div>
            ))}
          </div>
        </Card>

      </div>

      {/* Columna Secundaria (Panel Lateral) */}
      <div className="col-span-4 flex flex-col gap-8 pb-8">
        
        <Card className="flex flex-col flex-1 max-h-[500px]">
          <SectionTitle 
            eyebrow="Sistema" 
            title="Consola Nebula" 
            subtitle="Telemetría en tiempo real." 
            icon={<FiTerminal />} 
            action={
              <button onClick={clearLogs} className="text-xs text-textMain/50 hover:text-primary transition-colors">
                Limpiar
              </button>
            }
          />
          <div className="flex-1 bg-background/80 rounded-xl p-4 font-mono text-xs overflow-y-auto border border-white/5 shadow-inner">
            {logs.length === 0 ? (
              <span className="text-textMain/30 italic">Esperando eventos del sistema...</span>
            ) : (
              <div className="space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="text-textMain/80 break-words">
                    <span className="text-primary/50 mr-2">{`>`}</span>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <SectionTitle 
            eyebrow="Sesión" 
            title="Snapshot Actual" 
            subtitle="Lectura rápida del entorno." 
            icon={<FiActivity />} 
          />
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-surface/50 p-3 rounded-lg border border-white/5">
               <span className="text-[10px] text-textMain uppercase tracking-widest block mb-1">Piloto</span>
               <strong className="text-white text-sm truncate block">{profile?.username}</strong>
             </div>
             <div className="bg-surface/50 p-3 rounded-lg border border-white/5">
               <span className="text-[10px] text-textMain uppercase tracking-widest block mb-1">Estado</span>
               <strong className={`text-sm ${status === 'running' ? 'text-secondary animate-pulse' : 'text-primary'}`}>
                 {status.toUpperCase()}
               </strong>
             </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
