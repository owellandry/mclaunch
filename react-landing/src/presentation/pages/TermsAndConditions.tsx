/**
 * @file TermsAndConditions.tsx
 * @description Página de Términos y Condiciones
 */
import { useTranslation } from "react-i18next";
import { FileText } from "lucide-react";

export function TermsAndConditions() {
  const { t } = useTranslation();

  return (
    <div className="w-full max-w-4xl mx-auto py-32 min-h-[85vh] animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
        <div className="w-20 h-20 bg-primary/10 flex items-center justify-center border border-primary/20 mc-cutout">
          <FileText className="text-primary" size={40} strokeWidth={1.5} />
        </div>
        <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
          {t("terms.title")}
        </h1>
      </div>

      <div className="space-y-10 text-white/60 font-medium leading-relaxed text-xl max-w-3xl">
        <p>{t("terms.p1")}</p>
        <p>{t("terms.p2")}</p>
        <div className="p-8 bg-white/[0.02] border-l-4 border-l-primary mc-cutout">
          <p className="text-white">{t("terms.p3")}</p>
        </div>
      </div>
    </div>
  );
}
