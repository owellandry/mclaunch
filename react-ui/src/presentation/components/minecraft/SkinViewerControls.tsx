import { useTranslation } from "react-i18next";
import type { ViewerMode } from "./MinecraftSkinFigure";

type SkinViewerControlsProps = {
  viewerMode: ViewerMode;
  onChange: (mode: ViewerMode) => void;
};

const MODES: { value: ViewerMode; labelKey: string }[] = [
  { value: "walking", labelKey: "skin_studio.viewer_walk" },
  { value: "running", labelKey: "skin_studio.viewer_run" },
  { value: "idle", labelKey: "skin_studio.viewer_idle" },
  { value: "waving", labelKey: "skin_studio.viewer_wave" },
  { value: "sitting", labelKey: "skin_studio.viewer_sit" },
  { value: "standing", labelKey: "skin_studio.viewer_stand" },
];

export function SkinViewerControls({ viewerMode, onChange }: SkinViewerControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {MODES.map((opt) => {
        const active = viewerMode === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`cursor-pointer rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
              active
                ? "bg-white text-[var(--color-dark)]"
                : "border border-white/10 bg-black/25 text-white/55 hover:border-white/20 hover:text-white"
            }`}
          >
            {t(opt.labelKey)}
          </button>
        );
      })}
    </div>
  );
}
