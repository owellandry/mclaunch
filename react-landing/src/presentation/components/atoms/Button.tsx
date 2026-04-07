/**
 * @file Button.tsx
 * @description Componente atómico Button. Un botón estilizado y reutilizable.
 *
 * Patrón: Atomic Design
 */
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, children, className = "", ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-3 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    primary: "btn-primary mc-button-cutout",
    secondary: "btn-secondary mc-button-cutout",
    ghost: "bg-transparent text-white/60 hover:text-white px-4 py-2 uppercase tracking-widest",
    danger: "bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 mc-cutout-small",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="text-xl opacity-90">{icon}</span>}
      {children}
    </button>
  );
}
