import { FiMinus, FiSquare, FiX } from "react-icons/fi";

export function WindowControls() {
  const minimize = () => window.api?.minimizeWindow?.();
  const maximize = () => window.api?.maximizeWindow?.();
  const close = () => window.api?.closeWindow?.();

  const base =
    "w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--surface-elevated)] border border-white/10 transition-colors cursor-pointer";

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={minimize}
        className={`${base} text-white/60 hover:text-white hover:border-primary/50`}
      >
        <FiMinus className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={maximize}
        className={`${base} text-white/60 hover:text-white hover:border-primary/50`}
      >
        <FiSquare className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={close}
        className={`${base} text-white/60 hover:text-white hover:bg-red-500/80 hover:border-red-400/50`}
      >
        <FiX className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
