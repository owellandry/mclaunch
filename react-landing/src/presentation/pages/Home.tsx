import { HeroSection } from "../components/organisms/HeroSection";
import { FeaturesListSection } from "../components/organisms/FeaturesListSection";
import { DownloadSection } from "../components/organisms/DownloadSection";

export function Home() {
  return (
    <div className="flex w-full flex-col pb-10 animate-[fade-in_0.5s_cubic-bezier(0.22,1,0.36,1)_forwards]">
      <HeroSection />
      <FeaturesListSection />
      <DownloadSection />
    </div>
  );
}
