import type { ReactNode } from "react";
import { useScrollReveal } from "../../lib/useScrollReveal";

type AnimationVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale-in";

interface RevealProps {
  children: ReactNode;
  variant?: AnimationVariant;
  delay?: number;
  className?: string;
  threshold?: number;
}

const variantClasses: Record<AnimationVariant, string> = {
  "fade-up": "translate-y-8",
  "fade-down": "-translate-y-8",
  "fade-left": "translate-x-8",
  "fade-right": "-translate-x-8",
  "scale-in": "scale-90",
};

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  className = "",
  threshold,
}: RevealProps) {
  const { ref, isVisible } = useScrollReveal({ threshold });

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${variantClasses[variant]} ${
        isVisible ? "!translate-x-0 !translate-y-0 !scale-100 opacity-100" : "opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
