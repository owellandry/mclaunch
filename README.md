# 🚀 MCLaunch

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Electron](https://img.shields.io/badge/Electron-191970?style=flat&logo=Electron&logoColor=white)
![Minecraft](https://img.shields.io/badge/Minecraft-Fabric-green.svg)

Un moderno y ligero launcher de Minecraft desarrollado en **Electron**, **React**, y **TypeScript**. Este proyecto incluye un cliente web/desktop altamente optimizado con el patrón *Atomic Design* y un mod (Fabric) integrado que reemplaza por completo el menú de inicio clásico de Minecraft para darle una estética moderna y profesional (`Glassmorphism`).

## ✨ Características Principales

*   🔒 **Autenticación Oficial de Microsoft (Premium):** Integración con `msmc` para conectar de forma segura las cuentas oficiales de Minecraft a los servidores de Mojang.
*   🎨 **Interfaz de Usuario Moderna:**
    *   Diseño basado en componentes atómicos.
    *   Glassmorphism, animaciones suaves y tematización dinámica basada en el color del logo.
    *   Soporte multilenguaje integrado (Español, Inglés, Portugués).
*   🎮 **Mod Nativo (MCLaunch Home Preview):** 
    *   Reemplaza el menú principal predeterminado de Minecraft con un entorno elegante e interactivo.
    *   Previsualización de la *Skin* del jugador en 3D interactiva, que reacciona a los movimientos del ratón en tiempo real.
    *   Fuerza de manera inteligente el GUI Scale para mantener una legibilidad de alta resolución (Escala 2).
*   🚀 **Alto Rendimiento:** Configurado usando Vite, con *lazy loading*, *suspense* en React y una arquitectura optimizada para compilaciones rápidas.
*   💬 **Discord Rich Presence (RPC):** Muestra el estado del jugador de manera elegante en Discord.

## 🛠️ Tecnologías

*   **Frontend:** React (Vite), TypeScript, TailwindCSS, Zustand (State Management), react-i18next.
*   **Backend (Launcher):** Electron, `minecraft-launcher-core`, SQLite (`better-sqlite3`).
*   **Mod en el juego:** Fabric API, Mixins, Java 17.

## 📦 Instalación y Uso

### Prerrequisitos

*   **Node.js** (v20+ recomendado)
*   **pnpm** (Gestor de paquetes)
*   **Java 17** (Para compilar el mod de Fabric)

### Guía paso a paso

1. **Clonar el repositorio:**
   ```bash
   git clone https://github.com/owellandry/mclaunch.git
   cd mclaunch
   ```

2. **Instalar dependencias del entorno de escritorio:**
   ```bash
   pnpm install
   ```

3. **Ejecutar el entorno de desarrollo:**
   ```bash
   pnpm dev
   ```

4. **Compilar para producción:**
   ```bash
   pnpm build
   pnpm start
   ```

### 🧩 Construir el mod del cliente (`mc-home-client`)
El mod se encarga de reestructurar el menú de inicio dentro de Minecraft.
```bash
cd mc-home-client
./gradlew build
```
*(El archivo `.jar` resultante se encontrará en `mc-home-client/build/libs/`)*

## 📂 Estructura del Proyecto

*   `/react-ui` - Interfaz gráfica de usuario con React y Tailwind.
*   `/electron` - Backend principal de Electron y manejo de descargas/lanzamiento de Minecraft.
*   `/mc-home-client` - Mod en Java usando Fabric para inyectar nuestra interfaz en el propio juego.

## 🤝 Contribuciones
Las contribuciones son bienvenidas. Siéntete libre de hacer un _fork_ del proyecto, crear una rama para tus características (`feat/nueva-funcion`) y abrir un _Pull Request_.

## 📝 Licencia
Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.
