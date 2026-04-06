/**
 * @file PrivateRoute.tsx
 * @description Componente de ruta protegida que verifica la autenticación del usuario.
 * Redirige a la pantalla de Onboarding si el usuario no ha completado el inicio de sesión.
 * Implementa el patrón de renderizado condicional con Outlet para las sub-rutas.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../../application/store/useAppStore";

export function PrivateRoute() {
  const profile = useAppStore((state) => state.profile);

  if (!profile || !profile.isOnboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
