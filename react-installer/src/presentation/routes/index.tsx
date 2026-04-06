import { createHashRouter, Navigate } from "react-router-dom";
import { InstallerLayout } from "../components/templates/InstallerLayout";
import { Welcome } from "../pages/Welcome";
import { Installing } from "../pages/Installing";
import { Done } from "../pages/Done";

export const router = createHashRouter([
  {
    element: <InstallerLayout><Welcome /></InstallerLayout>,
    path: "/",
  },
  {
    element: <InstallerLayout><Installing /></InstallerLayout>,
    path: "/install",
  },
  {
    element: <InstallerLayout><Done /></InstallerLayout>,
    path: "/done",
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);
