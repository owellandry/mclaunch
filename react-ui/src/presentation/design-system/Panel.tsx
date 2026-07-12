import type { ReactNode } from "react";

type PanelProps = {
  children?: ReactNode;
  className?: string;
  interactive?: boolean;
};

export function Panel({ children, className = "", interactive = false }: PanelProps) {
  return (
    <div
      className={`rounded-xl border border-white/10 bg-[var(--surface-elevated)] p-5 ${
        interactive
          ? "transition-colors hover:border-white/20 hover:bg-[var(--surface-card-hover-alpha)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
