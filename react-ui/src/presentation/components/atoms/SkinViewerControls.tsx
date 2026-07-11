/**
 * @file SkinViewerControls.tsx
 * @description Componente atómico SkinViewerControls. Selector único de modo de visualización 3D.
 *
 * Patrón: Atomic Design
 */
import { useTranslation } from "react-i18next";
import type { ViewerMode } from "./MinecraftSkinFigure";

type SkinViewerControlsProps = {
  viewerMode: ViewerMode;
  onChange: (mode: ViewerMode) => void;
};

const MODES: { value: ViewerMode; labelKey: string }[] = [
  { value: 'walking', labelKey: 'skin_studio.viewer_walk' },
  { value: 'running', labelKey: 'skin_studio.viewer_run' },
  { value: 'idle', labelKey: 'skin_studio.viewer_idle' },
  { value: 'waving', labelKey: 'skin_studio.viewer_wave' },
  { value: 'sitting', labelKey: 'skin_studio.viewer_sit' },
  { value: 'standing', labelKey: 'skin_studio.viewer_stand' },
];

export function SkinViewerControls({ viewerMode, onChange }: SkinViewerControlsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-center gap-1.5">
      {MODES.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-lg px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
            viewerMode === opt.value
              ? 'bg-primary text-white shadow-sm'
              : 'text-textMuted hover:text-textMain hover:bg-white/5 border border-white/10'
          }`}
        >
          {t(opt.labelKey)}
        </button>
      ))}
    </div>
  );
}
