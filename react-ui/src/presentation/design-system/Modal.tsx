import { useEffect, useCallback, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { FiX } from "react-icons/fi";
import { gsap } from "@/presentation/lib/gsap";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Hide the built-in close button when the child provides its own. */
  hideClose?: boolean;
};

export function Modal({
  open,
  onClose,
  children,
  className = "",
  hideClose = false,
}: ModalProps) {
  const [mounted, setMounted] = useState(open);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) setMounted(true);
  }, [open]);

  useEffect(() => {
    if (!mounted) return;
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mounted, onKeyDown]);

  useEffect(() => {
    if (!mounted) return;

    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (!backdrop || !panel) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animations: Array<gsap.core.Animation> = [];

    if (open) {
      if (reduce) {
        gsap.set([backdrop, panel], { opacity: 1, clearProps: "transform,filter" });
        return;
      }
      animations.push(
        gsap.fromTo(
          backdrop,
          { opacity: 0 },
          { opacity: 1, duration: 0.28, ease: "power2.out" },
        ),
        gsap.fromTo(
          panel,
          { opacity: 0, y: 28, scale: 0.94, filter: "blur(8px)" },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            filter: "blur(0px)",
            duration: 0.45,
            ease: "power3.out",
          },
        ),
      );
    } else if (reduce) {
      setMounted(false);
    } else {
      const tl = gsap.timeline({
        onComplete: () => setMounted(false),
      });
      tl.to(
        panel,
        {
          opacity: 0,
          y: 16,
          scale: 0.96,
          filter: "blur(4px)",
          duration: 0.28,
          ease: "power2.in",
        },
        0,
      ).to(backdrop, { opacity: 0, duration: 0.22, ease: "power2.in" }, 0.05);
      animations.push(tl);
    }

    return () => {
      animations.forEach((animation) => animation.kill());
    };
  }, [open, mounted]);

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        ref={backdropRef}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`relative z-10 flex max-h-[min(88vh,52rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/[0.1] bg-[var(--surface-elevated)]/95 shadow-[0_32px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl ${className}`}
      >
        {!hideClose ? (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <FiX className="text-lg" />
          </button>
        ) : null}
        {children}
      </div>
    </div>,
    document.body,
  );
}
