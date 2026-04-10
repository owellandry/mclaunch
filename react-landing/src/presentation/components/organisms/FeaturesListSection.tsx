/**
 * @file FeaturesListSection.tsx
 * @description Sección de características con Grid Glassmorphism y detalles avanzados.
 */
import { useTranslation } from "react-i18next";
import { LayoutGrid, ShieldCheck, Paintbrush, Cpu } from "lucide-react";

export function FeaturesListSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <LayoutGrid className="text-primary" size={40} strokeWidth={1.5} />,
      title: t("features.f1_title"),
      desc: t("features.f1_desc"),
    },
    {
      icon: <ShieldCheck className="text-primary" size={40} strokeWidth={1.5} />,
      title: t("features.f2_title"),
      desc: t("features.f2_desc"),
    },
    {
      icon: <Paintbrush className="text-primary" size={40} strokeWidth={1.5} />,
      title: t("features.f3_title"),
      desc: t("features.f3_desc"),
    },
    {
      icon: <Cpu className="text-primary" size={40} strokeWidth={1.5} />,
      title: t("features.f4_title"),
      desc: t("features.f4_desc"),
    }
  ];

  return (
    <section id="features" className="relative w-full py-20 sm:py-24 lg:py-32 scroll-mt-20">
      
      {/* Minecraft-style Section Header */}
      <div className="max-w-6xl mx-auto px-4 mb-10 sm:mb-16">
        <div className="flex items-center gap-4 text-primary font-mono text-xs sm:text-base tracking-[0.2em] uppercase min-w-0">
          <div className="px-4 sm:px-6 py-2 bg-surface border-2 border-surfaceLight mc-cutout-small font-bold text-textMain shrink-0">
            01 // {t("features.title")}
          </div>
          <div className="flex-1 h-px border-t-2 border-dashed border-surfaceLight" />
        </div>
      </div>

      <div className="text-center mb-12 sm:mb-24 relative z-10">
        <p className="text-textMuted max-w-2xl mx-auto text-base sm:text-lg md:text-xl font-medium tracking-wide px-2 sm:px-0">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto relative z-10 px-4">
        {features.map((f, i) => (
          <div key={i} className="group relative p-6 sm:p-8 lg:p-10 bg-surface border-2 border-surfaceLight mc-cutout hover:border-primary/50 transition-all duration-500 flex flex-col gap-6 shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mc-cutout" />
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-background border-2 border-surfaceLight flex items-center justify-center mc-cutout-small">
              {f.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="text-xl sm:text-2xl font-bold text-textMain mb-3 uppercase tracking-tight">{f.title}</h3>
              <p className="text-base text-textMuted leading-relaxed font-medium">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 -left-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Decorative Line Separator */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-[120vw] sm:w-[110vw] overflow-hidden bg-textMain py-1.5 flex whitespace-nowrap rotate-1 z-20 pointer-events-none">
        <div className="animate-scroll_40s_linear_infinite flex gap-4 text-background font-bold font-mono text-[9px] sm:text-[10px] tracking-[0.24em] sm:tracking-[0.3em] uppercase px-2 opacity-50">
          {Array(15).fill(t("hero.ticker_3")).map((text, i) => (
            <span key={`feat-a-${i}`}>{text}</span>
          ))}
        </div>
        <div className="animate-scroll_40s_linear_infinite flex gap-4 text-background font-bold font-mono text-[9px] sm:text-[10px] tracking-[0.24em] sm:tracking-[0.3em] uppercase px-2 opacity-50">
          {Array(15).fill(t("hero.ticker_3")).map((text, i) => (
            <span key={`feat-b-${i}`}>{text}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
