import { Button } from "@/presentation/design-system";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

type HeroLaunchActionProps = {
  isLaunchDisabled: boolean;
  launchLabel: string;
  onLaunch: () => void;
};

export function HeroLaunchAction({
  isLaunchDisabled,
  launchLabel,
  onLaunch,
}: HeroLaunchActionProps) {
  return (
    <div className="relative z-10 shrink-0">
      <Button onClick={onLaunch} disabled={isLaunchDisabled} className="min-w-[114px]">
        {launchLabel}
      </Button>
    </div>
  );
}

export function HeroLibraryAction() {
  const { t } = useTranslation();
  return (
    <div className="relative z-10 shrink-0">
      <Link to="/library">
        <Button variant="secondary" type="button">
          {t("dashboard.games")} ›
        </Button>
      </Link>
    </div>
  );
}
