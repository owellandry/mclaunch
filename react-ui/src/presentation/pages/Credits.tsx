import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { FaAward, FaDiscord, FaExternalLinkAlt, FaGlobe, FaHeart } from "react-icons/fa";
import { TfiGithub } from "react-icons/tfi";
import { useTranslation } from "react-i18next";
import { Button, PageHeader } from "@/presentation/design-system";
import {
  CREDIT_PEOPLE,
  SUPPORT_LINKS,
  openExternalUrl,
  type SupportLink,
} from "@/presentation/constants/credits";
import endBg from "@/assets/credits-end-bg.jpg";

/** Glass shell — border only softens slightly; light comes from shared spotlight */
const glassShell =
  "relative w-full min-w-0 overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 backdrop-blur-2xl transition-[border-color] duration-500 ease-out";

type SpotPointer = {
  /** Viewport coords */
  x: number;
  y: number;
  active: boolean;
};

const SpotContext = createContext<SpotPointer>({ x: 0, y: 0, active: false });

/**
 * One shared pointer for every glass card so the sheen feels continuous
 * when moving between neighbors (no hard on/off cut per card).
 */
function SpotlightRegion({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const [pointer, setPointer] = useState<SpotPointer>({
    x: 0,
    y: 0,
    active: false,
  });

  const onMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    setPointer({ x: e.clientX, y: e.clientY, active: true });
  }, []);

  const onLeave = useCallback(() => {
    setPointer((prev) => ({ ...prev, active: false }));
  }, []);

  return (
    <SpotContext.Provider value={pointer}>
      <div className={className} onMouseMove={onMove} onMouseLeave={onLeave}>
        {children}
      </div>
    </SpotContext.Provider>
  );
}

type SpotlightCardProps = {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "div" | "button";
};

/**
 * Soft frosted card. Samples the shared pointer so adjacent cards share
 * one continuous sheen instead of hard-cutting at the border.
 */
function SpotlightCard({
  children,
  className = "",
  onClick,
  as = "div",
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement | HTMLButtonElement | null>(null);
  const { x, y, active } = useContext(SpotContext);
  const [spot, setSpot] = useState({ lx: 0, ly: 0, opacity: 0, near: false });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (!active) {
      setSpot((s) => (s.opacity === 0 && !s.near ? s : { ...s, opacity: 0, near: false }));
      return;
    }

    const rect = el.getBoundingClientRect();
    const lx = x - rect.left;
    const ly = y - rect.top;

    // Distance from pointer to card rect (0 when inside)
    const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
    const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
    const dist = Math.hypot(dx, dy);

    // Soft falloff past the card edge so neighboring cards still pick up a bit of light
    const reach = 56;
    const opacity = dist <= 0 ? 1 : Math.max(0, 1 - dist / reach);
    const near = opacity > 0.02;

    setSpot({ lx, ly, opacity, near });
  }, [x, y, active]);

  const shellStyle = useMemo(
    () =>
      ({
        borderColor: spot.near
          ? `rgba(255,255,255,${0.06 + spot.opacity * 0.08})`
          : undefined,
      }) as CSSProperties,
    [spot.near, spot.opacity],
  );

  const spotlight = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          opacity: spot.opacity * 0.55,
          transition: "opacity 180ms ease-out",
          background: `radial-gradient(280px circle at ${spot.lx}px ${spot.ly}px, rgba(255,255,255,0.09), rgba(220,210,255,0.03) 38%, transparent 68%)`,
        }}
      />
      <div className={`relative z-10 ${className}`}>{children}</div>
    </>
  );

  if (as === "button") {
    return (
      <button
        ref={ref as RefObject<HTMLButtonElement>}
        type="button"
        onClick={onClick}
        className={`${glassShell} cursor-pointer text-left`}
        style={shellStyle}
      >
        {spotlight}
      </button>
    );
  }

  return (
    <div
      ref={ref as RefObject<HTMLDivElement>}
      className={glassShell}
      style={shellStyle}
    >
      {spotlight}
    </div>
  );
}

function linkIcon(kind: SupportLink["kind"]) {
  if (kind === "discord") return <FaDiscord />;
  if (kind === "github") return <TfiGithub />;
  return <FaGlobe />;
}

