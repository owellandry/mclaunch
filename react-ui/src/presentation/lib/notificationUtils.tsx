import type { ReactNode } from "react";
import { FiInfo, FiCheckCircle, FiAlertTriangle, FiXCircle } from "react-icons/fi";

export function getNotificationIcon(type: string): ReactNode {
  switch (type) {
    case 'success': return <FiCheckCircle className="text-primary" />;
    case 'warning': return <FiAlertTriangle className="text-yellow-500" />;
    case 'error': return <FiXCircle className="text-red-500" />;
    default: return <FiInfo className="text-blue-500" />;
  }
}

export function timeAgo(timestamp: number, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return t("topbar.just_now");
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return t("topbar.ago_m", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("topbar.ago_h", { count: hours });
  const days = Math.floor(hours / 24);
  return t("topbar.ago_d", { count: days });
}
