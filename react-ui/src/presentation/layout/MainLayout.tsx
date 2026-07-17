import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Titlebar } from "@/presentation/layout/Titlebar";
import { Sidebar } from "@/presentation/layout/Sidebar";
import { KeepAliveOutlet } from "@/presentation/layout/KeepAliveOutlet";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true'], [role='textbox']"));
}

export function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Esc → dashboard (default home of the launcher shell)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      if (isTypingTarget(event.target)) return;
      if (location.pathname === "/dashboard") return;

      event.preventDefault();
      navigate("/dashboard");
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [location.pathname, navigate]);

  return (
    <div className="flex h-screen w-screen relative overflow-hidden bg-[var(--surface-dashboard)]">
      <Titlebar />
      <Sidebar />
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden min-w-0">
        <KeepAliveOutlet />
      </main>
    </div>
  );
}
