import { FiDownload, FiMonitor } from "react-icons/fi";
import { Button } from "../atoms/Button";
import { Reveal } from "../atoms/Reveal";
import { useLandingStore } from "../../../application/store/useLandingStore";
import { useTranslation } from "react-i18next";

export function HeroSection() {
  const { recommendedDownload, os } = useLandingStore();
  const { t } = useTranslation();

  return (
    <section className="relative flex w-full flex-col items-start justify-center pb-16 pt-16 sm:pb-24 sm:pt-24 lg:min-h-[85vh] lg:pt-28">
      <div
        className="pointer-events-none absolute -inset-40 bg-[radial-gradient(ellipse_at_center,var(--color-primary-glow)_0%,transparent_60%)]"
        aria-hidden
      />

      <div className="pointer-events-none absolute -right-20 top-1/2 hidden -translate-y-1/2 opacity-[0.07] lg:block" aria-hidden>
        <img
          src="/logo_slaumcher.png"
          alt=""
          className="h-auto w-[400px] logo-float"
        />
      </div>

      <div className="pointer-events-none absolute right-16 top-16 hidden opacity-[0.03] lg:block" aria-hidden>
        <div className="grid grid-cols-4 gap-1">
          {Array.from({ length: 16 }, (_, i) => (
            <div
              key={i}
              className="size-2.5 rounded-sm border border-white/30"
              style={{
                background: i % 5 === 0 ? 'rgba(34, 217, 93, 0.15)' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div>
        <Reveal variant="fade-up" delay={0}>
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hero-secondary-alpha)] bg-[var(--color-primary)]/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]">
            <span className="size-1.5 rounded-full bg-[var(--color-hero-eyebrow)] animate-pulse" />
            {t("hero.badge")}
          </span>
        </Reveal>

        <Reveal variant="fade-up" delay={100}>
          <h1 className="mt-6 max-w-3xl font-black leading-[0.92] tracking-tight text-[var(--color-hero-heading)] text-[clamp(2.8rem,8vw,5.5rem)]">
            {t("hero.title_1")}{" "}
            <span className="relative inline-block text-primary">
              <span className="absolute inset-0 blur-2xl opacity-50 bg-primary" aria-hidden />
              <span className="relative [text-shadow:0_0_40px_var(--color-primary-shadow),0_0_80px_var(--color-primary-glow)]">
                {t("hero.title_brand")}
              </span>
            </span>
            <br />
            <span className="text-white/60">{t("hero.title_2")}</span>
          </h1>
        </Reveal>

        <Reveal variant="fade-up" delay={200}>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-white/60 sm:text-lg">
            {t("hero.desc")}
          </p>
        </Reveal>

        <Reveal variant="fade-up" delay={250}>
          <div className="mt-6 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["MHF_Steve", "MHF_Alex", "jeb_", "Notch"].map((name) => (
                <img
                  key={name}
                  src={`https://mc-heads.net/avatar/${name}/24`}
                  alt=""
                  className="size-7 rounded-md border border-white/10 [image-rendering:pixelated] ring-2 ring-[var(--surface-dashboard)]"
                  loading="lazy"
                />
              ))}
            </div>
            <span className="text-[12px] font-medium text-white/35 tracking-wide">
              +{t("hero.players")}
            </span>
          </div>
        </Reveal>

        <Reveal variant="fade-up" delay={300}>
          <div className="mt-8 flex flex-wrap items-center gap-3 sm:mt-10 sm:gap-4">
            <Button
              variant="primary"
              className="px-8 py-3 text-[13px] sm:px-10 transition-all duration-200 hover:shadow-[0_0_30px_var(--color-primary-shadow)] hover:scale-[1.03] active:scale-[0.97]"
              icon={<FiDownload size={18} />}
              onClick={() => {
                if (recommendedDownload) window.location.href = recommendedDownload.url;
              }}
            >
              {t("hero.btn_download")}
            </Button>
            <a href="#download">
              <Button variant="secondary" className="px-5 py-3">
                {t("hero.btn_all_platforms")}
              </Button>
            </a>
          </div>
        </Reveal>

        <Reveal variant="fade-up" delay={400}>
          <div className="mt-6 flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/50">
              <FiMonitor size={14} className="opacity-60" />
              {t("hero.detected")}{" "}
              <span className="text-white/80">{os === "unknown" ? "OS" : os}</span>
            </span>
            <span className="inline-flex items-center rounded-lg border border-primary/20 bg-primary/[0.05] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary/80">
              {t("hero.independent")}
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
