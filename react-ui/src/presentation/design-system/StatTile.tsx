import type { ReactNode } from "react";
import { Panel } from "./Panel";

type StatTileProps = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function StatTile({ label, value, hint, icon, className = "" }: StatTileProps) {
  return (
    <Panel className={`flex flex-col gap-2 ${className}`}>
      {icon ? <div className="text-primary text-xl mb-1">{icon}</div> : null}
      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/50">
        {label}
      </span>
      <span className="text-2xl font-black tracking-tight text-white">{value}</span>
      {hint ? <span className="text-xs text-white/45">{hint}</span> : null}
    </Panel>
  );
}
