import { FiRadio, FiServer, FiUser, FiZap } from "react-icons/fi";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";

const SERVERS = [
  { name: "Atlas Realm", ping: "34 ms", mode: "Eventos", desc: "Temporada neon con hub social curado." },
  { name: "Northwatch", ping: "58 ms", mode: "Survival", desc: "Ambiente calmado con builder tools visibles." },
  { name: "Forge District", ping: "21 ms", mode: "Creative", desc: "Lobby premium con parcelas y backups mock." },
];

export function Servers() {
  return (
    <div className="flex flex-col gap-8 pb-8">
      <Card className="border-secondary/20 shadow-[0_0_30px_rgba(69,162,158,0.05)]">
        <SectionTitle
          eyebrow="Multijugador"
          title="Lounge de Servidores"
          subtitle="Todo es mockup por ahora, pero la experiencia ya se siente social y viva."
          icon={<FiRadio />}
          action={
            <Button variant="secondary" icon={<FiZap />}>
              Join queue
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-6 mt-8">
          {SERVERS.map((srv) => (
            <div key={srv.name} className="bg-surface/40 border border-white/10 rounded-xl p-6 hover:bg-surface/80 hover:border-secondary/30 transition-all">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">{srv.name}</h3>
                <span className="text-xs font-mono text-secondary bg-secondary/10 px-2 py-1 rounded">{srv.ping}</span>
              </div>
              <p className="text-sm text-textMain/70 mb-6 h-10">{srv.desc}</p>
              <div className="flex justify-between items-center pt-4 border-t border-white/5">
                <span className="text-xs text-textMain/80">{srv.mode}</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                  <span className="text-xs text-white">Online</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-8">
        <Card>
          <SectionTitle eyebrow="Destacados" title="Targets del mockup" subtitle="Espacios listos para slots sociales." icon={<FiServer />} />
          <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-xl bg-surface/20">
             <span className="text-textMain/50 text-sm">Espacio para banners destacados</span>
          </div>
        </Card>
        
        <Card>
          <SectionTitle eyebrow="Squad" title="Presencia social" subtitle="Lista de amigos visual." icon={<FiUser />} />
          <div className="space-y-3">
            {[["LumaFox", "En lobby de Atlas Realm"], ["IronMint", "Armando modpack creativo"]].map(([name, detail]) => (
              <div key={name} className="flex items-center gap-4 bg-surface/30 p-3 rounded-lg border border-white/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-background font-bold">
                  {name.slice(0,1)}
                </div>
                <div>
                  <strong className="text-white text-sm block">{name}</strong>
                  <span className="text-xs text-textMain/70">{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
