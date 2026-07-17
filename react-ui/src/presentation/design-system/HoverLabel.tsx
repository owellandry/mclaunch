import type { ReactNode } from "react";

type HoverLabelSide = "right" | "left" | "top" | "bottom";

type HoverLabelProps = {
  /** Designable label content (replaces native `title` tooltips). */
  label: ReactNode;
  children: ReactNode;
  side?: HoverLabelSide;
  className?: string;
  /** Extra classes for the floating label pill */
  labelClassName?: string;
  /** Disable the hover label (e.g. empty string) */
  disabled?: boolean;
};

const sideClass: Record<HoverLabelSide, string> = {
  right:
    "left-full top-1/2 ml-2.5 -translate-y-1/2 origin-left group-hover/hl:translate-x-0",
  left: "right-full top-1/2 mr-2.5 -translate-y-1/2 origin-right",
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2 origin-top",
};

/**
 * Styled hover label — use instead of native `title` / tooltip `alt`
 * so we can theme spacing, type, and motion.
 */
export function HoverLabel({
  label,
  children,
  side = "right",
  className = "",
  labelClassName = "",
  disabled = false,
}: HoverLabelProps) {
  if (disabled || label === null || label === undefined || label === "") {
    return <>{children}</>;
  }

  return (
    <span className={`group/hl relative inline-flex ${className}`}>
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-[80] whitespace-nowrap rounded-lg border border-white/10 bg-[var(--surface-elevated)]/95 px-2.5 py-1.5 text-[10px] font-bold tracking-[0.12em] text-white/90 opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-200 group-hover/hl:opacity-100 ${sideClass[side]} ${labelClassName}`}
      >
        {label}
      </span>
    </span>
  );
}
