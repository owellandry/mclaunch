import type { ReactNode } from "react";

type PageShellProps = {
  children: ReactNode;
  className?: string;
};

/**
 * Scrollable content area for non-dashboard routes.
 * Respects titlebar + sidebar chrome via CSS layout tokens.
 */
export function PageShell({ children, className = "" }: PageShellProps) {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden bg-[var(--surface-dashboard)]">
      <div
        className={`mx-auto w-full max-w-[1400px] px-4 pb-10 pt-[var(--layout-pt)] pl-[max(1rem,var(--layout-pl))] pr-4 sm:pr-6 animate-[fade-in_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards] ${className}`}
      >
        {children}
      </div>
    </div>
  );
}
