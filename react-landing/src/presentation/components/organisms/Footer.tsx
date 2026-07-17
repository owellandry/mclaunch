import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export function Footer() {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    void i18n.changeLanguage(lng);
  };

  const langs = [
    { id: "es", label: "ES" },
    { id: "en", label: "EN" },
    { id: "pt", label: "PT" },
  ] as const;

  return (
    <footer className="relative z-10 mt-auto w-full border-t border-white/[0.04]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8 lg:py-14">
        <div className="max-w-md">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <img
              src="/logo_slaumcher.png"
              alt="Slaumcher"
              className="size-7"
            />
            <strong className="text-sm font-black tracking-tight text-white/70">
              Slaumcher
            </strong>
          </Link>
          <p className="mt-4 text-xs leading-relaxed text-white/35">{t("footer.rights")}</p>
          <p className="mt-3 text-[11px] leading-relaxed text-white/25">{t("footer.disclaimer")}</p>
        </div>

        <div className="flex flex-col gap-8 sm:flex-row sm:gap-14">
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              {t("footer.section_legal")}
            </span>
            <Link
              to="/privacy"
              className="text-sm font-bold text-white/60 transition-colors hover:text-white/90"
            >
              {t("footer.privacy")}
            </Link>
            <Link
              to="/terms"
              className="text-sm font-bold text-white/60 transition-colors hover:text-white/90"
            >
              {t("footer.terms")}
            </Link>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
              {t("footer.section_language")}
            </span>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm p-1">
              {langs.map((lng) => {
                const active = i18n.language?.startsWith(lng.id);
                return (
                  <button
                    key={lng.id}
                    type="button"
                    onClick={() => changeLanguage(lng.id)}
                    className={`cursor-pointer rounded-full px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-200 ${
                      active
                        ? "bg-white text-[#08100C] shadow-sm"
                        : "text-white/40 hover:text-white/80"
                    }`}
                  >
                    {lng.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
