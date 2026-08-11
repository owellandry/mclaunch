import { Button } from "@/presentation/design-system";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type HeroActionsRowProps = {
  isLaunchDisabled: boolean;
  launchLabel: string;
  onLaunch: () => void;
};

const primarySize =
  "!min-h-[3rem] !px-9 !py-3 !text-sm !font-extrabold !tracking-[0.12em] !uppercase sm:!min-h-[3.25rem] sm:!px-10";

const secondarySize =
  "!min-h-[3rem] !px-6 !py-3 !text-xs !font-bold !tracking-[0.1em] !uppercase sm:!min-h-[3.25rem]";

/** Primary launch CTA + quieter library link, grouped with hero copy. */
export function HeroActionsRow({
  isLaunchDisabled,
  launchLabel,
  onLaunch,
}: HeroActionsRowProps) {
  const { t } = useTranslation();

  return (
    <div className="relative z-10 flex shrink-0 flex-wrap items-center gap-3">
      <Button
        onClick={onLaunch}
        disabled={isLaunchDisabled}
        className={`${primarySize} !min-w-[9rem] sm:!min-w-[10.5rem]`}
      >
        {launchLabel}
      </Button>
      <Link to="/library">
        <Button variant="secondary" type="button" className={secondarySize}>
          {t("dashboard.games")}
        </Button>
      </Link>
    </div>
  );
}
