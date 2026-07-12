import type { CSSProperties } from "react";
import { FiSearch } from "react-icons/fi";
import { WindowControls } from "@/presentation/layout/WindowControls";
import { PlayerButton } from "@/presentation/layout/PlayerButton";
import { NotificationBell } from "@/presentation/layout/NotificationBell";
import { useAppStore } from "@/application/store/useAppStore";

export function Titlebar() {
  return (
    <div
      className="absolute top-0 right-0 z-30 flex w-max items-center gap-5 py-4 pr-6 pl-3 select-none max-lg:gap-3 max-lg:py-3 max-lg:pr-4"
      style={{ WebkitAppRegion: "no-drag" } as CSSProperties}
    >
      <div className="flex items-center gap-4 max-sm:gap-2">
        <SearchBox />
        <NotificationBell />
      </div>
      <div className="flex items-center gap-4 max-sm:gap-2">
        <PlayerButton />
        <WindowControls />
      </div>
    </div>
  );
}

function SearchBox() {
  const searchQuery = useAppStore((state) => state.searchQuery);
  const setSearchQuery = useAppStore((state) => state.setSearchQuery);
  return (
    <div className="flex items-center gap-3 bg-[var(--surface-elevated)] border border-white/10 px-4 py-2 w-64 max-lg:w-[min(12rem,25vw)] max-sm:hidden focus-within:border-primary/50 transition-colors rounded-lg cursor-text">
      <FiSearch className="text-white/60 shrink-0" />
      <input
        className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-white/50 font-mono cursor-text"
        placeholder="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
