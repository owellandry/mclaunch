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
    <div className="flex flex-wrap justify-center gap-1.5">
      {MODES.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
            viewerMode === opt.value
              ? "bg-white text-[var(--color-dark)]"
              : "text-white/55 hover:text-white border border-white/10 bg-[var(--surface-elevated)]"
          }`}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}
