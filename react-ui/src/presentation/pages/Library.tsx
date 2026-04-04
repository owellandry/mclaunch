import { FiCompass, FiDownloadCloud, FiLayers } from "react-icons/fi";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";

const INSTALLATIONS = [
  { id: "aurora", label: "Aurora Build", channel: "Curada", vibe: "PvE cinematic", desc: "Shaders suaves, HUD limpio y experiencia enfocada en exploracion." },
  { id: "pulse", label: "Pulse Ranked", channel: "Competitiva", vibe: "PvP veloz", desc: "Perfil ligero con UI agresiva, hotkeys priorizadas y cero distracciones." },
  { id: "forge", label: "Forge Atelier", channel: "Modpack", vibe: "Builders club", desc: "Stack creativo para mundos enormes, automatizacion y capturas bonitas." },
];

export function Library() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      <Card className="border-primary/20 shadow-[0_0_30px_rgba(74,222,128,0.05)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <SectionTitle
          eyebrow="Biblioteca"
          title="Instancias con personalidad"
          subtitle="Cada build tiene una intención visual y un mood diferente para el jugador."
          icon={<FiLayers />}
          action={
            <Button variant="secondary" icon={<FiDownloadCloud />}>
              Preparar sync
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-6 mt-8 relative z-10">
          {INSTALLATIONS.map((inst) => (
            <div key={inst.id} className="bg-surfaceLight/40 border border-white/10 p-6 hover:bg-surface/80 hover:border-primary/30 transition-all group mc-cutout">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold px-3 py-1 bg-white/5 text-textMuted uppercase tracking-wider mc-cutout-small">{inst.channel}</span>
                <span className="w-2 h-2 bg-primary shadow-[0_0_8px_rgba(74,222,128,0.8)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{inst.label}</h3>
              <p className="text-sm text-textMuted mb-6 min-h-[60px]">{inst.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary/80 uppercase tracking-widest font-bold">{inst.vibe}</span>
                <span className="text-[10px] text-black bg-primary px-2 py-0.5 font-bold uppercase tracking-widest mc-cutout-small">Ready</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-8">
        <Card>
          <SectionTitle
            eyebrow="Curaduría"
            title="Colección Destacada"
            subtitle="Bloques de contenido pensados para packs, mundos y presets."
            icon={<FiCompass />}
          />
          <div className="space-y-4">
            {["Collection Nebula", "World vault", "Mod presets"].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-surface/30 border border-white/5 mc-cutout-small">
                <div className="w-10 h-10 bg-surface border border-white/10 flex items-center justify-center text-primary mc-cutout-small">
                  <FiCompass />
                </div>
                <div>
                  <h4 className="text-white font-bold uppercase tracking-wider text-sm">{item}</h4>
                  <p className="text-xs text-textMuted font-mono">Work in progress</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
