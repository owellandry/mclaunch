import { useMemo, useRef, type ReactNode } from "react";
import {
  FiGlobe,
  FiRadio,
  FiServer,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Button } from "@/presentation/design-system";
import { gsap, useGSAP } from "@/presentation/lib/gsap";
import endBg from "@/assets/credits-end-bg.jpg";

const panelChrome =
  "rounded-2xl border border-white/[0.08] bg-[var(--surface-elevated)]/55 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl";

function SectionLabel({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span className="shrink-0 text-white/55">{icon}</span>
      <span className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
        {title}
      </span>
    </div>
  );
}

export function Servers() {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLElement>(null);

  const servers = useMemo(
    () => [
      {
        name: "Hypixel",
        ping: "24ms",
        players: "84k",
        mode: t("servers.events"),
        desc: t("servers.desc_hypixel"),
        accent: "#3B82F6",
        featured: true,
      },
      {
        name: "Wynncraft",
        ping: "45ms",
        players: "3.2k",
        mode: t("servers.survival"),
        desc: t("servers.desc_wynn"),
        accent: "#22D95D",
        featured: false,
      },
      {
        name: "MCC Island",
        ping: "30ms",
        players: "6.1k",
        mode: t("servers.creative"),
        desc: t("servers.desc_mcc"),
        accent: "#F59E0B",
        featured: false,
      },
      {
        name: "Mineville",
        ping: "38ms",
        players: "1.4k",
        mode: t("servers.events"),
        desc: t("servers.desc_mineville"),
        accent: "#A78BFA",
        featured: false,
      },
    ],
    [t],
  );

  const friends = useMemo(
    () => [
      { name: "NovaCraft", status: "online" as const, detail: "Hypixel · Bedwars" },
      { name: "AshenFox", status: "online" as const, detail: t("servers.in_lobby") },
      { name: "LimeKit", status: "away" as const, detail: t("servers.away") },
      { name: "PixelTide", status: "offline" as const, detail: t("servers.offline") },
    ],
    [t],
  );

  const spotlight = servers[0];

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(rootRef.current, { opacity: 0, duration: 0.2, ease: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const bg = rootRef.current?.querySelector<HTMLElement>("[data-servers-bg]");
        const intro = gsap.utils.toArray<HTMLElement>("[data-servers-intro] > *");
        const cards = gsap.utils.toArray<HTMLElement>("[data-servers-card]");

        if (bg) {
          gsap.fromTo(
            bg,
            { scale: 1.08, opacity: 0.8 },
            { scale: 1, opacity: 1, duration: 1.35, ease: "power2.out" },
          );
        }

        if (intro.length) {
          gsap.from(intro, {
            y: 28,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.7,
            stagger: 0.08,
            delay: 0.1,
            clearProps: "filter",
          });
        }

        if (cards.length) {
          gsap.from(cards, {
            y: 28,
            opacity: 0,
            duration: 0.6,
            stagger: 0.07,
            delay: 0.22,
            ease: "power3.out",
          });
        }
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section
      ref={rootRef}
      className="relative h-full overflow-y-auto overflow-x-hidden bg-[var(--surface-dashboard)]"
    >
      <div
        data-servers-bg
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${endBg})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/78 via-black/48 to-black/28" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(0deg,rgba(6,16,17,0.95)_0%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(52%,34rem)] bg-[linear-gradient(90deg,rgba(6,16,17,0.55)_0%,transparent_100%)]" />

      <div
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-10"
        style={{
          paddingLeft: "max(1rem, var(--hero-inset-left))",
          paddingRight: "var(--hero-inset-right)",
          paddingTop: "var(--hero-inset-top)",
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div data-servers-intro className="max-w-[min(40rem,100%)]">
            <span
              className="font-semibold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]"
              style={{ fontSize: "var(--hero-eyebrow-size)" }}
            >
              {t("servers.multiplayer")}
            </span>
            <h1
              className="mt-[clamp(0.7rem,1.8vh,1.35rem)] mb-[clamp(0.7rem,1.6vh,1.15rem)] font-black leading-[0.92] tracking-tight text-[var(--color-hero-heading)]"
              style={{ fontSize: "var(--hero-title-size)" }}
            >
              {t("servers.server_lounge")}
            </h1>
            <p
              className="max-w-[var(--hero-body-max)] leading-relaxed text-[var(--color-hero-description)]/80"
              style={{ fontSize: "var(--hero-body-size)" }}
            >
              {t("servers.lounge_desc")}
            </p>
          </div>

          <div data-servers-card>
            <Button variant="primary" icon={<FiZap />}>
              {t("servers.join_queue")}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-3 lg:col-span-8">
            <SectionLabel icon={<FiServer className="text-sm" />} title={t("servers.featured")} />

            <article
              data-servers-card
              className={`${panelChrome} relative overflow-hidden p-5 sm:p-6`}
              style={{
                backgroundImage: `radial-gradient(ellipse at 85% 20%, ${spotlight.accent}33, transparent 55%)`,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 max-w-xl">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]">
                    {t("servers.spotlight")}
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                    {spotlight.name}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-white/55">{spotlight.desc}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="font-mono text-xs font-bold text-primary">{spotlight.ping}</span>
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {spotlight.players} {t("servers.players")}
                  </span>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button variant="primary" icon={<FiGlobe />}>
                  {t("servers.connect")}
                </Button>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
                  {spotlight.mode}
                </span>
              </div>
            </article>

            <SectionLabel icon={<FiGlobe className="text-sm" />} title={t("servers.browse")} />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {servers.map((srv) => (
                <article
                  key={srv.name}
                  data-servers-card
                  className={`${panelChrome} group flex flex-col gap-4 p-4 transition-colors hover:bg-[var(--surface-elevated)]/70 sm:p-5`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: srv.accent }}
                          aria-hidden
                        />
                        <h3 className="truncate text-base font-black tracking-tight text-white">
                          {srv.name}
                        </h3>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">{srv.desc}</p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] font-bold text-primary/90">
                      {srv.ping}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
                    <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">
                      {srv.mode}
                    </span>
                    <button
                      type="button"
                      className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/65 transition-colors hover:text-white"
                    >
                      {t("servers.connect")}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-4">
            <SectionLabel icon={<FiUsers className="text-sm" />} title={t("servers.squad")} />

            <div data-servers-card className={`${panelChrome} overflow-hidden`}>
              <p className="border-b border-white/[0.06] px-4 py-3.5 text-sm leading-relaxed text-white/50">
                {t("servers.social_presence")}
              </p>
              <ul className="divide-y divide-white/[0.06]">
                {friends.map((friend) => (
                  <li key={friend.name} className="flex items-center gap-3 px-4 py-3.5">
                    <span
                      className={`size-2.5 shrink-0 rounded-full ${
                        friend.status === "online"
                          ? "bg-primary"
                          : friend.status === "away"
                            ? "bg-amber-400"
                            : "bg-white/25"
                      }`}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black tracking-tight text-white">
                        {friend.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-white/40">
                        {friend.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div data-servers-card className={`${panelChrome} flex flex-col gap-3 p-4`}>
              <div className="flex items-center gap-2.5">
                <FiRadio className="text-white/55" />
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
                  {t("servers.party")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/45">{t("servers.party_desc")}</p>
              <Button variant="secondary" icon={<FiUsers />} className="self-start">
                {t("servers.invite")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
