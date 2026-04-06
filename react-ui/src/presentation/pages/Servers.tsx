/**
 * @file Servers.tsx
 * @description Página de Servidores. Lounge multijugador y lista de servidores sugeridos.
 * 
 * Patrón: Atomic Design
 */
import { FiRadio, FiServer, FiUser, FiZap, FiGlobe, FiUsers } from "react-icons/fi";
import { Card } from "../components/atoms/Card";
import { SectionTitle } from "../components/atoms/SectionTitle";
import { Button } from "../components/atoms/Button";
import { useTranslation } from "react-i18next";

export function Servers() {
  const { t } = useTranslation();

  const SERVERS = [
    { name: "Hypixel", ping: "24ms", players: "45K/100K", mode: t("servers.events"), desc: "Minijuegos, Skyblock y más." },
    { name: "Wynncraft", ping: "45ms", players: "2K/5K", mode: t("servers.survival"), desc: "El MMORPG definitivo en Minecraft." },
    { name: "MCC Island", ping: "30ms", players: "1K/2K", mode: t("servers.creative"), desc: "Compite con tus amigos en MCC." },
  ];
  return (
    <div className="flex flex-col gap-8 pb-8">
      <Card className="border-primary/20 shadow-[0_0_30px_var(--color-primary-shadow)]">
        <SectionTitle
          eyebrow={t("servers.multiplayer")}
          title={t("servers.server_lounge")}
          subtitle={t("servers.lounge_desc")}
          icon={<FiRadio />}
          action={
            <Button variant="secondary" icon={<FiZap />}>
              {t("servers.join_queue")}
            </Button>
          }
        />
        <div className="grid grid-cols-3 gap-6 mt-8">
          {SERVERS.map((srv) => (
            <div key={srv.name} className="bg-surfaceLight/40 border border-black/5 p-6 hover:bg-surfaceLight/80 hover:border-primary/30 transition-all mc-cutout">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black uppercase tracking-tight text-textMain">{srv.name}</h3>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 mc-cutout-small">{srv.ping}</span>
              </div>
              <p className="text-sm text-textMuted mb-6 h-10">{srv.desc}</p>
              <div className="flex justify-between items-center pt-4 border-t border-black/5">
                <span className="text-[10px] uppercase tracking-widest text-textMuted font-bold">{srv.mode}</span>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary shadow-[0_0_8px_var(--color-primary-shadow)] mc-cutout-small" />
                  <span className="text-[10px] uppercase tracking-widest font-bold text-textMain">{t("servers.online")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-8">
        <Card>
          <SectionTitle
            eyebrow={t("servers.featured")}
            title={t("servers.mockup_targets")}
            subtitle={t("servers.ready_slots")}
            icon={<FiServer />}
          />
          <div className="mt-6 bg-surfaceLight/30 border border-black/5 h-32 flex flex-col items-center justify-center text-textMuted uppercase tracking-widest text-sm font-bold mc-cutout border-dashed">
            <FiGlobe className="text-2xl mb-2 opacity-50" />
            {t("servers.banner_space")}
          </div>
        </Card>
        <Card>
          <SectionTitle
            eyebrow={t("servers.squad")}
            title={t("servers.social_presence")}
            subtitle={t("servers.visual_friends")}
            icon={<FiUser />}
          />
          <div className="mt-6 bg-surfaceLight/30 border border-black/5 h-32 flex flex-col items-center justify-center text-textMuted uppercase tracking-widest text-sm font-bold mc-cutout border-dashed">
            <FiUsers className="text-2xl mb-2 opacity-50" />
            [ {t("library.wip")} ]
          </div>
        </Card>
      </div>
    </div>
  );
}
