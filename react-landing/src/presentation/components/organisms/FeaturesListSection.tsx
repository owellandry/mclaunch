import { useTranslation } from "react-i18next";
import { FiGrid, FiShield, FiEdit3, FiCpu } from "react-icons/fi";
import { Card } from "../atoms/Card";
import { Reveal } from "../atoms/Reveal";

export function FeaturesListSection() {
  const { t } = useTranslation();

  const features = [
    {
      icon: <FiGrid size={20} strokeWidth={1.5} />,
      title: t("features.f1_title"),
      desc: t("features.f1_desc"),
      delay: 0,
    },
    {
      icon: <FiShield size={20} strokeWidth={1.5} />,
      title: t("features.f2_title"),
      desc: t("features.f2_desc"),
      delay: 100,
    },
    {
      icon: <FiEdit3 size={20} strokeWidth={1.5} />,
      title: t("features.f3_title"),
      desc: t("features.f3_desc"),
      delay: 200,
    },
    {
      icon: <FiCpu size={20} strokeWidth={1.5} />,
      title: t("features.f4_title"),
      desc: t("features.f4_desc"),
      delay: 300,
    },
  ];

  return (
    <section id="features" className="relative w-full scroll-mt-24 py-16 sm:py-28">
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.015]" aria-hidden>
        <div className="absolute left-1/4 top-0 grid grid-cols-6 gap-1 -translate-x-1/2 -translate-y-1/3 rotate-12 scale-[2]">
          {Array.from({ length: 36 }, (_, i) => (
            <div
              key={i}
              className="size-4 border border-white/20"
              style={{
                background: i % 4 === 0 ? 'rgba(34, 217, 93, 0.12)' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <Reveal variant="fade-up">
        <div className="mb-12 max-w-2xl sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-white/40">
            {t("features.eyebrow")}
          </span>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white/90 sm:text-4xl">
            {t("features.title")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/45 sm:text-base">
            {t("features.subtitle")}
          </p>
        </div>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {features.map((f) => (
          <Reveal key={f.title} variant="fade-up" delay={f.delay}>
            <Card
              interactive
              glass
              className="group flex flex-col gap-4 p-6 sm:flex-row sm:items-start sm:gap-5 sm:p-7"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-primary/80 backdrop-blur-sm transition-all duration-300 group-hover:bg-primary/[0.06] group-hover:border-primary/20 group-hover:text-primary">
                {f.icon}
              </span>
              <div className="min-w-0">
                <h3 className="text-base font-black tracking-tight text-white/90 sm:text-lg">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/45">{f.desc}</p>
              </div>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
