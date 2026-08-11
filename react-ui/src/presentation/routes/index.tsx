import { type ReactElement, Suspense, lazy } from "react";
import { createHashRouter, Navigate } from "react-router-dom";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";
import loginBgGif from "@/assets/login-bg.gif";

/** Full boot chrome — only for first paint / public routes, not tab switches. */
function RouteFallback() {
  return (
    <div className="fixed inset-0 z-[150] bg-black">
      <img
        src={loginBgGif}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-black/55" />
    </div>
  );
}

const MainLayout = lazy(() =>
  import("@/presentation/layout/MainLayout").then((module) => ({ default: module.MainLayout })),
);
const Onboarding = lazy(() =>
  import("@/presentation/pages/Onboarding").then((module) => ({ default: module.Onboarding })),
);
const Dashboard = lazy(() =>
  import("@/presentation/pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const ActivityDetails = lazy(() =>
  import("@/presentation/pages/ActivityDetails").then((module) => ({
    default: module.ActivityDetails,
  })),
);
const StatisticsDetails = lazy(() =>
  import("@/presentation/pages/StatisticsDetails").then((module) => ({
    default: module.StatisticsDetails,
  })),
);
const VersionsDetails = lazy(() =>
  import("@/presentation/pages/VersionsDetails").then((module) => ({
    default: module.VersionsDetails,
  })),
);
const Library = lazy(() =>
  import("@/presentation/pages/Library").then((module) => ({ default: module.Library })),
);
const Servers = lazy(() =>
  import("@/presentation/pages/Servers").then((module) => ({ default: module.Servers })),
);
const Settings = lazy(() =>
  import("@/presentation/pages/Settings").then((module) => ({ default: module.Settings })),
);
const Credits = lazy(() =>
  import("@/presentation/pages/Credits").then((module) => ({ default: module.Credits })),
);

const withBootSuspense = (element: ReactElement) => (
  <Suspense fallback={<RouteFallback />}>{element}</Suspense>
);

export const router = createHashRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/onboarding",
        element: withBootSuspense(<Onboarding />),
      },
    ],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/",
        element: withBootSuspense(<MainLayout />),
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          // Lazy pages — Suspense lives once in MainLayout (no full-screen flash).
          // KeepAliveOutlet caches visited pages so return visits stay warm.
          { path: "dashboard", element: <Dashboard /> },
          { path: "dashboard/activity", element: <ActivityDetails /> },
          { path: "dashboard/statistics", element: <StatisticsDetails /> },
          { path: "dashboard/versions", element: <VersionsDetails /> },
          { path: "library", element: <Library /> },
          { path: "servers", element: <Servers /> },
          { path: "credits", element: <Credits /> },
          { path: "profile", element: <Navigate to="/dashboard" replace /> },
          { path: "settings", element: <Settings /> },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
