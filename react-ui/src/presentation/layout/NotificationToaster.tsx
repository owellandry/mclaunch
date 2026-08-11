/**
 * @file NotificationToaster.tsx
 * @description Visible toast stack for new notifications (complements the bell badge).
 */
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import {
  useNotificationStore,
  type NotificationItem,
} from "@/application/store/useNotificationStore";
import { getNotificationIcon } from "@/presentation/lib/notificationUtils";
import { gsap, useGSAP } from "@/presentation/lib/gsap";

const TOAST_TTL_MS = 5200;

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.15 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          el,
          { opacity: 0, y: -16, x: 12, scale: 0.96 },
          { opacity: 1, y: 0, x: 0, scale: 1, duration: 0.45, ease: "power3.out" },
        );
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(toast.id), TOAST_TTL_MS);
    return () => window.clearTimeout(timer);
  }, [onDismiss, toast.id]);

  const accent =
    toast.type === "success"
      ? "border-primary/35"
      : toast.type === "warning"
        ? "border-amber-400/35"
        : toast.type === "error"
          ? "border-red-400/35"
          : "border-sky-400/30";

  return (
    <div
      ref={ref}
      role="status"
      className={`pointer-events-auto flex w-[min(22rem,calc(100vw-2rem))] gap-3 rounded-2xl border ${accent} bg-[var(--surface-elevated)]/95 p-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl`}
    >
      <div className="mt-0.5 shrink-0 text-base">{getNotificationIcon(toast.type)}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold tracking-tight text-white">{toast.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/55 line-clamp-3">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Dismiss"
      >
        <FiX />
      </button>
    </div>
  );
}

export function NotificationToaster() {
  const toasts = useNotificationStore((s) => s.toasts);
  const dismissToast = useNotificationStore((s) => s.dismissToast);

  if (typeof document === "undefined" || toasts.length === 0) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed top-[4.75rem] right-5 z-[120] flex flex-col gap-2.5 max-sm:right-3 max-sm:left-3 max-sm:items-stretch sm:items-end"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>,
    document.body,
  );
}
