/**
 * @file PrivacyPolicy.tsx
 * @description Página de Políticas de Privacidad
 */
import { useTranslation } from "react-i18next";
import { Shield } from "lucide-react";

export function PrivacyPolicy() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto py-32 min-h-[85vh] animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
        <div className="w-20 h-20 bg-surface border-2 border-surfaceLight flex items-center justify-center mc-cutout">
          <Shield className="text-primary" size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-textMain">
          {t("privacy.title")}
        </h1>
      </div>

      <div className="space-y-10 text-textMuted font-medium leading-relaxed text-xl max-w-3xl">
        <p>{t("privacy.p1")}</p>
        <div className="p-8 bg-surface border-l-4 border-l-primary mc-cutout shadow-sm">
          <p className="text-textMain font-bold">{t("privacy.p2")}</p>
        </div>
        <p>{t("privacy.p3")}</p>
      </div>
    </div>
  );
}
