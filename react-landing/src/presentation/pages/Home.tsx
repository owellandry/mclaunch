/**
 * @file Home.tsx
 * @description Página principal (Home). Agrupa el Hero y las Features.
 */
import { HeroSection } from "../components/organisms/HeroSection";
import { FeaturesSection } from "../components/organisms/FeaturesSection";

export function Home() {
  return (
    <div className="flex flex-col gap-12 w-full pb-20">
      <HeroSection />
      <FeaturesSection />
    </div>
  );
}
