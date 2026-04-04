# Plan de implementación: Launcher de Minecraft (React + Electron)

## 1) Resumen
- Objetivo: crear la base de un launcher moderno con `React + Electron` usando `TypeScript`, orientado a flujo offline inicial y preparado para empaquetado multiplataforma.
- Alcance de la primera ejecución: scaffold completo, UI base, canal IPC seguro, y acción de `Play` simulada con logs en tiempo real (sin lanzamiento real de Minecraft aún).
- Decisiones cerradas: `Vite`, modo offline primero, objetivo multiplataforma, `pnpm` como gestor de paquetes.

## 2) Análisis del estado actual
- Repositorio actual: vacío a nivel de código de aplicación (solo contiene metadatos de `git`).
- No hay estructura existente de frontend/backend, scripts, configuración de TypeScript ni pipeline de build.
- No existe configuración previa de empaquetado ni dependencias de launcher.

## 3) Cambios propuestos (por archivo)

### 3.1 Estructura raíz del proyecto
- Crear estructura:
  - `electron/` (proceso principal y preload)
  - `react-ui/` (interfaz React con Vite + TS)
  - `package.json` raíz para orquestación con `pnpm`
  - archivos de configuración compartidos (`.gitignore`, scripts y docs mínimos)
- Por qué: separar responsabilidades entre backend de escritorio e interfaz de usuario.
- Cómo: usar scripts en raíz para desarrollo concurrente y build coordinado.

### 3.2 Backend Electron
- `electron/main.ts`
  - Crear ventana principal.
  - Cargar URL de Vite en desarrollo y bundle local en producción.
  - Configurar seguridad base (`contextIsolation`, `nodeIntegration: false`).
  - Registrar canal IPC para acción `launch` simulada.
- `electron/preload.ts`
  - Exponer API mínima segura con `contextBridge`.
  - Métodos previstos:
    - `launchMinecraft(config)`
    - `onLauncherLog(callback)`
- `electron/ipc/launcher.ts` (o módulo equivalente)
  - Implementar flujo simulado de lanzamiento: recibir configuración, emitir logs por etapas y estado final.
- Por qué: encapsular lógica de sistema en Electron y mantener React desacoplado de Node.

### 3.3 Frontend React (Vite + TS)
- `react-ui/src/main.tsx` y `react-ui/src/App.tsx`
  - Montar shell principal del launcher.
- Crear vistas/componentes base:
  - `Login` (username offline)
  - `Home` (selector de versión + botón Play)
  - `Console` (stream de logs)
  - `Settings` (RAM y ruta de instalación)
- `react-ui/src/types/electron-api.d.ts`
  - Tipar `window.api` para llamadas IPC.
- Gestión de estado local simple para MVP (sin sobre-ingeniería): estado React con hooks.
- Por qué: materializar flujo UX completo del launcher desde primer hito.

### 3.4 Comunicación IPC React ↔ Electron
- Contratos iniciales:
  - Evento comando: `launcher:launch`
  - Evento log: `launcher:log`
  - Evento estado: `launcher:status`
- Validar payload mínimo de entrada:
  - `username`, `version`, `memoryMb`, `gameDir`
- Por qué: dejar contratos explícitos para evolucionar luego hacia `minecraft-launcher-core`.

### 3.5 Configuración y scripts
- `package.json` raíz
  - Scripts de desarrollo coordinado (React + Electron).
  - Scripts de build para UI y main process.
- `react-ui/package.json`
  - Scripts Vite (`dev`, `build`, `preview`).
- Dependencias propuestas:
  - Core: `electron`, `react`, `react-dom`, `vite`, `typescript`
  - Launcher futuro: `minecraft-launcher-core` (pendiente de fase siguiente)
  - Utilidad: `electron-store` (config persistente en siguiente iteración si se habilita)
  - Dev: `concurrently`, `wait-on`, tipados y tooling TS
- Por qué: asegurar ciclo dev estable y base para empaquetado posterior.

### 3.6 Empaquetado multiplataforma (base)
- Agregar configuración inicial de `electron-builder` en raíz (o archivo dedicado).
- Targets iniciales:
  - Windows: `nsis` / `.exe`
  - Linux: `AppImage`
- Dejar macOS como “preparado, no validado localmente” en esta fase.
- Por qué: cumplir decisión de enfoque multiplataforma desde diseño inicial.

## 4) Supuestos y decisiones
- Se implementa primero MVP offline: no Microsoft login en esta fase.
- Primera entrega no ejecuta Minecraft real; simula el flujo para validar arquitectura, UX e IPC.
- `pnpm` será el gestor oficial para instalar y ejecutar scripts.
- El proyecto usará TypeScript tanto en Electron como en React.
- Se prioriza seguridad de Electron desde el inicio (`preload` + API explícita, sin exponer Node directo al renderer).

## 5) Flujo funcional esperado (MVP)
1. Usuario abre launcher.
2. Ingresa username offline.
3. Selecciona versión y configura parámetros básicos.
4. Presiona `Play`.
5. React envía comando por IPC.
6. Electron ejecuta flujo simulado y emite logs/estado.
7. React muestra logs en consola en tiempo real.

## 6) Verificación
- Verificación técnica:
  - Instalar dependencias con `pnpm install`.
  - Ejecutar modo desarrollo con script raíz.
  - Confirmar que abre ventana Electron y renderiza React.
  - Confirmar que `Play` dispara IPC y aparecen logs en UI.
  - Validar ausencia de errores de TypeScript/linter en archivos modificados.
- Verificación funcional:
  - Flujo completo Login → Home → Play → Console sin bloqueos.
  - Persistencia temporal en memoria de configuración de sesión.
- Criterio de aceptación de la fase:
  - Arquitectura base operativa y lista para integrar `minecraft-launcher-core` en fase siguiente.

## 7) Riesgos y mitigaciones
- Riesgo: rutas distintas entre desarrollo y producción.
  - Mitigación: centralizar resolución de paths en `main.ts`.
- Riesgo: preload/IPC mal cableado.
  - Mitigación: tipado estricto y contratos de eventos definidos.
- Riesgo: drift entre UI y backend.
  - Mitigación: declarar payloads compartidos desde tipos comunes.

## 8) Siguiente fase tras este MVP
- Integrar `minecraft-launcher-core` para lanzamiento offline real.
- Añadir persistencia de settings con `electron-store`.
- Expandir selector de versiones con listado real.
