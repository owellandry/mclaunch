import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import type { IconType } from "react-icons";
import {
  FiActivity,
  FiBell,
  FiBookOpen,
  FiCloudSnow,
  FiCompass,
  FiCpu,
  FiDownloadCloud,
  FiFeather,
  FiFolder,
  FiGrid,
  FiHardDrive,
  FiLayers,
  FiMonitor,
  FiMoon,
  FiRadio,
  FiSearch,
  FiServer,
  FiSettings,
  FiShield,
  FiSliders,
  FiStar,
  FiUser,
  FiZap,
} from "react-icons/fi";
import heroImage from "./assets/hero.png";
import { ConsolePanel } from "./components/launcher/ConsolePanel";
import { LauncherHeader } from "./components/launcher/LauncherHeader";
import { LoginPanel } from "./components/launcher/LoginPanel";
import { PlayPanel } from "./components/launcher/PlayPanel";
import { SettingsPanel } from "./components/launcher/SettingsPanel";
import { MockModal } from "./components/ui/MockModal";
import { Card } from "./components/ui/Card";
import { SectionTitle } from "./components/ui/SectionTitle";
import type { LauncherStatus } from "./types/launcher";
import "./App.css";

const DEFAULT_GAME_DIR = "C:\\Users\\Public\\Games\\.minecraft";

type LauncherView = "overview" | "library" | "servers" | "settings";
type ActiveModal = "profile" | "patch" | "command" | null;

type NavItem = {
  id: LauncherView;
  label: string;
  icon: IconType;
  hint: string;
};

type InstallationCard = {
  id: string;
  label: string;
  channel: string;
  vibe: string;
  description: string;
};

type StatCard = {
  label: string;
  value: string;
  icon: IconType;
};

type FeedItem = {
  title: string;
  detail: string;
  icon: IconType;
};

const NAV_ITEMS: NavItem[] = [
  { id: "overview", label: "Inicio", icon: FiGrid, hint: "Cabina principal" },
  { id: "library", label: "Biblioteca", icon: FiLayers, hint: "Instancias y packs" },
  { id: "servers", label: "Servidores", icon: FiServer, hint: "Multijugador mock" },
  { id: "settings", label: "Ajustes", icon: FiSettings, hint: "Tuning visual" },
];

const INSTALLATIONS: InstallationCard[] = [
  {
    id: "aurora",
    label: "Aurora Build",
    channel: "Curada",
    vibe: "PvE cinematic",
    description: "Shaders suaves, HUD limpio y experiencia enfocada en exploracion.",
  },
  {
    id: "pulse",
    label: "Pulse Ranked",
    channel: "Competitiva",
    vibe: "PvP veloz",
    description: "Perfil ligero con UI agresiva, hotkeys priorizadas y cero distracciones.",
  },
  {
    id: "forge",
    label: "Forge Atelier",
    channel: "Modpack",
    vibe: "Builders club",
    description: "Stack creativo para mundos enormes, automatizacion y capturas bonitas.",
  },
];

const HERO_STATS: StatCard[] = [
  { label: "Escenas listas", value: "12", icon: FiStar },
  { label: "Instancias mock", value: "03", icon: FiLayers },
  { label: "Sincronias", value: "99%", icon: FiActivity },
];

const ACTIVITY_FEED: FeedItem[] = [
  {
    title: "Skin room actualizada",
    detail: "Se prepararon nuevos slots de cosmeticos para el mockup del perfil.",
    icon: FiFeather,
  },
  {
    title: "Descarga priorizada",
    detail: "Aurora Build quedo marcada como instancia principal para el boton Play.",
    icon: FiDownloadCloud,
  },
  {
    title: "Telemetria limpia",
    detail: "La consola ahora prioriza mensajes del launcher y avisos de arranque.",
    icon: FiBell,
  },
];

const LIBRARY_SPOTLIGHTS: FeedItem[] = [
  {
    title: "Collection Nebula",
    detail: "Instancias curadas por mood: chill, ranked, creative y hardcore.",
    icon: FiCloudSnow,
  },
  {
    title: "World vault",
    detail: "Tus mundos favoritos aparecen como tarjetas, con snapshots y tags.",
    icon: FiBookOpen,
  },
  {
    title: "Mod presets",
    detail: "Preparado para un futuro gestor visual de mods y perfiles sincronizados.",
    icon: FiCompass,
  },
];

