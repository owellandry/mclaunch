/**
 * @file FeaturesListSection.tsx
 * @description Sección de características con Grid Glassmorphism y detalles avanzados.
 */
import { useTranslation } from "react-i18next";
import { LayoutGrid, ShieldCheck, Paintbrush, Cpu } from "lucide-react";
import { Card } from "../atoms/Card";

export function FeaturesListSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <LayoutGrid className="text-primary" size={32} />,
      title: t("features.f1_title"),
      desc: t("features.f1_desc"),
    },
    {
      icon: <ShieldCheck className="text-primary" size={32} />,
      title: t("features.f2_title"),
      desc: t("features.f2_desc"),
    },
    {
      icon: <Paintbrush className="text-primary" size={32} />,
      title: t("features.f3_title"),
      desc: t("features.f3_desc"),
    },
    {
      icon: <Cpu className="text-primary" size={32} />,
      title: t("features.f4_title"),
      desc: t("features.f4_desc"),
    }
  ];

  return (
    <section id="features" className="relative w-full py-24 scroll-mt-20">
      <div className="text-center mb-16 relative z-10">
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-textMain mb-4">
          {t("features.title")}
        </h2>
        <p className="text-textMuted max-w-lg mx-auto text-sm md:text-base font-medium">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto relative z-10">
        {features.map((f, i) => (
          <Card key={i} className="p-8 flex gap-6 hover:bg-surface/90 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1">
            <div className="flex-shrink-0 w-16 h-16 bg-surfaceLight/50 rounded-xl flex items-center justify-center mc-cutout-small border border-white/5 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              {f.icon}
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-xl font-bold text-textMain mb-2 uppercase tracking-wide">{f.title}</h3>
              <p className="text-sm text-textMuted leading-relaxed">{f.desc}</p>
            </div>
          </Card>
        ))}
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
    </section>
  );
}
