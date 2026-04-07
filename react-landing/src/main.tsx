/**
 * @file main.tsx
 * @description Punto de entrada principal de la landing page.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppRouter } from "./presentation/routes";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppRouter />
  </StrictMode>
);
