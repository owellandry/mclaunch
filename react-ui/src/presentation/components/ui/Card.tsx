import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  cutout?: boolean;
}

export function Card({ children, className = "", cutout = true }: CardProps) {
  return (
    <div className={`glass-panel p-6 ${cutout ? 'mc-cutout' : 'rounded-2xl'} ${className}`}>
      {children}
    </div>
  );
}
