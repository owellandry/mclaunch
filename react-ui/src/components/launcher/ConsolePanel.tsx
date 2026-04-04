import { FiActivity, FiRefreshCcw, FiTrash2 } from "react-icons/fi";
import { Card } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";
import type { LauncherStatus } from "../../types/launcher";

type ConsolePanelProps = {
  logs: string[];
  status: LauncherStatus;
  onClearLogs: () => void;
  onSimulateLog: () => void;
};

export function ConsolePanel({
  logs,
  status,
  onClearLogs,
  onSimulateLog,
}: ConsolePanelProps) {
  return (
    <Card className="panel-card console-card">
      <SectionTitle
        eyebrow="Console"
        title="Telemetria del launcher"
        subtitle="Logs visibles, accionables y mucho mas faciles de escanear."
        icon={<FiActivity />}
        action={
          <div className="section-actions">
            <button className="icon-button" onClick={onSimulateLog} type="button">
              <FiRefreshCcw />
            </button>
            <button className="icon-button" onClick={onClearLogs} type="button">
              <FiTrash2 />
            </button>
          </div>
        }
      />

      <div className="console-status-row">
        <span className={`status-dot status-dot-${status}`} />
        <strong>{status === "running" ? "Escuchando arranque" : "En espera de eventos"}</strong>
      </div>

      <div className="console-stream">
        {logs.length > 0 ? (
          logs.slice(-9).map((entry, index) => (
            <div className="console-line" key={`${entry}-${index}`}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <p>{entry}</p>
            </div>
          ))
        ) : (
          <div className="console-empty">
            <p>Sin logs por ahora. Cuando llegue actividad del launcher, aparecera aqui.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
