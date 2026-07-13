import { HeroMain } from "@/presentation/features/dashboard/hero/HeroMain";
import { HeroActionsRow } from "@/presentation/features/dashboard/hero/HeroActions";
import { HeroRightPanel } from "@/presentation/features/dashboard/hero/HeroRightPanel";

export type HeroSectionProps = {
  heroBgImage: string;
  versionId: string;
  versionType: string;
  isInstalled: boolean;
  memoryMb: number;
  hoursPlayed: number;
  playerName: string;
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
  playerName,
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
  return (
    <section
      className="relative h-full overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroBgImage})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[200px] bg-[linear-gradient(0deg,var(--color-dark)_0%,transparent_100%)]" />

      <div
        className="absolute inset-0 z-10 flex min-h-0 min-w-0"
        style={{
          paddingLeft: "var(--hero-inset-left)",
          paddingRight: "var(--hero-inset-right)",
          paddingTop: "var(--hero-inset-top)",
          paddingBottom: "var(--hero-inset-bottom)",
        }}
      >
        <div className="flex min-h-0 min-w-0 flex-1 flex-col justify-between">
          <HeroMain
            versionId={versionId}
            versionType={versionType}
            isInstalled={isInstalled}
            memoryMb={memoryMb}
            hoursPlayed={hoursPlayed}
            playerName={playerName}
          />
          <HeroActionsRow
            isLaunchDisabled={isLaunchDisabled}
            launchLabel={launchLabel}
            onLaunch={onLaunch}
          />
        </div>

        <div className="hidden min-h-0 min-w-0 shrink-0 basis-[min(26rem,40%)] flex-col pl-4 lg:flex">
          <div className="flex min-h-0 flex-1 flex-col items-end justify-center overflow-y-auto">
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
      </div>
    </section>
  );
}
