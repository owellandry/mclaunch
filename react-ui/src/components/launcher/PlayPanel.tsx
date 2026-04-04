import { FiArrowRight, FiCpu, FiLayers, FiPlay, FiZap } from "react-icons/fi";
import { Card } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";

type InstallationOption = {
  id: string;
  label: string;
  channel: string;
};

type PlayPanelProps = {
  version: string;
  canPlay: boolean;
  isRunning: boolean;
  memoryMb: number;
  installations: InstallationOption[];
  selectedInstall: string;
  onVersionChange: (value: string) => void;
  onInstallChange: (value: string) => void;
  onPlay: () => void;
  onOpenLibrary: () => void;
};

export function PlayPanel({
  version,
  canPlay,
  isRunning,
  memoryMb,
  installations,
  selectedInstall,
  onVersionChange,
  onInstallChange,
  onPlay,
  onOpenLibrary,
}: PlayPanelProps) {
  return (
    <Card className="panel-card play-card">
      <SectionTitle
        eyebrow="Launch deck"
        title="Secuencia de arranque"
        subtitle="Selecciona tu build, version y entra con una CTA mucho mas protagonista."
        icon={<FiZap />}
      />

      <div className="grid-two">
        <label className="field">
          <span>
            <FiLayers />
            Instalacion
          </span>
          <select value={selectedInstall} onChange={(event) => onInstallChange(event.target.value)}>
            {installations.map((installation) => (
              <option key={installation.id} value={installation.id}>
                {installation.label} - {installation.channel}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>
            <FiCpu />
            Version
          </span>
          <select value={version} onChange={(event) => onVersionChange(event.target.value)}>
            <option value="1.20.1">1.20.1</option>
            <option value="1.19.4">1.19.4</option>
            <option value="1.18.2">1.18.2</option>
          </select>
        </label>
      </div>

      <div className="play-strip">
        <div>
          <span>Memoria lista</span>
          <strong>{(memoryMb / 1024).toFixed(1)} GB</strong>
        </div>
        <div>
          <span>Canal</span>
          <strong>Mockup premium</strong>
        </div>
      </div>

      <div className="play-actions">
        <button className="play-button" disabled={!canPlay} onClick={onPlay} type="button">
          <FiPlay />
          {isRunning ? "Iniciando..." : "Jugar ahora"}
        </button>

        <button className="ghost-button" onClick={onOpenLibrary} type="button">
          Ver builds
          <FiArrowRight />
        </button>
      </div>
    </Card>
  );
}
