import type { ReactNode } from "react";

type SectionTitleProps = {
  title: string;
  subtitle: string;
  eyebrow?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

export function SectionTitle({
  title,
  subtitle,
  eyebrow,
  icon,
  action,
}: SectionTitleProps) {
  return (
    <div className="section-title">
      <div className="section-title-main">
        {icon ? <div className="section-icon">{icon}</div> : null}
        <div>
          {eyebrow ? <span className="section-eyebrow">{eyebrow}</span> : null}
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {action ? <div className="section-title-action">{action}</div> : null}
    </div>
  );
}
