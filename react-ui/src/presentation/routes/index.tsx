/**
 * @file index.tsx
 * @description Configuración central del enrutador de la aplicación usando react-router-dom.
 * Define la jerarquía de rutas, separando las rutas públicas (Onboarding) de las rutas privadas
 * que requieren autenticación (Dashboard, Library, etc.) protegidas por PrivateRoute.
 */
import { createHashRouter, Navigate } from "react-router-dom";
import { MainLayout } from "../components/templates/MainLayout";
import { Onboarding } from "../pages/Onboarding";
import { Dashboard } from "../pages/Dashboard";
import { Library } from "../pages/Library";
import { Servers } from "../pages/Servers";
import { Settings } from "../pages/Settings";
import { SkinStudio } from "../pages/SkinStudio";
import { PrivateRoute } from "./PrivateRoute";
import { PublicRoute } from "./PublicRoute";

export const router = createHashRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        path: "/onboarding",
        element: <Onboarding />,
      }
    ]
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        path: "/",
        element: <MainLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", element: <Dashboard /> },
          { path: "library", element: <Library /> },
          { path: "servers", element: <Servers /> },
          { path: "profile", element: <SkinStudio /> },
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
