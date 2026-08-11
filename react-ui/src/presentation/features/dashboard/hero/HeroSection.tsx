import { useRef } from "react";
import { HeroMain } from "@/presentation/features/dashboard/hero/HeroMain";
import { HeroActionsRow } from "@/presentation/features/dashboard/hero/HeroActions";
import { HeroRightPanel } from "@/presentation/features/dashboard/hero/HeroRightPanel";
import { gsap, useGSAP } from "@/presentation/lib/gsap";

export type HeroSectionProps = {
  heroBgImage: string;
  versionId: string;
  versionType: string;
  isInstalled: boolean;
  memoryMb: number;
  hoursPlayed: number;
  isLaunchDisabled: boolean;
  launchLabel: string;
  onLaunch: () => void;
  weeklyActivity: number[];
  mobKills: number;
  deaths: number;
  blocksMined: number;
  downloadedCount: number;
  availableCount: number;
};

/**
 * The single functional dashboard hero: selected version, launch action,
 * live activity/stats, and navigation into launcher detail views.
 */
export function HeroSection({
  heroBgImage,
  versionId,
  versionType,
  isInstalled,
  memoryMb,
  hoursPlayed,
  isLaunchDisabled,
  launchLabel,
  onLaunch,
  weeklyActivity,
  mobKills,
  deaths,
  blocksMined,
  downloadedCount,
  availableCount,
}: HeroSectionProps) {
  const rootRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(rootRef.current, { opacity: 0, duration: 0.2, ease: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const bg = rootRef.current?.querySelector<HTMLElement>("[data-hero-bg]");
        const copy = gsap.utils.toArray<HTMLElement>("[data-hero-copy] > *");
        const actions = rootRef.current?.querySelector<HTMLElement>("[data-hero-actions]");
        const panels = rootRef.current?.querySelector<HTMLElement>("[data-hero-panel]");
        const bars = gsap.utils.toArray<HTMLElement>("[data-activity-bar]");

        if (bg) gsap.set(bg, { scale: 1.1, opacity: 0.85 });

        const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

        if (bg) {
          tl.to(bg, { scale: 1, opacity: 1, duration: 1.45, ease: "power2.out" }, 0);
        }

        if (copy.length) {
          tl.from(
            copy,
            {
              y: 32,
              opacity: 0,
              filter: "blur(10px)",
              duration: 0.8,
              stagger: 0.09,
            },
            0.12,
          );
        }

        if (actions) {
          tl.from(
            actions,
            { y: 24, opacity: 0, duration: 0.65 },
            0.42,
          );
        }

        if (panels) {
          tl.from(
            panels,
            {
              x: 36,
              opacity: 0,
              filter: "blur(6px)",
              duration: 0.75,
            },
            0.3,
          );
        }

        if (bars.length) {
          tl.from(
            bars,
            {
              scaleY: 0,
              transformOrigin: "50% 100%",
              duration: 0.55,
              stagger: { each: 0.045, from: "start" },
              ease: "power2.out",
            },
            0.55,
          );
        }

        if (bg) {
          gsap.to(bg, {
            scale: 1.045,
            duration: 16,
            ease: "sine.inOut",
            yoyo: true,
            repeat: -1,
            delay: 1.5,
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
      className="relative h-full overflow-hidden bg-[var(--surface-dashboard)]"
    >
      <div
        data-hero-bg
        className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${heroBgImage})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-[linear-gradient(0deg,rgba(6,16,17,0.92)_0%,transparent_100%)]" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[min(42%,28rem)] bg-[linear-gradient(90deg,rgba(6,16,17,0.55)_0%,transparent_100%)]" />

      <div
        className="absolute inset-0 z-10 flex min-h-0 min-w-0"
        style={{
          paddingLeft: "var(--hero-inset-left)",
          paddingRight: "var(--hero-inset-right)",
          paddingTop: "var(--hero-inset-top)",
          paddingBottom: "var(--hero-inset-bottom)",
        }}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-end gap-[clamp(1.25rem,3.5vh,2.25rem)] pb-1">
          <div data-hero-copy>
            <HeroMain
              versionId={versionId}
              versionType={versionType}
              isInstalled={isInstalled}
              memoryMb={memoryMb}
              hoursPlayed={hoursPlayed}
            />
          </div>
          <div data-hero-actions>
            <HeroActionsRow
              isLaunchDisabled={isLaunchDisabled}
              launchLabel={launchLabel}
              onLaunch={onLaunch}
            />
          </div>
        </div>

        <div className="hidden min-h-0 min-w-0 shrink-0 basis-[min(28rem,42%)] flex-col justify-end pl-6 lg:flex">
          <HeroRightPanel
            weeklyActivity={weeklyActivity}
            mobKills={mobKills}
            deaths={deaths}
            blocksMined={blocksMined}
            downloadedCount={downloadedCount}
            availableCount={availableCount}
          />
        </div>
      </div>
    </section>
  );
}
