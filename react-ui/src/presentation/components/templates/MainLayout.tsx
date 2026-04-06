/**
 * @file MainLayout.tsx
 * @description Componente plantilla MainLayout. Estructura base de la aplicación (Sidebar a la izquierda, Topbar arriba y contenido al centro).
 * 
 * Patrón: Atomic Design
 */
import { Outlet } from "react-router-dom";
import { Sidebar } from "../organisms/Sidebar";
import { Topbar } from "../organisms/Topbar";

export function MainLayout() {
  return (
    <div className="flex h-screen w-screen bg-background relative overflow-hidden">
      <div className="flex w-full h-full relative">
        <Sidebar />
        <main className="flex-1 flex flex-col relative z-10 overflow-hidden bg-surface/50">
          <Topbar />
          <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 relative">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
