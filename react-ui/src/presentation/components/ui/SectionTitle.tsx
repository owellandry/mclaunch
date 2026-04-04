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
        <div className="p-3 bg-surface/50 rounded-lg text-primary text-xl shadow-[0_0_15px_rgba(102,252,241,0.1)]">
          {icon}
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary mb-1 block">
            {eyebrow}
          </span>
          <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
          <p className="text-sm text-textMain/80 max-w-md">{subtitle}</p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
