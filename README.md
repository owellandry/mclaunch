# MC Launch

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=flat&logo=Electron&logoColor=white)
![Minecraft](https://img.shields.io/badge/Minecraft-Fabric-green.svg)

MC Launch es un proyecto de launcher moderno para Minecraft compuesto por tres partes que trabajan juntas:

- `react-ui`: la interfaz principal del launcher.
- `electron`: el proceso de escritorio que gestiona ventana, autenticacion, base de datos y lanzamiento de Minecraft.
- `mc-home-client`: un mod Fabric que reemplaza y mejora la experiencia visual dentro del juego.

Ademas, el repositorio incluye `react-installer`, una app ligera en Electron + React que sirve como base del instalador visual del launcher.

## Vision del proyecto

La idea de MC Launch no es solo abrir Minecraft. El objetivo es construir una experiencia completa:

- un launcher visualmente cuidado y rapido al iniciar
- autenticacion oficial de Microsoft
- integracion con Discord Rich Presence
- una experiencia in-game personalizada con una pantalla principal propia
- un instalador dedicado que comparta el mismo lenguaje visual del launcher

## Estado actual

Actualmente el repo contiene:

- launcher principal con `Electron + React + TypeScript`
- renderer optimizado con carga diferida por rutas en `react-ui`
- proceso principal de Electron con imports diferidos para reducir trabajo al arrancar
- Rich Presence de Discord para mostrar que el usuario esta usando o jugando desde MC Launch
- instalador separado en `react-installer`
- mod Fabric en Java para personalizar la home dentro de Minecraft

## Arquitectura rapida

### `react-ui`

Contiene la UI principal del launcher:

- onboarding
- dashboard
- biblioteca de versiones
- skin studio
- configuracion

Usa Vite, React Router, Zustand e i18n. La app esta separada por rutas y componentes para reducir el peso de arranque.

### `electron`

Contiene la logica de escritorio:

- creacion y control de ventana
- preload seguro
- IPC entre renderer y main
- login Microsoft
- integracion con `minecraft-launcher-core`
- base de datos SQLite con `better-sqlite3`
- Rich Presence de Discord

### `mc-home-client`

Es un mod Fabric que modifica la interfaz dentro del juego:

- reemplaza la pantalla principal por una experiencia propia
- renderiza un preview 3D del jugador
- soporta animaciones del personaje
- prepara una home visual alineada con la identidad del launcher

### `react-installer`

Es una aplicacion separada para el instalador:

- usa Electron + React + Vite
- comparte el lenguaje visual de `react-ui`
- actualmente sirve como base mockup y entorno de iteracion para el instalador final

## Estructura del repositorio

```text
.
|-- electron/            # main process, preload e IPC del launcher
|-- react-ui/            # interfaz principal del launcher
|-- react-installer/     # instalador visual separado
|-- mc-home-client/      # mod Fabric para la experiencia in-game
|-- scripts/             # scripts de desarrollo, build y helpers
|-- build/               # recursos de empaquetado
`-- .github/workflows/   # CI para scripts y builds
```

## Requisitos

- Node.js 20 o superior
- pnpm
- Java 17 para `mc-home-client`
- Git

## Instalacion

```bash
git clone https://github.com/owellandry/mclaunch.git
cd mclaunch
pnpm install
```

## Desarrollo

### Launcher principal

```bash
pnpm dev
```

Esto levanta:

- el renderer de `react-ui`
- la compilacion de Electron
- la app de escritorio en modo desarrollo

### Solo la UI principal

```bash
pnpm dev:ui
```

### Instalador visual

```bash
pnpm dev:installer
```

### Mod Fabric

```bash
cd mc-home-client
./gradlew build
```

En Windows:

```powershell
cd mc-home-client
./gradlew.bat build
```

## Build

### Build del launcher

```bash
pnpm build
```

### Build del instalador mock

```bash
pnpm build:installer
```

### Build local portable del launcher

```bash
pnpm dist:local
```

### Empaquetado tradicional

```bash
pnpm dist
```

## CI y workflows

En `.github/workflows/` hay workflows separados para:

- pruebas de scripts de instalacion en Windows, Linux y macOS
- build del launcher
- build del instalador

Esto permite validar por separado el runtime del launcher y la app del instalador.

## Problemas conocidos

### `pnpm install` puede fallar en Windows con `ERR_PNPM_EPERM`

En algunas maquinas, especialmente con VS Code abierto sobre el repo, Windows puede bloquear archivos dentro de `node_modules/.pnpm/electron...`, en particular `default_app.asar`.

Si pasa:

1. cierra por completo VS Code para este repo
2. vuelve a ejecutar `pnpm install`
3. abre el proyecto otra vez

El repo incluye [settings.json](.vscode/settings.json) para reducir el riesgo excluyendo `node_modules/.pnpm` y carpetas generadas del watcher de VS Code.

## Roadmap corto

- seguir refinando `react-installer` hasta conectarlo con pasos reales
- mejorar el empaquetado final del launcher para builds locales y distribucion
- seguir evolucionando la home in-game del mod Fabric
- pulir integraciones de cuenta, versiones y experiencia visual

## Licencia

Este proyecto esta bajo la licencia MIT. Revisa [LICENSE](LICENSE) para mas detalles.
