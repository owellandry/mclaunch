import { useMemo, useRef, type ReactNode } from "react";
import {
  FiBox,
  FiDownloadCloud,
  FiLayers,
  FiPlay,
  FiRefreshCw,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "@/application/store/useAppStore";
import { useLauncherStore } from "@/application/store/useLauncherStore";
import { getVersionArt } from "@/core/domain/versionArt";
import { Button } from "@/presentation/design-system";
import { gsap, useGSAP } from "@/presentation/lib/gsap";
import heroBg from "@/assets/hero.png";

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

type InstanceCard = {
  id: string;
  label: string;
  channel: string;
  vibe: string;
  desc: string;
  status: "ready" | "sync" | "missing";
  art?: string | null;
  isActive?: boolean;
};

export function Library() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const rootRef = useRef<HTMLElement>(null);
  const config = useAppStore((s) => s.config);
  const downloadedVersions = useLauncherStore((s) => s.downloadedVersions);
  const availableVersions = useLauncherStore((s) => s.availableVersions);
  const launch = useLauncherStore((s) => s.launch);
  const status = useLauncherStore((s) => s.status);

  const curatedFallback: InstanceCard[] = useMemo(
    () => [
      {
        id: "aurora",
        label: "Aurora Build",
        channel: t("library.curated"),
        vibe: t("library.vibe_explore"),
        desc: t("library.desc_aurora"),
        status: "ready",
      },
      {
        id: "pulse",
        label: "Pulse Ranked",
        channel: t("library.competitive"),
        vibe: t("library.vibe_pvp"),
        desc: t("library.desc_pulse"),
        status: "ready",
      },
      {
        id: "forge",
        label: "Forge Atelier",
        channel: t("library.modpack"),
        vibe: t("library.vibe_build"),
        desc: t("library.desc_forge"),
        status: "sync",
      },
    ],
    [t],
  );

  const instances: InstanceCard[] = useMemo(() => {
    if (!downloadedVersions.length) return curatedFallback;

    return downloadedVersions.slice(0, 8).map((id) => {
      const meta = availableVersions.find((v) => v.id === id);
      const type = meta?.type ?? "release";
      const channel =
        type === "snapshot"
          ? t("library.snapshot")
          : type === "old_beta" || type === "old_alpha"
            ? t("library.legacy")
            : t("library.release");

      return {
        id,
        label: id,
        channel,
        vibe: t("library.vibe_local"),
        desc: t("library.desc_installed", { version: id }),
        status: "ready" as const,
        art: getVersionArt(id),
        isActive: config.version === id,
      };
    });
  }, [availableVersions, config.version, curatedFallback, downloadedVersions, t]);

  const featured = useMemo(
    () => [
      { id: "packs", title: t("library.feat_packs"), hint: t("library.feat_packs_hint") },
      { id: "worlds", title: t("library.feat_worlds"), hint: t("library.feat_worlds_hint") },
      { id: "presets", title: t("library.feat_presets"), hint: t("library.feat_presets_hint") },
    ],
    [t],
  );

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(rootRef.current, { opacity: 0, duration: 0.2, ease: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const bg = rootRef.current?.querySelector<HTMLElement>("[data-library-bg]");
        const intro = gsap.utils.toArray<HTMLElement>("[data-library-intro] > *");
        const cards = gsap.utils.toArray<HTMLElement>("[data-library-card]");

        if (bg) {
          gsap.fromTo(
            bg,
            { scale: 1.08, opacity: 0.85 },
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
    { scope: rootRef, dependencies: [instances.length] },
  );

  const busy = status === "running" || status === "playing";

  return (
    <section
      ref={rootRef}
      className="relative h-full overflow-y-auto overflow-x-hidden bg-[var(--surface-dashboard)]"
    >
      <div
        data-library-bg
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/25" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[50%] bg-[linear-gradient(0deg,rgba(6,16,17,0.95)_0%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(52%,34rem)] bg-[linear-gradient(90deg,rgba(6,16,17,0.6)_0%,transparent_100%)]" />

      <div
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-10"
        style={{
          paddingLeft: "max(1rem, var(--hero-inset-left))",
          paddingRight: "var(--hero-inset-right)",
          paddingTop: "var(--hero-inset-top)",
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div data-library-intro className="max-w-[min(40rem,100%)]">
            <span
              className="font-semibold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]"
              style={{ fontSize: "var(--hero-eyebrow-size)" }}
            >
              {t("library.library")}
            </span>
            <h1
              className="mt-[clamp(0.7rem,1.8vh,1.35rem)] mb-[clamp(0.7rem,1.6vh,1.15rem)] font-black leading-[0.92] tracking-tight text-[var(--color-hero-heading)]"
              style={{ fontSize: "var(--hero-title-size)" }}
            >
              {t("library.instances")}
            </h1>
            <p
              className="max-w-[var(--hero-body-max)] leading-relaxed text-[var(--color-hero-description)]/80"
              style={{ fontSize: "var(--hero-body-size)" }}
            >
              {t("library.instances_desc")}
            </p>
          </div>

          <div data-library-card className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<FiRefreshCw />}
              onClick={() => navigate("/dashboard/versions")}
            >
              {t("library.manage_versions")}
            </Button>
            <Button variant="primary" icon={<FiDownloadCloud />} onClick={() => navigate("/dashboard/versions")}>
              {t("library.prepare_sync")}
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel icon={<FiLayers className="text-sm" />} title={t("library.your_builds")} />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {instances.map((inst) => {
              const art = inst.art || getVersionArt(inst.id) || heroBg;
              return (
                <article
                  key={inst.id}
                  data-library-card
                  className={`${panelChrome} group relative overflow-hidden`}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40 transition-opacity duration-500 group-hover:opacity-55"
                    style={{
                      backgroundImage: `linear-gradient(160deg, rgba(6,16,17,0.2), rgba(6,16,17,0.92)), url(${art})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  />
                  <div className="relative z-10 flex h-full flex-col gap-4 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">
                        {inst.channel}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          inst.status === "ready"
                            ? "text-[var(--color-dark)] bg-white px-2 py-0.5 rounded-md"
                            : "text-amber-200/90 bg-amber-400/15 border border-amber-300/20 px-2 py-0.5 rounded-md"
                        }`}
                      >
                        {inst.status === "ready" ? t("library.ready") : t("library.syncing")}
                      </span>
                    </div>

                    <div className="min-h-[5.5rem] flex-1">
                      <h3 className="text-lg font-black tracking-tight text-white">
                        {inst.label}
                        {inst.isActive ? (
                          <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-hero-eyebrow)]">
                            {t("library.active")}
                          </span>
                        ) : null}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/55">{inst.desc}</p>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] pt-3">
                      <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/90">
                        {inst.vibe}
                      </span>
                      <button
                        type="button"
                        disabled={busy || inst.status !== "ready"}
                        onClick={() => {
                          if (downloadedVersions.includes(inst.id)) {
                            const { config, setConfig } = useAppStore.getState();
                            setConfig({ ...config, version: inst.id });
                          }
                          launch();
                        }}
                        className="inline-flex cursor-pointer items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/70 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <FiPlay className="text-sm" />
                        {t("library.launch")}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <SectionLabel icon={<FiBox className="text-sm" />} title={t("library.featured_collection")} />
          <div data-library-card className={`${panelChrome} overflow-hidden`}>
            <p className="border-b border-white/[0.06] px-5 py-4 text-sm leading-relaxed text-white/50">
              {t("library.featured_desc")}
            </p>
            <div className="grid grid-cols-1 divide-y divide-white/[0.06] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {featured.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 px-5 py-5">
                  <h4 className="text-sm font-black tracking-tight text-white">{item.title}</h4>
                  <p className="text-xs leading-relaxed text-white/40">{item.hint}</p>
                  <span className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                    {t("library.wip")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
