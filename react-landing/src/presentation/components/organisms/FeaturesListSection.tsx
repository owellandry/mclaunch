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
    <section id="features" className="relative w-full py-32 scroll-mt-20">
      
      {/* Minecraft-style Section Header */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <div className="flex items-center gap-4 text-primary font-mono text-sm sm:text-base tracking-[0.2em] uppercase">
          <div className="px-6 py-2 bg-surface border-2 border-surfaceLight mc-cutout-small font-bold text-textMain">
            01 // {t("features.title")}
          </div>
          <div className="flex-1 h-px border-t-2 border-dashed border-surfaceLight" />
        </div>
      </div>

      <div className="text-center mb-24 relative z-10">
        <p className="text-textMuted max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto relative z-10 px-4">
        {features.map((f, i) => (
          <div key={i} className="group relative p-10 bg-surface border-2 border-surfaceLight mc-cutout hover:border-primary/50 transition-all duration-500 flex flex-col gap-6 shadow-sm hover:shadow-md">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mc-cutout" />
            <div className="flex-shrink-0 w-20 h-20 bg-background border-2 border-surfaceLight flex items-center justify-center mc-cutout-small">
              {f.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-textMain mb-3 uppercase tracking-tight">{f.title}</h3>
              <p className="text-base text-textMuted leading-relaxed font-medium">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 -left-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />
    </section>
  );
}
