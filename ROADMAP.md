# 🛣️ ROADMAP

La siguiente lista de metas y objetivos refleja el desarrollo futuro planificado para **MCLaunch**. Esto es un esquema vivo y puede cambiar en función de los aportes de la comunidad y necesidades del proyecto.

---

### Fase 1: Consolidación del Núcleo (✅ Completada)

- [x] Arquitectura de `Electron` con `React` + `Vite` y `TypeScript`.
- [x] Sistema de autenticación de cuentas oficiales de Microsoft (Premium).
- [x] Inyección de Mod básico (Fabric) en el cliente de Minecraft (`mc-home-client`).
- [x] Arquitectura de la interfaz (Atomic Design) y soporte multilenguaje (i18n).
- [x] Almacenamiento seguro y persistente de tokens con `SQLite`.
- [x] Menú Principal del Juego Personalizado (Skin interactiva 3D, Botones planos).
- [x] Discord Rich Presence.

---

### Fase 2: Expansión de Características (🚧 En Progreso)

- [ ] **Soporte para Modpacks (CurseForge/Modrinth):**
  - Implementar un buscador dentro del launcher (`Library.tsx`).
  - Capacidad para descargar, instalar y gestionar colecciones enteras de mods de manera automática con resolución de dependencias.
- [ ] **Modo Offline Dinámico:**
  - Opción segura (para cuentas ya validadas) de jugar desconectado sin conexión a los servidores de autenticación.
- [ ] **Mejoras en el "SkinStudio":**
  - Cambiar y subir capas/capas adicionales o nuevas *skins* directamente desde la aplicación sin ir a `minecraft.net`.
  - Visualización y rotación en 360º de la *Skin* actual en la pestaña de perfil.

---

### Fase 3: Personalización y Comunidad

- [ ] **Soporte Extendido de Temas (Custom Themes):**
  - Más allá de los temas basados en el logotipo, añadir fondos personalizados, CSS inyectable y variables de color definidas por el usuario.
- [ ] **Sistema de Plugins/Complementos para el Launcher:**
  - Permitir a desarrolladores terceros añadir botones y pestañas al menú lateral.
- [ ] **Lounge / Navegador de Servidores (`Servers.tsx`):**
  - Mostrar estado en tiempo real (ping, jugadores en línea) de servidores guardados desde la aplicación de escritorio antes de abrir el juego.
- [ ] **Optimizaciones del Motor Java:**
  - Inyectar de manera predeterminada argumentos avanzados de JVM (como Aikar's Flags) dependiendo de la memoria RAM disponible para mejorar los FPS del jugador.

---

### Fase 4: Estabilidad y Lanzamiento Oficial (v1.0.0)

- [ ] **Actualizador Automático (Auto-Updater):**
  - Actualización sin fricciones (OTA) usando `electron-updater` conectado a las *Releases* de GitHub.
- [ ] **Soporte Completo Multiplataforma:**
  - Empaquetado optimizado, probado y firmado para Windows, macOS (Intel y Apple Silicon) y distribuciones principales de Linux (AppImage/Deb/Rpm).
- [ ] Auditoría de seguridad del código y de las consultas locales de `better-sqlite3`.
- [ ] Documentación extensa para contribuidores (`CONTRIBUTING.md`).
