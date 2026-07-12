import { Outlet, useLocation } from "react-router-dom";
import { Titlebar } from "@/presentation/layout/Titlebar";
import { Sidebar } from "@/presentation/layout/Sidebar";
import { PageShell } from "@/presentation/layout/PageShell";

export function MainLayout() {
  const location = useLocation();
  const isDashboard = location.pathname === "/dashboard";

  return (
    <div className="flex h-screen w-screen relative overflow-hidden bg-[var(--surface-dashboard)]">
      <Titlebar />
      <Sidebar />
      <main className="flex-1 flex flex-col relative z-10 overflow-hidden min-w-0">
        {isDashboard ? (
          <Outlet />
        ) : (
          <PageShell>
            <Outlet />
          </PageShell>
        )}
      </main>
    </div>
  );
}
