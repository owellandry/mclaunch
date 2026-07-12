import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  back?: ReactNode;
};

export function PageHeader({ eyebrow, title, description, action, back }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0 max-w-2xl">
        {back}
        {eyebrow ? (
          <span className="text-xs font-semibold tracking-wide text-[var(--color-hero-eyebrow)]">
            {eyebrow}
          </span>
        ) : null}
        <h1 className="mt-2 font-black leading-[0.95] tracking-tight text-[clamp(1.5rem,2.5vw,2.25rem)] text-[var(--color-hero-heading)]">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-hero-description)]/80 max-w-xl">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
