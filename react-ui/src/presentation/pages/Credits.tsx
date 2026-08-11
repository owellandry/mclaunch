import { useRef, type ReactNode } from "react";
import {
  FiAward,
  FiExternalLink,
  FiGithub,
  FiGlobe,
  FiHeart,
  FiMessageCircle,
} from "react-icons/fi";
import { useTranslation } from "react-i18next";
import {
  CREDIT_PEOPLE,
  SUPPORT_LINKS,
  openExternalUrl,
  type SupportLink,
} from "@/presentation/constants/credits";
import { gsap, useGSAP } from "@/presentation/lib/gsap";
import endBg from "@/assets/credits-end-bg.jpg";

/** Same glass language as the home activity panel */
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

function linkIcon(kind: SupportLink["kind"]) {
  if (kind === "discord") return <FiMessageCircle className="text-sm" />;
  if (kind === "github") return <FiGithub className="text-sm" />;
  return <FiGlobe className="text-sm" />;
}

export function Credits() {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(rootRef.current, { opacity: 0, duration: 0.2, ease: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const bg = rootRef.current?.querySelector<HTMLElement>("[data-credits-bg]");
        const intro = gsap.utils.toArray<HTMLElement>("[data-credits-intro] > *");
        const cards = gsap.utils.toArray<HTMLElement>("[data-credits-card]");

        if (bg) {
          gsap.fromTo(
            bg,
            { scale: 1.08, opacity: 0.85 },
            { scale: 1, opacity: 1, duration: 1.4, ease: "power2.out" },
          );
        }

        if (intro.length) {
          gsap.from(intro, {
            y: 28,
            opacity: 0,
            filter: "blur(8px)",
            duration: 0.75,
            stagger: 0.08,
            delay: 0.12,
            clearProps: "filter",
          });
        }

        if (cards.length) {
          gsap.from(cards, {
            y: 32,
            opacity: 0,
            duration: 0.65,
            stagger: 0.1,
            delay: 0.28,
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
        data-credits-bg
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${endBg})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-[linear-gradient(0deg,rgba(6,16,17,0.92)_0%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(48%,32rem)] bg-[linear-gradient(90deg,rgba(6,16,17,0.55)_0%,transparent_100%)]" />

      <div
        className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-col gap-8 pb-10"
        style={{
          paddingLeft: "max(1rem, var(--hero-inset-left))",
          paddingRight: "var(--hero-inset-right)",
          paddingTop: "var(--hero-inset-top)",
        }}
      >
        <div data-credits-intro className="max-w-[min(40rem,100%)]">
          <span
            className="font-semibold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]"
            style={{ fontSize: "var(--hero-eyebrow-size)" }}
          >
            {t("credits.eyebrow")}
          </span>
          <h1
            className="mt-[clamp(0.7rem,1.8vh,1.35rem)] mb-[clamp(0.7rem,1.6vh,1.15rem)] font-black leading-[0.92] tracking-tight text-[var(--color-hero-heading)]"
            style={{ fontSize: "var(--hero-title-size)" }}
          >
            {t("credits.title")}
          </h1>
          <p
            className="max-w-[var(--hero-body-max)] leading-relaxed text-[var(--color-hero-description)]/80"
            style={{ fontSize: "var(--hero-body-size)" }}
          >
            {t("credits.description")}
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col gap-3 lg:col-span-7">
            <SectionLabel icon={<FiHeart className="text-sm" />} title={t("credits.team")} />

            <div className="flex flex-col gap-3">
              {CREDIT_PEOPLE.map((person) => (
                <article
                  key={person.id}
                  data-credits-card
                  className={`${panelChrome} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5`}
                >
                  {person.avatarUrl ? (
                    <img
                      src={person.avatarUrl}
                      alt=""
                      aria-hidden
                      className="size-14 shrink-0 rounded-xl border border-white/[0.08] object-cover"
                    />
                  ) : (
                    <div
                      className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] text-sm font-black tracking-wide text-white"
                      style={{
                        background: `linear-gradient(145deg, ${person.accent}33, transparent 72%)`,
                      }}
                      aria-hidden
                    >
                      {person.initials}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black tracking-tight text-white sm:text-lg">
                        {person.name}
                      </h3>
                      <span className="rounded-full bg-white/[0.08] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">
                        {t(`credits.roles.${person.roleKey}`)}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/50">
                      {t(`credits.bios.${person.bioKey}`)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openExternalUrl(person.url)}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 self-start text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-hero-eyebrow)] transition-colors hover:text-white sm:self-center"
                  >
                    {t("credits.visit_profile")}
                    <FiExternalLink className="text-[1.05em]" />
                  </button>
                </article>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-5">
            <SectionLabel icon={<FiAward className="text-sm" />} title={t("credits.support_title")} />

            <div data-credits-card className={`${panelChrome} overflow-hidden`}>
              <p className="border-b border-white/[0.06] px-4 py-3.5 text-sm leading-relaxed text-white/50">
                {t("credits.support_desc")}
              </p>

              <div className="divide-y divide-white/[0.06]">
                {SUPPORT_LINKS.map((link) => (
                  <button
                    key={link.id}
                    type="button"
                    onClick={() => openExternalUrl(link.url)}
                    className="group flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="shrink-0 text-white/55 transition-colors group-hover:text-primary">
                      {linkIcon(link.kind)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-black tracking-tight text-white">
                        {t(`credits.links.${link.labelKey}`)}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-white/40">
                        {t(`credits.link_hints.${link.hintKey}`)}
                      </span>
                    </span>
                    <FiExternalLink className="shrink-0 text-sm text-white/25 transition-colors group-hover:text-primary" />
                  </button>
                ))}
              </div>
            </div>

            <div data-credits-card className={`${panelChrome} px-4 py-4`}>
              <p className="text-sm leading-relaxed text-white/70">{t("credits.thanks")}</p>
              <p className="mt-3 text-[11px] leading-relaxed text-white/35">
                {t("credits.trademark")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
