import type { HeroSectionProps } from "@/presentation/features/dashboard/hero/HeroSection";
import { HeroSection } from "@/presentation/features/dashboard/hero/HeroSection";

type DashboardContentProps = HeroSectionProps;

export function DashboardContent(props: DashboardContentProps) {
  return (
    <div className="h-full w-full bg-[var(--surface-dashboard)]">
      <HeroSection {...props} />
    </div>
  );
}
