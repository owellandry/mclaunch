/**
 * @file index.tsx
 * @description Configuración de enrutamiento para la landing page.
 */
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { LandingLayout } from "../components/templates/LandingLayout";
import { Home } from "../pages/Home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingLayout><Home /></LandingLayout>,
  },
  {
    path: "*",
    element: <LandingLayout><Home /></LandingLayout>,
  }
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
