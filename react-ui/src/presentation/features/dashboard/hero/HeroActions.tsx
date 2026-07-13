import { Button } from "@/presentation/design-system";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type HeroActionsRowProps = {
  isLaunchDisabled: boolean;
  launchLabel: string;
  onLaunch: () => void;
};

/** Shared large sizing so hero CTAs match the rest of the dashboard scale. */
const heroBtnSize =
  "!min-h-[3.25rem] !px-8 !py-3.5 !text-sm !font-extrabold !tracking-[0.12em] !uppercase sm:!min-h-[3.5rem] sm:!px-10 sm:!text-[0.9375rem]";

/** Play/Download + Games side by side (same row). */
export function HeroActionsRow({
  isLaunchDisabled,
  launchLabel,
  onLaunch,
}: HeroActionsRowProps) {
  const { t } = useTranslation();

  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-3 sm:gap-4">
      <Button
        onClick={onLaunch}
        disabled={isLaunchDisabled}
        className={`${heroBtnSize} !min-w-[9.5rem] sm:!min-w-[11rem]`}
      >
        {launchLabel}
      </Button>
      <Link to="/library">
        <Button variant="secondary" type="button" className={`${heroBtnSize} !min-w-[8.5rem] sm:!min-w-[10rem]`}>
          {t("dashboard.games")} ›
        </Button>
      </Link>
    </div>
  );
}
