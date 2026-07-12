import { FiCompass, FiDownloadCloud, FiLayers } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, PageHeader, Panel } from "@/presentation/design-system";

export function Library() {
  const { t } = useTranslation();

  const installations = [
    {
      id: "aurora",
      label: "Aurora Build",
      channel: t("library.curated"),
      vibe: "PvE cinematic",
      desc: "Shaders suaves, HUD limpio y experiencia enfocada en exploracion.",
    },
    {
      id: "pulse",
      label: "Pulse Ranked",
      channel: t("library.competitive"),
      vibe: "PvP veloz",
      desc: "Perfil ligero con UI agresiva, hotkeys priorizadas y cero distracciones.",
    },
    {
      id: "forge",
      label: "Forge Atelier",
      channel: t("library.modpack"),
      vibe: "Builders club",
      desc: "Stack creativo para mundos enormes, automatizacion y capturas bonitas.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("library.library")}
        title={t("library.instances")}
        description={t("library.instances_desc")}
        action={
          <Button variant="secondary" icon={<FiDownloadCloud />}>
            {t("library.prepare_sync")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {installations.map((inst) => (
          <Panel key={inst.id} interactive className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45 bg-white/5 px-2.5 py-1 rounded-full">
                {inst.channel}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-dark)] bg-white px-2 py-0.5 rounded-full">
                {t("library.ready")}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">{inst.label}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55 min-h-[3.5rem]">{inst.desc}</p>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/90">
              {inst.vibe}
            </span>
          </Panel>
        ))}
      </div>

      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <FiCompass className="text-primary" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-hero-eyebrow)]">
              {t("library.curation")}
            </p>
            <h2 className="text-base font-black text-white">{t("library.featured_collection")}</h2>
          </div>
        </div>
        <EmptyState icon={<FiLayers />} label={t("library.wip")} />
      </Panel>
    </div>
  );
}
