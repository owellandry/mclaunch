import { FiAlertCircle, FiCheckCircle, FiLoader, FiMoon } from "react-icons/fi";
import type { LauncherStatus } from "../../types/launcher";

type StatusChipProps = {
  status: LauncherStatus;
};

const LABELS: Record<LauncherStatus, string> = {
  idle: "En espera",
  running: "Iniciando",
  done: "Listo",
  error: "Error",
};

const ICONS = {
  idle: FiMoon,
  running: FiLoader,
  done: FiCheckCircle,
  error: FiAlertCircle,
} satisfies Record<LauncherStatus, typeof FiMoon>;

export function StatusChip({ status }: StatusChipProps) {
  const Icon = ICONS[status];

  return (
    <span className={`status-chip status-${status}`}>
      <Icon />
      {LABELS[status]}
    </span>
  );
}
