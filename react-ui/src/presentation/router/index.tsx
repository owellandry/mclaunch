import { type ReactElement, Suspense, lazy } from "react";
import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../../application/store/useAppStore";

const MainLayout = lazy(() =>
  import("../components/layout/MainLayout").then((module) => ({ default: module.MainLayout }))
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

function AuthGuard() {
  const profile = useAppStore((state) => state.profile);

  if (!profile || !profile.isOnboardingCompleted) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}

export const router = createHashRouter([
  {
    path: "/onboarding",
    element: withSuspense(<Onboarding />),
  },
  {
    element: <AuthGuard />,
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
