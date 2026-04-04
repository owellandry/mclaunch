import { FiEdit3, FiShield, FiUser } from "react-icons/fi";
import { Card } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";

type LoginPanelProps = {
  username: string;
  onUsernameChange: (value: string) => void;
  onOpenProfile: () => void;
};

export function LoginPanel({ username, onUsernameChange, onOpenProfile }: LoginPanelProps) {
  const displayName = username.trim() || "Pilot Zero";

  return (
    <Card className="panel-card login-card">
      <SectionTitle
        eyebrow="Identidad"
        title="Perfil local"
        subtitle="Entrada elegante para el modo offline mientras llega la capa funcional mas profunda."
        icon={<FiUser />}
      />

      <div className="profile-row">
        <div className="profile-avatar">{displayName.slice(0, 1).toUpperCase()}</div>
        <div className="profile-copy">
          <strong>{displayName}</strong>
          <span>Cuenta local activa</span>
        </div>
      </div>

      <label className="field">
        <span>Username</span>
        <input
          maxLength={16}
          onChange={(event) => onUsernameChange(event.target.value)}
          placeholder="Ejemplo: Steve123"
          value={username}
        />
      </label>

      <div className="tag-row">
        <span>
          <FiShield />
          Offline ready
        </span>
        <span>
          <FiEdit3 />
          Skin room
        </span>
      </div>

      <button className="ghost-button" onClick={onOpenProfile} type="button">
        <FiEdit3 />
        Personalizar mockup
      </button>
    </Card>
  );
}
