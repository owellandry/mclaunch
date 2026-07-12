import { FiGlobe, FiRadio, FiServer, FiUsers, FiZap } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button, EmptyState, PageHeader, Panel } from "@/presentation/design-system";

export function Servers() {
  const { t } = useTranslation();

  const servers = [
    { name: "Hypixel", ping: "24ms", mode: t("servers.events"), desc: "Minijuegos, Skyblock y más." },
    { name: "Wynncraft", ping: "45ms", mode: t("servers.survival"), desc: "El MMORPG definitivo en Minecraft." },
    { name: "MCC Island", ping: "30ms", mode: t("servers.creative"), desc: "Compite con tus amigos en MCC." },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow={t("servers.multiplayer")}
        title={t("servers.server_lounge")}
        description={t("servers.lounge_desc")}
        action={
          <Button variant="secondary" icon={<FiZap />}>
            {t("servers.join_queue")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {servers.map((srv) => (
          <Panel key={srv.name} interactive className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-black tracking-tight text-white">{srv.name}</h3>
              <span className="font-mono text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
                {srv.ping}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-white/55 min-h-[2.5rem]">{srv.desc}</p>
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
                {srv.mode}
              </span>
              <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                {t("servers.online")}
              </span>
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel>
          <div className="mb-4 flex items-center gap-3">
            <FiServer className="text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-hero-eyebrow)]">
                {t("servers.featured")}
              </p>
              <h2 className="text-base font-black text-white">{t("servers.mockup_targets")}</h2>
            </div>
          </div>
          <EmptyState icon={<FiGlobe />} label={t("servers.banner_space")} />
        </Panel>
        <Panel>
          <div className="mb-4 flex items-center gap-3">
            <FiRadio className="text-primary" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[var(--color-hero-eyebrow)]">
                {t("servers.squad")}
              </p>
              <h2 className="text-base font-black text-white">{t("servers.social_presence")}</h2>
            </div>
          </div>
          <EmptyState icon={<FiUsers />} label={t("library.wip")} />
        </Panel>
      </div>
    </div>
  );
}
