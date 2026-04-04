import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { FiArrowRight, FiBookOpen, FiLayout, FiUser } from "react-icons/fi";
import { Card } from "../ui/Card";
import { StatusChip } from "../ui/StatusChip";
import type { LauncherStatus } from "../../types/launcher";

type HeroStat = {
  label: string;
  value: string;
  icon: IconType;
};

type LauncherHeaderProps = {
  coverImage: string;
  displayName: string;
  selectedInstallLabel: string;
  stats: HeroStat[];
  status: LauncherStatus;
  version: string;
  onOpenPatchNotes: () => void;
  onOpenProfile: () => void;
  onOpenLibrary: () => void;
};

function HeroButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "secondary" | "primary";
}) {
  return (
    <button className={`hero-button hero-button-${variant}`} onClick={onClick} type="button">
      {children}
    </button>
  );
}

export function LauncherHeader({
  coverImage,
  displayName,
  selectedInstallLabel,
  stats,
  status,
  version,
  onOpenPatchNotes,
  onOpenProfile,
  onOpenLibrary,
}: LauncherHeaderProps) {
  return (
    <Card className="hero-card">
      <div className="hero-layout">
        <div className="hero-copy-column">
          <div className="hero-topline">
            <span className="eyebrow-pill">Season 01</span>
            <StatusChip status={status} />
          </div>

          <p className="hero-kicker">Nebula Forge Launcher</p>
          <h1>Un launcher de Minecraft que ya se siente coleccionable.</h1>
          <p className="hero-subtitle">
            Hola, <strong>{displayName}</strong>. Tu cabina visual esta centrada en{" "}
            <strong>{selectedInstallLabel}</strong>, corriendo sobre la version <strong>{version}</strong>.
          </p>

          <div className="hero-metrics">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <article className="hero-metric" key={stat.label}>
                  <div className="hero-metric-icon">
                    <Icon />
                  </div>
                  <div>
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="hero-actions">
            <HeroButton onClick={onOpenPatchNotes}>
              <FiBookOpen />
              Patch notes
            </HeroButton>
            <HeroButton onClick={onOpenProfile}>
              <FiUser />
              Perfil
            </HeroButton>
            <HeroButton onClick={onOpenLibrary} variant="primary">
              <FiLayout />
              Ver biblioteca
              <FiArrowRight />
            </HeroButton>
          </div>
        </div>

        <div className="hero-visual-column">
          <div className="hero-image-shell">
            <img alt="Preview del launcher" src={coverImage} />
            <div className="hero-float-card hero-float-top">
              <span>Preset activo</span>
              <strong>{selectedInstallLabel}</strong>
            </div>
            <div className="hero-float-card hero-float-bottom">
              <span>HUD target</span>
              <strong>Clean / Glass / Neon</strong>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
