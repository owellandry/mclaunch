import { FiFolder, FiSliders, FiZap } from "react-icons/fi";
import { Card } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";

type SettingsPanelProps = {
  memoryMb: number;
  gameDir: string;
  onMemoryChange: (value: number) => void;
  onGameDirChange: (value: string) => void;
  onOpenSettingsModal: () => void;
};

export function SettingsPanel({
  memoryMb,
  gameDir,
  onMemoryChange,
  onGameDirChange,
  onOpenSettingsModal,
}: SettingsPanelProps) {
  return (
    <Card className="panel-card settings-card">
      <SectionTitle
        eyebrow="Ajustes"
        title="Performance y rutas"
        subtitle="Panel mucho mas util visualmente, con rango de RAM, path y hooks para futuras opciones."
        icon={<FiSliders />}
      />

      <div className="grid-two">
        <label className="field">
          <span>
            <FiZap />
            RAM asignada
          </span>
          <input
            max={12288}
            min={1024}
            onChange={(event) => onMemoryChange(Number(event.target.value))}
            step={512}
            type="number"
            value={memoryMb}
          />
        </label>

        <label className="field">
          <span>
            <FiFolder />
            Ruta de instalacion
          </span>
          <input onChange={(event) => onGameDirChange(event.target.value)} value={gameDir} />
        </label>
      </div>

      <input
        className="memory-slider"
        max={12288}
        min={1024}
        onChange={(event) => onMemoryChange(Number(event.target.value))}
        step={512}
        type="range"
        value={memoryMb}
      />

      <div className="tag-row">
        <span>Quick backups</span>
        <span>Shader aware</span>
        <span>Layout future-proof</span>
      </div>

      <button className="ghost-button" onClick={onOpenSettingsModal} type="button">
        <FiSliders />
        Abrir command center
      </button>
    </Card>
  );
}
