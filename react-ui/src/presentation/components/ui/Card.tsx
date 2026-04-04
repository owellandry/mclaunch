import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`glass-panel p-6 ${className}`}>
      {children}
    </div>
  );
}
