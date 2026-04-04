import { FiRadio, FiServer, FiUser, FiZap } from "react-icons/fi";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";

const SERVERS = [
  { name: "Atlas Realm", ping: "34 ms", mode: "Eventos", desc: "Temporada neón con hub social curado." },
  { name: "Northwatch", ping: "58 ms", mode: "Supervivencia", desc: "Ambiente calmado con herramientas de construcción." },
  { name: "Forge District", ping: "21 ms", mode: "Creativo", desc: "Lobby premium con parcelas y backups mock." },
];

export function Servers() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      <Card className="border-primary/20 shadow-[0_0_30px_#A1E9A50D]">
        <SectionTitle
          eyebrow="Multijugador"
          title="Lounge de Servidores"
          subtitle="Todo es mockup por ahora, pero la experiencia ya se siente social y viva."
          icon={<FiRadio />}
          action={
            <Button variant="secondary" icon={<FiZap />}>
              Unirse a la cola
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-6 mt-8">
          {SERVERS.map((srv) => (
            <div key={srv.name} className="bg-surfaceLight/40 border border-white/10 p-6 hover:bg-surface/80 hover:border-primary/30 transition-all mc-cutout">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-white">{srv.name}</h3>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 mc-cutout-small">{srv.ping}</span>
              </div>
              <p className="text-sm text-textMuted mb-6 h-10">{srv.desc}</p>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-[10px] uppercase tracking-widest text-textMuted font-bold">{srv.mode}</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary shadow-[0_0_8px_#A1E9A5CC] mc-cutout-small" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-white">En línea</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-8">
        <Card>
          <SectionTitle eyebrow="Destacados" title="Targets del mockup" subtitle="Espacios listos para slots sociales." icon={<FiServer />} />
          <div className="h-32 flex items-center justify-center border border-dashed border-white/10 bg-surface/20 mc-cutout-small">
             <span className="text-textMuted text-sm font-mono">Espacio para banners destacados</span>
          </div>
        </Card>
        
        <Card>
          <SectionTitle eyebrow="Squad" title="Presencia social" subtitle="Lista de amigos visual." icon={<FiUser />} />
          <div className="space-y-3">
            {[["LumaFox", "En lobby de Atlas Realm"], ["IronMint", "Armando modpack creativo"]].map(([name, detail]) => (
              <div key={name} className="flex items-center gap-4 bg-surface/30 p-3 border border-white/5 mc-cutout-small">
                <div className="w-10 h-10 bg-surface border border-white/10 flex items-center justify-center text-primary font-black mc-cutout-small">
                  {name.slice(0,1)}
                </div>
                <div>
                  <strong className="text-white text-sm block uppercase tracking-wider">{name}</strong>
                  <span className="text-[10px] text-textMuted font-mono">{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
