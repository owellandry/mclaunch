import { useTranslation } from "react-i18next";
import { FiShield } from "react-icons/fi";
import { Card } from "../components/atoms/Card";
import { Link } from "react-router-dom";

export function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-3xl py-12 sm:py-16 animate-[fade-in_0.35s_cubic-bezier(0.22,1,0.36,1)_forwards]">
      <Link
        to="/"
        className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white"
      >
        ← {t("nav.home")}
      </Link>

      <div className="mt-8 mb-10 flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[var(--surface-elevated)]">
          <FiShield className="text-primary" size={22} strokeWidth={1.75} />
        </span>
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-hero-eyebrow)]">
            {t("privacy.eyebrow")}
          </span>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-[var(--color-hero-heading)] sm:text-4xl">
            {t("privacy.title")}
          </h1>
        </div>
      </div>

      <div className="space-y-4 text-sm leading-relaxed text-white/55 sm:text-base">
        <p>{t("privacy.p1")}</p>
        <Card className="border-primary/20 bg-primary/5 p-5 sm:p-6">
          <p className="font-semibold text-white/80">{t("privacy.p2")}</p>
        </Card>
        <p>{t("privacy.p3")}</p>
      </div>
    </div>
  );
}
