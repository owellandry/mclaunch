import { FiGrid, FiHeart, FiLayers, FiServer, FiSettings } from "react-icons/fi";
import type { IconType } from "react-icons";

export type NavItem = {
  path: string;
  icon: IconType;
  /** i18n key under sidebar.* */
  labelKey: "dashboard" | "library" | "servers" | "credits" | "settings";
};

export const navItems: NavItem[] = [
  { path: "/dashboard", icon: FiGrid, labelKey: "dashboard" },
  { path: "/library", icon: FiLayers, labelKey: "library" },
  { path: "/servers", icon: FiServer, labelKey: "servers" },
  { path: "/credits", icon: FiHeart, labelKey: "credits" },
  { path: "/settings", icon: FiSettings, labelKey: "settings" },
];
