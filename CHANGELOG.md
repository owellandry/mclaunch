# 📌 CHANGELOG

Todos los cambios notables de este proyecto serán documentados en este archivo.
El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/).

## [Unreleased] - 2026-04-06

### 🚀 Añadido (Added)
- **Autenticación Premium de Microsoft:** Integración completa de la biblioteca `msmc`. La app autentica perfiles directamente a través de Mojang y asegura los tokens (`mclc_auth` y `msmc_token`) en una base de datos local SQLite.
- **Discord Rich Presence:** Inclusión del estado de actividad del jugador de forma nativa.
- **Cliente en Java (Mod Fabric):**
  - **Menú Principal de Minecraft 100% Personalizado:** Reemplazo de la pantalla de inicio estática (Tierra y grises) por un panel translúcido de cristal (Glassmorphism) con borde verde.
  - **Jugador Interactivo 3D:** El personaje del usuario se muestra en la pantalla principal del juego reaccionando al cursor y empleando su propia *Skin*.
  - **Forzado de Escala de GUI:** El mod de Java ahora escala automáticamente la GUI a "2" para un aspecto impecable y sin solapamientos.
  - **Componentes Nativos Modernos (`ModernButtonWidget`):** Botones oscuros y planos con retroiluminación en verde.
- **Internacionalización (i18n):** Archivos `es.json`, `en.json`, y `pt.json` para gestionar traducciones globales de toda la interfaz.
- **Onboarding Mejorado:** Rediseño del primer inicio de sesión usando Glassmorphism, animaciones y jerarquía orientada a Microsoft Login.

### 🔄 Cambiado (Changed)
- **Arquitectura Frontend (Atomic Design):**
  - Toda la carpeta de `react-ui/src` ha sido rediseñada modularmente dividiendo el código en `atoms`, `molecules`, `organisms`, `templates` y `pages`.
  - Refactorización de rutas usando `react-router-dom` v6 en módulos `PublicRoute` y `PrivateRoute` dedicados.
  - Añadido `lazy loading` (Carga perezosa) y `Suspense` para dividir de manera más eficiente los fragmentos (chunks) de JavaScript.
- **Documentación Activa:** JSDoc añadido a todos los componentes clave y stores (`useAppStore`, `useLauncherStore`, `Dashboard`, `MainLayout`, etc.)
- **Archivos Sensibles:** `.env` fue configurado correctamente y agregado a `.gitignore`.

### 🛠️ Arreglado (Fixed)
- Solución al error de compilación en Typescript provocado por un objeto indefinido en `mc.profile` durante el *Login* de Microsoft.
- Arreglo de los conflictos de versiones, dependencias y descargas en red durante la integración continua (CI) de GitHub Actions en Ubuntu.
- Reparación de desbordamientos de botones y texto solapado en la vista previa del menú principal del juego (Java).

## [v0.1.0] - Lanzamiento Inicial (Initial Release)

### 🚀 Añadido (Added)
- Diseño base de la aplicación.
- Componentes de React para visualización de "Dashboard", "Settings" y "SkinStudio".
- Integración básica del núcleo de `minecraft-launcher-core`.