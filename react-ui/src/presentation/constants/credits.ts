/**
 * Credits + community links for the launcher.
 * Update URLs here when Discord invite / socials change.
 */

export type CreditPerson = {
  id: string;
  /** Display name */
  name: string;
  /** i18n key under credits.roles.* */
  roleKey: "studio" | "development";
  /** Short i18n key under credits.bios.* */
  bioKey: "cubytlab" | "owellandry";
  /** Optional profile / site */
  url: string;
  /** Initials for avatar fallback */
  initials: string;
  /** Soft accent for the avatar chip */
  accent: string;
  /** Optional profile photo (e.g. GitHub avatar) */
  avatarUrl?: string;
};

export type SupportLink = {
  id: string;
  /** i18n key under credits.links.* */
  labelKey: "discord" | "website" | "github";
  /** i18n key under credits.link_hints.* */
  hintKey: "discord" | "website" | "github";
  url: string;
  kind: "discord" | "web" | "github";
};

export const CREDIT_PEOPLE: CreditPerson[] = [
  {
    id: "cubytlab",
    name: "cubytlab",
    roleKey: "studio",
    bioKey: "cubytlab",
    url: "https://cubyt.co/",
    initials: "CL",
    accent: "#22d95d",
  },
  {
    id: "owellandry",
    name: "owellandry",
    roleKey: "development",
    bioKey: "owellandry",
    url: "https://github.com/owellandry",
    initials: "OA",
    accent: "#4d8cff",
    avatarUrl: "https://avatars.githubusercontent.com/u/81540116?v=4",
  },
];

export const SUPPORT_LINKS: SupportLink[] = [
  {
    id: "discord",
    labelKey: "discord",
    hintKey: "discord",
    // TODO: replace with your permanent Slaumcher support invite
    url: "https://discord.gg/",
    kind: "discord",
  },
  {
    id: "website",
    labelKey: "website",
    hintKey: "website",
    url: "https://cubyt.co/",
    kind: "web",
  },
  {
    id: "github",
    labelKey: "github",
    hintKey: "github",
    url: "https://github.com/slaumcher",
    kind: "github",
  },
];

/** Open a URL via Electron when available, otherwise the browser. */
export function openExternalUrl(url: string): void {
  try {
    const openExternal = window.api?.openExternal;
    if (typeof openExternal === "function") {
      void Promise.resolve(openExternal(url)).catch(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
      return;
    }
  } catch {
    // Electron bridge incomplete
  }
  window.open(url, "_blank", "noopener,noreferrer");
}
