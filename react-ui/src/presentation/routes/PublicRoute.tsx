/**
 * @file PublicRoute.tsx
 * @description Componente de ruta pública.
 * Puede utilizarse para redirigir a los usuarios ya autenticados lejos de las páginas de login/onboarding
 * si se desea, o simplemente renderizar el Outlet para páginas abiertas.
 */
import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../../application/store/useAppStore";

export function PublicRoute() {
  const profile = useAppStore((state) => state.profile);

  // Si el usuario ya completó el onboarding/login, no debería ver el onboarding nuevamente.
  if (profile && profile.isOnboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
