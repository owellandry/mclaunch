/**
 * @file OS.ts
 * @description Entidad que define los sistemas operativos soportados por MC Launch.
 */
export type OS = "windows" | "mac" | "linux" | "unknown";

export interface DownloadOption {
  os: OS;
  label: string;
  filename: string;
  url: string;
}
