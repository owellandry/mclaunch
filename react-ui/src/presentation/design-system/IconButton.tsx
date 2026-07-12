import type { ButtonHTMLAttributes, ReactNode } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  children: ReactNode;
};

export function IconButton({ active = false, children, className = "", ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--surface-elevated)] border transition-colors cursor-pointer ${
        active
          ? "border-primary/50 text-white"
          : "border-white/10 text-white/60 hover:text-white hover:border-primary/50"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
