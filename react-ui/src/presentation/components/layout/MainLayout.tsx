import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function MainLayout() {
  return (
    <div className="flex h-screen w-screen bg-[#0a0a0a] p-4 relative overflow-hidden">
      {/* App Container - Rounded with dark background like the LoL screenshot */}
      <div className="flex w-full h-full bg-background border border-white/5 shadow-2xl relative rounded-[24px] overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-surface/30">
          <Topbar />
          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
