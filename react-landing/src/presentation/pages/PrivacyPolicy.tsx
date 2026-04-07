/**
 * @file PrivacyPolicy.tsx
 * @description Página de Políticas de Privacidad
 */
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

export function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-3xl mx-auto py-24 min-h-[85vh] animate-in fade-in duration-500">
      <div className="flex items-center gap-4 mb-12">
        <div className="w-16 h-16 bg-primary/10 flex items-center justify-center rounded-xl border border-primary/20 mc-cutout-small">
          <Shield className="text-primary" size={32} />
        </div>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-textMain">
          {t("privacy.title")}
        </h1>
      </div>

      <div className="space-y-8 text-textMuted font-medium leading-relaxed text-lg">
        <p>{t("privacy.p1")}</p>
        <div className="p-6 bg-surfaceLight/30 border-l-4 border-l-primary rounded-r-xl">
          <p className="text-textMain">{t("privacy.p2")}</p>
        </div>
        <p>{t("privacy.p3")}</p>
      </div>
    </div>
  );
}
