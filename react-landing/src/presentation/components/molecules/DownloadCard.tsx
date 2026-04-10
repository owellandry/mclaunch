/**
 * @file DownloadCard.tsx
 * @description Componente molécula que presenta una opción de descarga y muestra si es recomendada.
 */
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import { DownloadOption } from "../../../domain/entities/OS";
import { Download } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DownloadCardProps {
  option: DownloadOption;
  isRecommended?: boolean;
}

export function DownloadCard({ option, isRecommended }: DownloadCardProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative transition-all hover:-translate-y-1 ${isRecommended ? 'z-20' : 'z-10'}`}>
      {isRecommended && (
        <div className="absolute -top-3 right-6 bg-primary text-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest mc-cutout-small shadow-[0_4px_0_var(--color-primary-hover)] z-[100]">
          {t("download.recommended")}
        </div>
      )}
      <Card className={`relative flex flex-col p-8 h-full ${isRecommended ? 'border-primary shadow-[0_0_30px_var(--color-primary-shadow)]' : 'border-surfaceLight opacity-80 hover:opacity-100 hover:border-primary/50'}`}>
        
        <div className="mb-8">
          <h3 className="text-xl font-black uppercase tracking-tight text-textMain mb-2">{option.os === "mac" ? "macOS" : option.os}</h3>
        </div>

        <Button variant={isRecommended ? "primary" : "secondary"} className="w-full mt-auto py-4" icon={<Download size={18} />}>
          {option.label}
        </Button>
      </Card>
    </div>
  );
}
