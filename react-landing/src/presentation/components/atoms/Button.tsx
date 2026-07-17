import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-white text-[var(--color-dark)] px-9 py-2.5 text-[12px] font-extrabold tracking-wide hover:bg-white/90 active:scale-[0.97] transition-all duration-200",
  secondary:
    "rounded-full px-5 py-2 text-[11px] font-bold text-white tracking-wide border border-white/[0.12] bg-white/[0.04] backdrop-blur-sm hover:bg-white/10 hover:border-white/20 active:scale-[0.97] transition-all duration-200",
  ghost:
    "rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white/50 hover:text-white hover:bg-white/5 transition-all duration-200",
  danger:
    "rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wide bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 transition-all duration-200",
};

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex cursor-pointer items-center justify-center gap-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon ? <span className="text-base leading-none">{icon}</span> : null}
      {children}
    </button>
  );
}
