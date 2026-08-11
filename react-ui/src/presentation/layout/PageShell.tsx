import { useRef, type ReactNode } from "react";
import { gsap, useGSAP } from "@/presentation/lib/gsap";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Scrollable content area for non-dashboard routes.
 * Respects titlebar + sidebar chrome via CSS layout tokens.
 */
export function PageShell({ children, className = "" }: PageShellProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.from(contentRef.current, { opacity: 0, duration: 0.2, ease: "none" });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const kids = gsap.utils.toArray<HTMLElement>(":scope > *", contentRef.current);
        if (!kids.length) return;

        gsap.from(kids, {
          y: 24,
          opacity: 0,
          filter: "blur(6px)",
          duration: 0.6,
          stagger: 0.09,
          ease: "power3.out",
          clearProps: "filter",
        });
      });

      return () => mm.revert();
    },
    { scope: contentRef },
  );

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[var(--surface-dashboard)]">
      <div
        ref={contentRef}
        className={`mx-auto w-full max-w-[1400px] px-4 pb-10 pt-[var(--layout-pt)] pl-[max(1rem,var(--layout-pl))] pr-4 sm:pr-6 ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
