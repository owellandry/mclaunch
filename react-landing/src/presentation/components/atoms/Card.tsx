/**
 * @file Card.tsx
 * @description Componente atómico Card. Un contenedor básico con estilo glassmorphism.
 *
 * Patrón: Atomic Design
 */
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  cutout?: boolean;
}

export function Card({ children, className = "", cutout = true }: CardProps) {
  return (
    <div className={`glass-panel p-8 md:p-10 ${cutout ? 'mc-cutout' : 'rounded-2xl'} ${className}`}>
      {children}
    </div>
  );
}
