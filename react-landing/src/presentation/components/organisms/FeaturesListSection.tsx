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
      <div className="text-center mb-24 relative z-10">
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-6">
          {t("features.title")}
        </h2>
        <p className="text-white/60 max-w-2xl mx-auto text-lg md:text-xl font-medium tracking-wide">
          {t("features.subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto relative z-10 px-4">
        {features.map((f, i) => (
          <div key={i} className="group relative p-10 bg-white/[0.02] border border-white/5 mc-cutout hover:bg-white/[0.04] transition-all duration-500 flex flex-col gap-6">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none mc-cutout" />
            <div className="flex-shrink-0 w-20 h-20 bg-black/50 border border-white/10 flex items-center justify-center mc-cutout-small">
              {f.icon}
            </div>
            <div className="flex flex-col">
              <h3 className="text-2xl font-bold text-white mb-3 uppercase tracking-tight">{f.title}</h3>
              <p className="text-base text-white/60 leading-relaxed font-medium">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Decorative background elements */}
      <div className="absolute top-1/2 -left-64 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 -right-64 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
    </section>
  );
}
