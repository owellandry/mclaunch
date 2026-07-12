import { FaDiscord } from "react-icons/fa";

/** Public Discord invite — change when the community URL is final. */
const DISCORD_URL = "https://discord.gg/";

function openExternalUrl(url: string) {
  try {
    const openExternal = window.api?.openExternal;
    if (typeof openExternal === "function") {
      void Promise.resolve(openExternal(url)).catch(() => {
        window.open(url, "_blank", "noopener,noreferrer");
      });
      return;
    }
  } catch {
    // fall through
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Vertical rail on the far right of the hero (where the color circles used to be).
 */
export function HeroSocialRail() {
  return (
    <div className="hidden shrink-0 flex-col items-center justify-center gap-3 xl:flex">
      <button
        type="button"
        onClick={() => openExternalUrl(DISCORD_URL)}
        aria-label="Discord"
        title="Discord"
        className="flex size-[min(48px,4.5vh)] cursor-pointer items-center justify-center rounded-full border border-white/25 bg-[#5865F2]/90 text-white shadow-[0_8px_24px_rgba(88,101,242,0.35)] transition-all hover:scale-105 hover:bg-[#5865F2] hover:border-white/40"
      >
        <FaDiscord className="text-[min(22px,2.2vh)]" />
      </button>
    </div>
  );
}