const SERVER_SPOTLIGHTS: FeedItem[] = [
  {
    title: "Atlas Realm",
    detail: "Hub social con eventos semanales, colas visibles y presencia mock de amigos.",
    icon: FiRadio,
  },
  {
    title: "Northwatch",
    detail: "Servidor survival cinematografico con rotacion de temporadas destacadas.",
    icon: FiMoon,
  },
  {
    title: "Forge District",
    detail: "Sandbox para builders con paneles de permisos, backups y seeds destacadas.",
    icon: FiShield,
  },
];

const SETTINGS_SPOTLIGHTS: FeedItem[] = [
  {
    title: "Modo cinematografico",
    detail: "Ambientes, reflejos y glassmorphism listos para el primer mockup premium.",
    icon: FiMonitor,
  },
  {
    title: "Control de recursos",
    detail: "Memoria, rutas y colas se presentan como paneles claros y manipulables.",
    icon: FiCpu,
  },
  {
    title: "Centro de mando",
    detail: "Se agrega una capa de modal para futuras acciones avanzadas del launcher.",
    icon: FiSliders,
  },
];

const PATCH_NOTES = [
  "Se rehizo por completo la interfaz para que el launcher ya parezca un producto final premium.",
  "Se agregaron vistas mock de biblioteca, servidores y ajustes para cubrir mucha mas superficie de UI.",
  "Se introdujeron modales para perfil, patch notes y command center, listos para ganar funcionalidad real mas adelante.",
  "La consola ahora tiene estilo terminal, acciones rapidas y mejor jerarquia visual.",
];

