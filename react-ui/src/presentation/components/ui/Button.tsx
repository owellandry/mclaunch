import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  icon?: ReactNode;
}

export function Button({ variant = "primary", icon, children, className = "", ...props }: ButtonProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 transition-all font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary/20 text-primary border border-primary/50 hover:bg-primary/30 px-5 py-2.5 shadow-[0_0_15px_rgba(102,252,241,0.2)]",
    secondary: "bg-surface text-textMain border border-white/10 hover:bg-white/10 px-5 py-2.5",
    ghost: "bg-transparent text-textMain hover:text-white hover:bg-white/5 px-4 py-2",
  };

  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {icon && <span className="text-lg">{icon}</span>}
      {children}
    </button>
  );
}
