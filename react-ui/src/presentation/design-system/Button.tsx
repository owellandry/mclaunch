import { useRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { gsap, useGSAP } from "@/presentation/lib/gsap";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "rounded-full bg-white text-[var(--color-dark)] px-9 py-2 text-[11px] font-extrabold tracking-wide hover:bg-white/90 active:scale-[0.98]",
  secondary:
    "rounded-full px-4 py-1.5 text-[10px] font-bold text-white tracking-wide border border-[var(--border-hero-secondary-alpha)] bg-[var(--surface-card-hover-alpha)] hover:bg-white/10",
  ghost:
    "rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-white/60 hover:text-white hover:bg-white/5",
  danger:
    "rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-wide bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20",
};

export function Button({
  variant = "primary",
  icon,
  children,
  className = "",
  onMouseEnter,
  onMouseLeave,
  ...props
}: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  useGSAP(
    (_context, contextSafe) => {
      const el = ref.current;
      if (!el || !contextSafe || variant === "ghost") return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const enter = contextSafe(() => {
          gsap.to(el, {
            scale: 1.035,
            duration: 0.28,
            ease: "power2.out",
            overwrite: "auto",
          });
        });
        const leave = contextSafe(() => {
          gsap.to(el, {
            scale: 1,
            duration: 0.32,
            ease: "power2.out",
            overwrite: "auto",
          });
        });

        el.addEventListener("pointerenter", enter);
        el.addEventListener("pointerleave", leave);
        return () => {
          el.removeEventListener("pointerenter", enter);
          el.removeEventListener("pointerleave", leave);
        };
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [variant] },
  );

  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer will-change-transform ${variants[variant]} ${className}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      {...props}
    >
      {icon ? <span className="text-base leading-none">{icon}</span> : null}
      {children}
    </button>
  );
}
