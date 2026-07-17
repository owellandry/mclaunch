import { FiDownload, FiMonitor, FiTerminal } from "react-icons/fi";
import { FaApple } from "react-icons/fa";
import { Button } from "../atoms/Button";
import { Card } from "../atoms/Card";
import type { DownloadOption } from "../../../domain/entities/OS";
import { useTranslation } from "react-i18next";

interface DownloadCardProps {
  option: DownloadOption;
  isRecommended?: boolean;
}

const osIcons: Record<string, React.ReactNode> = {
  windows: <FiMonitor size={22} />,
  mac: <FaApple size={20} />,
  linux: <FiTerminal size={20} />,
};

export function DownloadCard({ option, isRecommended }: DownloadCardProps) {
  const { t } = useTranslation();
  const osLabel = option.os === "mac" ? "macOS" : option.os;

  return (
    <Card
      interactive
      glass
      className={`group relative flex h-full flex-col gap-5 p-6 transition-all duration-300 hover:-translate-y-1 sm:p-7 ${
        isRecommended
          ? "border-primary/25 bg-primary/[0.04]"
          : ""
      }`}
    >
      {isRecommended ? (
        <span className="absolute -top-2.5 right-4 rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-primary backdrop-blur-xl">
          {t("download.recommended")}
        </span>
      ) : null}

      <div className="flex items-center gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.03] text-white/50 backdrop-blur-sm transition-all duration-300 group-hover:text-primary group-hover:border-primary/20">
          {osIcons[option.os] || <FiMonitor size={22} />}
        </span>
        <div>
          <h3 className="text-lg font-black capitalize tracking-tight text-white/90">
            {osLabel}
          </h3>
          <p className="mt-0.5 font-mono text-[11px] text-white/35">{option.filename}</p>
        </div>
      </div>

      <Button
        variant={isRecommended ? "primary" : "secondary"}
        className={`mt-auto w-full py-3 transition-all duration-200 ${
          isRecommended
            ? "hover:shadow-[0_0_30px_var(--color-primary-shadow)] hover:scale-[1.02] active:scale-[0.98]"
            : "hover:border-white/20"
        }`}
        icon={<FiDownload size={16} />}
        onClick={() => {
          if (option.url) window.location.href = option.url;
        }}
      >
        {option.label}
      </Button>
    </Card>
  );
}
