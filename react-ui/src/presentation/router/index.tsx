import { createHashRouter, Navigate, Outlet } from "react-router-dom";
import { MainLayout } from "../components/layout/MainLayout";
import { Onboarding } from "../pages/Onboarding";
import { Dashboard } from "../pages/Dashboard";
import { Library } from "../pages/Library";
import { Servers } from "../pages/Servers";
import { Settings } from "../pages/Settings";
import { useAppStore } from "../../application/store/useAppStore";

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
    element: <Onboarding />,
  },
  {
    element: <AuthGuard />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "library", element: <Library /> },
          { path: "servers", element: <Servers /> },
          { path: "settings", element: <Settings /> },
        ]
      }
    ]
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