export function Credits() {
  const { t } = useTranslation();

  return (
    /*
     * Structure mirrors the dashboard hero so backdrop-blur works:
     * bg image lives on the same stacking root as the glass cards
     * (no transform-isolation between image and cards).
     */
    <div
      className="relative h-full overflow-y-auto overflow-x-hidden bg-cover bg-center bg-no-repeat animate-[fade-in_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]"
      style={{ backgroundImage: `url(${endBg})` }}
    >
      {/* Light scrims — enough for readability, not enough to kill the frosted glass */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/50 via-black/25 to-black/55"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(88,40,160,0.14)_0%,transparent_60%)]"
        aria-hidden
      />

      <div className="relative z-10 mx-auto w-full max-w-[1400px] px-4 pb-10 pt-[var(--layout-pt)] pl-[max(1rem,var(--layout-pl))] pr-4 sm:pr-6">
        <SpotlightRegion className="flex flex-col gap-8">
          <PageHeader
            eyebrow={t("credits.eyebrow")}
            title={t("credits.title")}
            description={t("credits.description")}
          />

          {/* People */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FaHeart className="text-primary" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                {t("credits.team")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {CREDIT_PEOPLE.map((person) => (
                <SpotlightCard
                  key={person.id}
                  className="flex h-full flex-col gap-5 sm:flex-row sm:items-stretch sm:px-5 sm:py-5"
                >
                  {person.avatarUrl ? (
                    <img
                      src={person.avatarUrl}
                      alt=""
                      aria-hidden
                      className="size-14 shrink-0 rounded-2xl border border-white/[0.06] object-cover"
                      style={{ boxShadow: `inset 0 0 0 1px ${person.accent}44` }}
                    />
                  ) : (
                    <div
                      className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/[0.06] text-base font-black tracking-wide text-white"
                      style={{
                        background: `linear-gradient(145deg, ${person.accent}33, transparent 70%)`,
                        boxShadow: `inset 0 0 0 1px ${person.accent}44`,
                      }}
                      aria-hidden
                    >
                      {person.initials}
                    </div>
                  )}

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-black tracking-tight text-white">
                        {person.name}
                      </h3>
                      <span className="rounded-full border border-white/[0.06] bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55">
                        {t(`credits.roles.${person.roleKey}`)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/55">
                      {t(`credits.bios.${person.bioKey}`)}
                    </p>
                    <div className="mt-4 flex justify-end sm:mt-auto sm:pt-4">
                      <Button
                        variant="secondary"
                        icon={<FaExternalLinkAlt />}
                        onClick={() => openExternalUrl(person.url)}
                      >
                        {t("credits.visit_profile")}
                      </Button>
                    </div>
                  </div>
                </SpotlightCard>
              ))}
            </div>
          </section>

          {/* Support & community */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <FaAward className="text-[var(--color-hero-eyebrow)]" />
              <h2 className="text-sm font-black uppercase tracking-[0.18em] text-white">
                {t("credits.support_title")}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-relaxed text-white/50">
              {t("credits.support_desc")}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {SUPPORT_LINKS.map((link) => (
                <SpotlightCard
                  key={link.id}
                  as="button"
                  onClick={() => openExternalUrl(link.url)}
                  className="group flex items-start gap-3"
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.04] text-lg text-primary transition-colors group-hover:border-white/15 group-hover:bg-white/[0.07]">
                    {linkIcon(link.kind)}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-black tracking-tight text-white">
                      {t(`credits.links.${link.labelKey}`)}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-white/45">
                      {t(`credits.link_hints.${link.hintKey}`)}
                    </span>
                  </span>
                  <FaExternalLinkAlt className="ml-auto mt-1 shrink-0 text-white/25 transition-colors group-hover:text-white/60" />
                </SpotlightCard>
              ))}
            </div>
          </section>

          <SpotlightCard className="sm:px-5 sm:py-5">
            <p className="text-sm leading-relaxed text-white/70">
              {t("credits.thanks")}
            </p>
            <p className="mt-3 max-w-3xl text-xs leading-relaxed text-white/40">
              {t("credits.trademark")}
            </p>
          </SpotlightCard>
        </SpotlightRegion>
      </div>
    </div>
  );
}
