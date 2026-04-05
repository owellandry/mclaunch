import type { ReactNode } from "react";

interface SectionTitleProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon: ReactNode;
  action?: ReactNode;
}

export function SectionTitle({ eyebrow, title, subtitle, icon, action }: SectionTitleProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-surfaceLight border border-black/5 text-primary text-xl mc-cutout-small shadow-[0_0_15px_var(--color-primary-shadow)]">
          {icon}
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
            {eyebrow}
          </span>
          <h2 className="text-2xl font-black text-textMain mb-1 uppercase tracking-tight">{title}</h2>
          <p className="text-sm text-textMuted max-w-md">{subtitle}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