function App() {
  const [username, setUsername] = useState("");
  const [version, setVersion] = useState("1.20.1");
  const [memoryMb, setMemoryMb] = useState(4096);
  const [gameDir, setGameDir] = useState(DEFAULT_GAME_DIR);
  const [status, setStatus] = useState<LauncherStatus>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<LauncherView>("overview");
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedInstall, setSelectedInstall] = useState(INSTALLATIONS[0].id);

  useEffect(() => {
    const unsubscribeLog = window.api.onLauncherLog((message) => {
      startTransition(() => {
        setLogs((previous) => [...previous, message]);
      });
    });
    const unsubscribeStatus = window.api.onLauncherStatus((nextStatus) => {
      setStatus(nextStatus);
    });

    return () => {
      unsubscribeLog();
      unsubscribeStatus();
    };
  }, []);

  const deferredLogs = useDeferredValue(logs);

  const canPlay = useMemo(
    () => username.trim().length >= 3 && status !== "running",
    [username, status]
  );

  const currentInstallation = useMemo(
    () =>
      INSTALLATIONS.find((installation) => installation.id === selectedInstall) ?? INSTALLATIONS[0],
    [selectedInstall]
  );

  const displayName = username.trim() || "Pilot Zero";
  const memoryInGb = `${(memoryMb / 1024).toFixed(1)} GB`;
  const progressValue =
    status === "running" ? 72 : status === "done" ? 100 : status === "error" ? 24 : 48;

  const appendMockLog = (message: string): void => {
    const entry = `[mock ${new Date().toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit",
    })}] ${message}`;

    startTransition(() => {
      setLogs((previous) => [...previous, entry]);
    });
  };

  const handleViewChange = (nextView: LauncherView): void => {
    startTransition(() => {
      setActiveView(nextView);
    });
  };

  const handlePlay = (): void => {
    if (!canPlay) {
      return;
    }

    setLogs([
      `[launcher] Perfil cargado: ${username.trim()}`,
      `[launcher] Build seleccionada: ${currentInstallation.label}`,
      `[launcher] Memoria reservada: ${memoryMb} MB`,
    ]);
    setStatus("running");

    window.api.launchMinecraft({
      username: username.trim(),
      version,
      memoryMb,
      gameDir,
    });
  };

  const renderFeed = (items: FeedItem[], tone: "warm" | "cool" | "neutral") => (
    <div className={`feed-list tone-${tone}`}>
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <article className="feed-item" key={item.title}>
            <div className="feed-icon">
              <Icon />
            </div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.detail}</p>
            </div>
          </article>
        );
      })}
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="overview-grid">
        <LoginPanel
          username={username}
          onUsernameChange={setUsername}
          onOpenProfile={() => setActiveModal("profile")}
        />
        <PlayPanel
          version={version}
          canPlay={canPlay}
          isRunning={status === "running"}
          memoryMb={memoryMb}
          installations={INSTALLATIONS}
          selectedInstall={selectedInstall}
          onVersionChange={setVersion}
          onInstallChange={setSelectedInstall}
          onPlay={handlePlay}
          onOpenLibrary={() => handleViewChange("library")}
        />
      </div>

      <div className="mosaic-grid">
        <Card className="feature-card news-card">
          <SectionTitle
            eyebrow="Spotlight"
            title="Temporada Nebula"
            subtitle="Direccion visual nueva para que el launcher se sienta mas coleccionable."
            icon={<FiStar />}
          />
          <div className="headline-stack">
            <div className="headline-pill">
              <FiStar />
              Nuevo mockup integral
            </div>
            <h3>Cabina premium, paneles claros y una vibra mucho mas fuerte.</h3>
            <p>
              Todo el flujo se piensa como producto: navegar, descubrir builds, revisar consola,
              abrir modales y preparar futuras integraciones reales.
            </p>
          </div>
          {renderFeed(ACTIVITY_FEED, "warm")}
        </Card>

        <SettingsPanel
          memoryMb={memoryMb}
          gameDir={gameDir}
          onMemoryChange={setMemoryMb}
          onGameDirChange={setGameDir}
          onOpenSettingsModal={() => setActiveModal("command")}
        />
      </div>
    </>
  );

  const renderLibrary = () => (
    <div className="stack-layout">
      <Card className="collection-hero">
        <SectionTitle
          eyebrow="Biblioteca"
          title="Instancias con personalidad"
          subtitle="Cada build tiene una intencion visual y un mood diferente para el jugador."
          icon={<FiLayers />}
          action={
            <button
              className="ghost-button"
              onClick={() => {
                appendMockLog("Se marco la biblioteca como lista para futura gestion de mods.");
              }}
              type="button"
            >
              <FiDownloadCloud />
              Preparar sync
            </button>
          }
        />
        <div className="collection-grid">
          {INSTALLATIONS.map((installation) => (
            <article
              className={`collection-card ${
                installation.id === selectedInstall ? "is-selected" : ""
              }`}
              key={installation.id}
            >
              <div className="collection-card-top">
                <span>{installation.channel}</span>
                <button
                  className="mini-button"
                  onClick={() => setSelectedInstall(installation.id)}
                  type="button"
                >
                  Elegir
                </button>
              </div>
              <h3>{installation.label}</h3>
              <p>{installation.description}</p>
              <div className="tag-row">
                <span>{installation.vibe}</span>
                <span>Ready</span>
              </div>
            </article>
          ))}
        </div>
      </Card>
      <div className="double-grid">
        <Card className="panel-card">
          <SectionTitle
            eyebrow="Curaduria"
            title="Coleccion destacada"
            subtitle="Bloques de contenido pensados para packs, mundos y presets."
            icon={<FiCompass />}
          />
          {renderFeed(LIBRARY_SPOTLIGHTS, "cool")}
        </Card>
        <Card className="panel-card stats-panel">
          <SectionTitle
            eyebrow="Resumen"
            title="Estado de la biblioteca"
            subtitle="Mockup listo para crecer hacia descargas, snapshots y perfiles."
            icon={<FiHardDrive />}
          />
          <div className="stats-grid">
            <div>
              <strong>24</strong>
              <span>Assets visuales</span>
            </div>
            <div>
              <strong>07</strong>
              <span>Packs favoritos</span>
            </div>
            <div>
              <strong>16 GB</strong>
              <span>Cache reservada</span>
            </div>
            <div>
              <strong>3D</strong>
              <span>Capas listas</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );

  const renderServers = () => (
    <div className="stack-layout">
      <Card className="panel-card server-banner">
        <SectionTitle
          eyebrow="Multijugador"
          title="Lounge de servidores"
          subtitle="Todo es mockup por ahora, pero la experiencia ya se siente social y viva."
          icon={<FiRadio />}
          action={
            <button
              className="ghost-button"
              onClick={() => appendMockLog("Se abrio la cola mock del servidor Atlas Realm.")}
              type="button"
            >
              <FiZap />
              Join queue
            </button>
          }
        />
        <div className="server-grid">
          {[
            ["Atlas Realm", "34 ms", "Eventos", "Temporada neon con hub social curado."],
            ["Northwatch", "58 ms", "Survival", "Ambiente calmado con builder tools visibles."],
            ["Forge District", "21 ms", "Creative", "Lobby premium con parcelas y backups mock."],
          ].map(([name, ping, mode, description]) => (
            <article className="server-card" key={name}>
              <div className="server-card-top">
                <h3>{name}</h3>
                <span>{ping}</span>
              </div>
              <p>{description}</p>
              <div className="tag-row">
                <span>{mode}</span>
                <span>Online</span>
              </div>
            </article>
          ))}
        </div>
      </Card>
      <div className="double-grid">
        <Card className="panel-card">
          <SectionTitle
            eyebrow="Destacados"
            title="Targets del mockup"
            subtitle="Espacios listos para slots sociales, ping real y estado de amigos."
            icon={<FiServer />}
          />
          {renderFeed(SERVER_SPOTLIGHTS, "neutral")}
        </Card>
        <Card className="panel-card social-card">
          <SectionTitle
            eyebrow="Squad"
            title="Presencia social"
            subtitle="Lista de amigos visual para futuras invitaciones y party flows."
            icon={<FiUser />}
          />
          <div className="friend-list">
            {[
              ["LumaFox", "En lobby de Atlas Realm"],
              ["IronMint", "Armando modpack creativo"],
              ["NovaByte", "Probando shaders nuevos"],
            ].map(([name, detail]) => (
              <div className="friend-row" key={name}>
                <div className="friend-avatar">{name.slice(0, 1)}</div>
                <div>
                  <strong>{name}</strong>
                  <span>{detail}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );

  const renderSettingsView = () => (
    <div className="stack-layout">
      <div className="double-grid">
        <SettingsPanel
          memoryMb={memoryMb}
          gameDir={gameDir}
          onMemoryChange={setMemoryMb}
          onGameDirChange={setGameDir}
          onOpenSettingsModal={() => setActiveModal("command")}
        />
        <Card className="panel-card">
          <SectionTitle
            eyebrow="Look and feel"
            title="Sistema visual"
            subtitle="Paleta, densidad, animacion y capas de interfaz listas para iterar."
            icon={<FiMonitor />}
          />
          {renderFeed(SETTINGS_SPOTLIGHTS, "cool")}
        </Card>
      </div>
      <Card className="panel-card">
        <SectionTitle
          eyebrow="Estado tecnico"
          title="Resumen de configuracion"
          subtitle="El mockup ya refleja datos del perfil real de arranque donde tiene sentido."
          icon={<FiCpu />}
        />
        <div className="stats-grid">
          <div>
            <strong>{memoryInGb}</strong>
            <span>RAM reservada</span>
          </div>
          <div>
            <strong>{version}</strong>
            <span>Version activa</span>
          </div>
          <div>
            <strong>Offline</strong>
            <span>Modo identidad</span>
          </div>
          <div>
            <strong>Ready</strong>
            <span>Estado visual</span>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <main className={`launcher-app status-${status}`}>
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />
      <div className="ambient ambient-three" />

      <div className="launcher-frame">
        <aside className="sidebar-shell">
          <div className="brand-lockup">
            <div className="brand-mark">
              <FiStar />
            </div>
            <div>
              <p>MC Launch</p>
              <strong>Nebula Console</strong>
            </div>
          </div>

          <nav className="nav-stack" aria-label="Navegacion principal">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = item.id === activeView;
              return (
                <button
                  className={`nav-item ${isActive ? "is-active" : ""}`}
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  type="button"
                >
                  <span className="nav-item-icon">
                    <Icon />
                  </span>
                  <span>
                    <strong>{item.label}</strong>
                    <small>{item.hint}</small>
                  </span>
                </button>
              );
            })}
          </nav>

          <Card className="sidebar-card">
            <SectionTitle
              eyebrow="Live preset"
              title={currentInstallation.label}
              subtitle={currentInstallation.vibe}
              icon={<FiCompass />}
            />
            <p className="sidebar-copy">{currentInstallation.description}</p>
            <div className="tag-row">
              <span>{memoryInGb}</span>
              <span>{version}</span>
            </div>
          </Card>

          <div className="sidebar-footer">
            <div className="status-ring">
              <span>{progressValue}%</span>
            </div>
            <div>
              <p>Progreso del flujo</p>
              <strong>{status === "running" ? "Secuencia de arranque" : "Mockup operativo"}</strong>
            </div>
          </div>
        </aside>

        <section className="workspace-shell">
          <header className="topbar">
            <div className="search-shell">
              <FiSearch />
              <input
                aria-label="Buscador visual"
                placeholder="Buscar vistas, packs o presets..."
                readOnly
                value=""
              />
            </div>

            <div className="topbar-actions">
              <button className="topbar-button" onClick={() => setActiveModal("patch")} type="button">
                <FiBookOpen />
                Patch notes
              </button>
              <button className="topbar-button" onClick={() => setActiveModal("command")} type="button">
                <FiSliders />
                Command center
              </button>
              <button className="topbar-avatar" onClick={() => setActiveModal("profile")} type="button">
                {displayName.slice(0, 1).toUpperCase()}
              </button>
            </div>
          </header>

          <div className="workspace-grid">
            <div className="primary-column">
              <LauncherHeader
                coverImage={heroImage}
                displayName={displayName}
                selectedInstallLabel={currentInstallation.label}
                stats={HERO_STATS}
                status={status}
                version={version}
                onOpenPatchNotes={() => setActiveModal("patch")}
                onOpenProfile={() => setActiveModal("profile")}
                onOpenLibrary={() => handleViewChange("library")}
              />

              {activeView === "overview" && renderOverview()}
              {activeView === "library" && renderLibrary()}
              {activeView === "servers" && renderServers()}
              {activeView === "settings" && renderSettingsView()}
            </div>

            <div className="secondary-column">
              <Card className="highlight-card">
                <SectionTitle
                  eyebrow="Session deck"
                  title="Snapshot actual"
                  subtitle="Lectura rapida de lo que el usuario prepararia antes de jugar."
                  icon={<FiActivity />}
                />
                <div className="snapshot-grid">
                  <div>
                    <span>Perfil</span>
                    <strong>{displayName}</strong>
                  </div>
                  <div>
                    <span>Build</span>
                    <strong>{currentInstallation.label}</strong>
                  </div>
                  <div>
                    <span>RAM</span>
                    <strong>{memoryInGb}</strong>
                  </div>
                  <div>
                    <span>Estado</span>
                    <strong>{status}</strong>
                  </div>
                </div>
              </Card>

              <ConsolePanel
                logs={deferredLogs}
                status={status}
                onClearLogs={() => setLogs([])}
                onSimulateLog={() => appendMockLog("Se disparo un evento visual de prueba en la consola.")}
              />

              <Card className="highlight-card">
                <SectionTitle
                  eyebrow="Storage"
                  title="Ruta principal"
                  subtitle="Ubicacion base y comportamiento pensado para futuras herramientas."
                  icon={<FiFolder />}
                />
                <p className="path-preview">{gameDir}</p>
                <div className="tag-row">
                  <span>Asset cache listo</span>
                  <span>Backups mock</span>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </div>

      {activeModal === "profile" && (
        <MockModal
          icon={<FiUser />}
          title="Perfil piloto"
          subtitle="Mockup de identidad, presencia y cosmeticos para una futura cuenta local."
          onClose={() => setActiveModal(null)}
        >
          <div className="modal-profile">
            <div className="profile-badge">{displayName.slice(0, 1).toUpperCase()}</div>
            <div>
              <h3>{displayName}</h3>
              <p>Modo offline premium listo para avatar, skin room y presets personales.</p>
            </div>
          </div>
          <div className="modal-chip-row">
            <span>Offline core</span>
            <span>Skin queue</span>
            <span>Profile card</span>
          </div>
          <div className="modal-list">
            {[
              "Slot para cambiar skin, capa y color accent del launcher.",
              "Panel social listo para futuras invitaciones y presencia de amigos.",
              "Area de historial pensada para ultimas sesiones y mundos favoritos.",
            ].map((item) => (
              <div className="modal-list-item" key={item}>
                <FiStar />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </MockModal>
      )}

      {activeModal === "patch" && (
        <MockModal
          icon={<FiBookOpen />}
          title="Patch notes del rediseno"
          subtitle="Resumen rapido de todo lo que acaba de entrar en esta vuelta visual."
          onClose={() => setActiveModal(null)}
        >
          <div className="modal-list">
            {PATCH_NOTES.map((note) => (
              <div className="modal-list-item" key={note}>
                <FiZap />
                <p>{note}</p>
              </div>
            ))}
          </div>
        </MockModal>
      )}

      {activeModal === "command" && (
        <MockModal
          icon={<FiSliders />}
          title="Command center"
          subtitle="Overlay de control para acciones futuras, presets globales y colas visuales."
          onClose={() => setActiveModal(null)}
        >
          <div className="command-grid">
            <div className="command-card">
              <strong>Visual density</strong>
              <span>Balanced glass UI</span>
            </div>
            <div className="command-card">
              <strong>Launcher mood</strong>
              <span>Cinematic nebula</span>
            </div>
            <div className="command-card">
              <strong>Notifications</strong>
              <span>Highlights only</span>
            </div>
            <div className="command-card">
              <strong>Queue monitor</strong>
              <span>2 tareas mock activas</span>
            </div>
          </div>
          <div className="modal-list">
            {[
              "Centro pensado para cambiar temas, overlays y modulos futuros.",
              "Tambien puede alojar descargas, integridad de assets y acciones de mantenimiento.",
            ].map((item) => (
              <div className="modal-list-item" key={item}>
                <FiSettings />
                <p>{item}</p>
              </div>
            ))}
          </div>
        </MockModal>
      )}
    </main>
  );
}

export default App;
