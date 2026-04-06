import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function MainLayout() {
  return (
    <div className="flex h-screen w-screen relative overflow-hidden">
      <div className="flex w-full h-full relative">
        <Sidebar />
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden">
          <Topbar />
          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
