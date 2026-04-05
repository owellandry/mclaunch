import { FiCompass, FiDownloadCloud, FiLayers } from "react-icons/fi";
import { Card } from "../components/ui/Card";
import { SectionTitle } from "../components/ui/SectionTitle";
import { Button } from "../components/ui/Button";
import { useTranslation } from "react-i18next";

export function Library() {
  const { t } = useTranslation();

  const INSTALLATIONS = [
    { id: "aurora", label: "Aurora Build", channel: t("library.curated"), vibe: "PvE cinematic", desc: "Shaders suaves, HUD limpio y experiencia enfocada en exploracion." },
    { id: "pulse", label: "Pulse Ranked", channel: t("library.competitive"), vibe: "PvP veloz", desc: "Perfil ligero con UI agresiva, hotkeys priorizadas y cero distracciones." },
    { id: "forge", label: "Forge Atelier", channel: t("library.modpack"), vibe: "Builders club", desc: "Stack creativo para mundos enormes, automatizacion y capturas bonitas." },
  ];
  return (
    <div className="flex flex-col gap-8 pb-8">
      <Card className="border-primary/20 shadow-[0_0_30px_var(--color-primary-shadow)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <SectionTitle
          eyebrow={t("library.library")}
          title={t("library.instances")}
          subtitle={t("library.instances_desc")}
          icon={<FiLayers />}
          action={
            <Button variant="secondary" icon={<FiDownloadCloud />}>
              {t("library.prepare_sync")}
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-6 mt-8 relative z-10">
          {INSTALLATIONS.map((inst) => (
            <div key={inst.id} className="bg-surfaceLight/40 border border-black/5 p-6 hover:bg-surfaceLight/80 hover:border-primary/30 transition-all group mc-cutout">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold px-3 py-1 bg-black/5 text-textMuted uppercase tracking-wider mc-cutout-small">{inst.channel}</span>
                <span className="w-2 h-2 bg-primary shadow-[0_0_8px_var(--color-primary-shadow)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-xl font-black text-textMain mb-2 uppercase tracking-tight">{inst.label}</h3>
              <p className="text-sm text-textMuted mb-6 min-h-[60px]">{inst.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-primary/80 uppercase tracking-widest font-bold">{inst.vibe}</span>
                <span className="text-[10px] text-white bg-primary px-2 py-0.5 font-bold uppercase tracking-widest mc-cutout-small">{t("library.ready")}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-8">
        <Card>
          <SectionTitle
            eyebrow={t("library.curation")}
            title={t("library.featured_collection")}
            subtitle={t("library.featured_desc")}
            icon={<FiCompass />}
          />
          <div className="mt-6 bg-surfaceLight/30 border border-black/5 p-12 text-center text-textMuted uppercase tracking-widest text-sm font-bold mc-cutout border-dashed">
            [ {t("library.wip")} ]
          </div>
        </Card>
      </div>
    </div>
  );
}
