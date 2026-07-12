import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: ReactNode;
  label: string;
  className?: string;
};

export function EmptyState({ icon, label, className = "" }: EmptyStateProps) {
  return (
    <div
      className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-8 text-center text-xs font-bold uppercase tracking-[0.22em] text-white/40 ${className}`}
    >
      {icon ? <div className="text-2xl opacity-50">{icon}</div> : null}
      <span>{label}</span>
    </div>
  );
}
