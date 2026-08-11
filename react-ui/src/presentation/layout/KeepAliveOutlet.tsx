import { Suspense, useRef, type ReactNode } from "react";
import { useOutlet, useLocation } from "react-router-dom";
import { PageShell } from "@/presentation/layout/PageShell";

/** Routes that own full-bleed layout (no PageShell padding). */
const FULL_BLEED = new Set(["/dashboard", "/credits", "/library", "/servers"]);

function isFullBleed(pathname: string): boolean {
  return FULL_BLEED.has(pathname);
}

/**
 * Keeps visited private routes mounted so switching tabs does not
 * remount pages, replay enter animations, or re-fetch cached data.
 *
 * Each entry has its own Suspense boundary so a lazy chunk load on a
 * *new* route never unmounts already-cached siblings.
 */
export function KeepAliveOutlet() {
  const outlet = useOutlet();
  const { pathname } = useLocation();
  const cacheRef = useRef<Map<string, ReactNode>>(new Map());

  // Only cache the first outlet instance per path so React keeps the same tree.
  if (outlet && !cacheRef.current.has(pathname)) {
    cacheRef.current.set(pathname, outlet);
  }

  const entries = Array.from(cacheRef.current.entries());

  return (
    <>
      {entries.map(([path, element]) => {
        const active = path === pathname;
        const body = isFullBleed(path) ? (
          element
        ) : (
          <PageShell>{element}</PageShell>
        );

        return (
          <div
            key={path}
            className={active ? "h-full min-h-0" : "hidden"}
            aria-hidden={!active}
            inert={!active ? true : undefined}
          >
            {/* Per-route Suspense: first visit may wait on a chunk; others stay warm */}
            <Suspense fallback={null}>{body}</Suspense>
          </div>
        );
      })}
    </>
  );
}
