import { HeroSection } from "@/presentation/features/dashboard/hero/HeroSection";
import type { HeroSectionProps } from "@/presentation/features/dashboard/hero/HeroSection";

type DashboardContentProps = HeroSectionProps;

export function DashboardContent(props: DashboardContentProps) {
  return (
    <div className="h-full w-full animate-[fade-in_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards] bg-[var(--surface-dashboard)]">
      <HeroSection {...props} />
    </div>
  );
}
