import { FiGrid, FiLayers, FiServer, FiSettings } from "react-icons/fi";
import type { IconType } from "react-icons";

export const navItems: { path: string; icon: IconType }[] = [
  { path: "/dashboard", icon: FiGrid },
  { path: "/library", icon: FiLayers },
  { path: "/servers", icon: FiServer },
  { path: "/settings", icon: FiSettings },
];
