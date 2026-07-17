import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  glass?: boolean;
}

export function Card({ children, className = "", interactive = false, glass = false }: CardProps) {
  const base = glass
    ? "rounded-xl border border-white/[0.06] bg-[var(--surface-glass)] backdrop-blur-xl"
    : "rounded-xl border border-white/10 bg-[var(--surface-elevated)]";

  const hover = interactive
    ? "transition-all duration-300 hover:border-white/20 hover:bg-[var(--surface-card-hover-alpha)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)]"
    : "";

  return (
    <div className={`${base} ${hover} ${className}`}>
      {children}
    </div>
  );
}
