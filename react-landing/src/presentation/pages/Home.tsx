/**
 * @file Home.tsx
 * @description Página principal (Home). Agrupa el Hero y las Features.
 */
import { HeroSection } from "../components/organisms/HeroSection";
import { FeaturesListSection } from "../components/organisms/FeaturesListSection";
import { DownloadSection } from "../components/organisms/DownloadSection";

export function Home() {
  return (
    <div className="flex flex-col gap-10 sm:gap-12 w-full pb-16 sm:pb-20 animate-in fade-in duration-500">
      <HeroSection />
      <FeaturesListSection />
      <DownloadSection />
    </div>
  );
}
