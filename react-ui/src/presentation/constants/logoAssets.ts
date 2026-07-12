export const DEFAULT_LOGO_ID = "logo_gren.svg";

export const LOGO_IDS = [
  "logo_gren.svg",
  "logo_blue.svg",
  "logo_lemon.svg",
  "logo_purple.svg",
  "logo_yellow.svg",
] as const;

export type LogoId = (typeof LOGO_IDS)[number];

export function getLogoSrc(logo: string) {
  const selectedLogo = LOGO_IDS.includes(logo as LogoId) ? logo : DEFAULT_LOGO_ID;
  return `/logo/${selectedLogo}`;
}
