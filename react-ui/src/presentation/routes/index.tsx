/**
 * @file index.tsx
 * @description Configuración central del enrutador de la aplicación usando react-router-dom.
 * Define la jerarquía de rutas, separando las rutas públicas (Onboarding) de las rutas privadas
 * que requieren autenticación (Dashboard, Library, etc.) protegidas por PrivateRoute.
 */
import { type ReactElement, Suspense, lazy } from "react";
import { createHashRouter, Navigate } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";

const MainLayout = lazy(() =>
  import("../components/templates/MainLayout").then((module) => ({ default: module.MainLayout }))
);
const Onboarding = lazy(() =>
  import("../pages/Onboarding").then((module) => ({ default: module.Onboarding }))
);
const Dashboard = lazy(() =>
  import("../pages/Dashboard").then((module) => ({ default: module.Dashboard }))
);
const Library = lazy(() =>
  import("../pages/Library").then((module) => ({ default: module.Library }))
);
const Servers = lazy(() =>
  import("../pages/Servers").then((module) => ({ default: module.Servers }))
);
const Settings = lazy(() =>
  import("../pages/Settings").then((module) => ({ default: module.Settings }))
);
const SkinStudio = lazy(() =>
  import("../pages/SkinStudio").then((module) => ({ default: module.SkinStudio }))
);

function RouteFallback() {
  return null;
}

const withSuspense = (element: ReactElement) => (
  <Suspense fallback={<RouteFallback />}>
    {element}
  </Suspense>
);

export const router = createHashRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/onboarding",
        element: withSuspense(<Onboarding />),
      }
    ]
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/",
        element: withSuspense(<MainLayout />),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: withSuspense(<Dashboard />) },
          { path: "library", element: withSuspense(<Library />) },
          { path: "servers", element: withSuspense(<Servers />) },
          { path: "profile", element: withSuspense(<SkinStudio />) },
          { path: "settings", element: withSuspense(<Settings />) },
        ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
