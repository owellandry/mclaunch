# Plan de Rediseño del Frontend (Arquitectura Hexagonal)

## Resumen
Rediseño completo del frontend del launcher "MC Launch / Nebula Console" para implementar una arquitectura hexagonal estricta (Puertos y Adaptadores). El rediseño migrará la aplicación de una SPA monolítica basada en estado a un sistema enrutado con React Router (incluyendo las rutas de `/onboarding` y `/settings`). Se adoptará Tailwind CSS para construir un diseño visual cinemático y súper modular, y Zustand para orquestar la capa de aplicación sin acoplar la UI con la infraestructura (Electron).

## Análisis del Estado Actual
- **Estructura monolítica:** El frontend está centrado en `App.tsx` que maneja vistas mockeadas con `useState`, sin un enrutador real.
- **Estilos:** Todo el diseño recae en un archivo `App.css` global y difícil de mantener.
- **Infraestructura acoplada:** Las llamadas a Electron (`window.api.launchMinecraft`) y suscripciones a eventos de la consola están embebidas directamente en el componente principal de UI, rompiendo principios de separación de responsabilidades.

## Cambios Propuestos

### 1. Inicialización de Herramientas y Estructura
- **Dependencias:**
  - Instalar `react-router-dom` para manejar el enrutamiento.
  - Instalar `zustand` para el estado global y la capa de aplicación.
  - Instalar `tailwindcss`, `postcss`, y `autoprefixer` para el nuevo sistema de diseño.
- **Estructura de Carpetas:** Crear la estructura de arquitectura hexagonal dentro de `react-ui/src/`:
  - `core/`: Contendrá `domain` (entidades, tipos) y `ports` (interfaces).
  - `infrastructure/`: Contendrá `adapters` (Electron, LocalStorage).
  - `application/`: Contendrá stores de Zustand/Casos de uso.
  - `presentation/`: Contendrá `components` (UI base), `pages`, `layouts`, y el `router`.

### 2. Capa Core (Dominio y Puertos)
- **`core/domain/launcher.ts`:** Mover las definiciones de tipos como `LauncherStatus`, `Installation`, `Server`, etc.
- **`core/ports/ILauncherPort.ts`:** Definir la interfaz para iniciar el juego y escuchar logs.
- **`core/ports/IStoragePort.ts`:** Definir la interfaz para persistir la configuración (necesario para saber si el usuario pasó el onboarding).

### 3. Capa de Infraestructura (Adaptadores)
- **`infrastructure/adapters/ElectronLauncherAdapter.ts`:** Implementación de `ILauncherPort` que encapsula la interacción con `window.api`.
- **`infrastructure/adapters/LocalStorageAdapter.ts`:** Implementación de `IStoragePort` para guardar datos básicos como nombre de usuario, memoria y detectar si el onboarding fue completado.

### 4. Capa de Aplicación (Zustand Stores)
- **`application/store/useAppStore.ts`:** Unirá los adaptadores. Mantendrá el estado global (perfil del usuario, configuración del launcher, si requiere onboarding).
- **`application/store/useLauncherStore.ts`:** Manejará la lógica de la sesión de juego (logs, estado de la instalación, progreso), llamando al `ElectronLauncherAdapter`.

### 5. Capa de Presentación: Enrutamiento
- Crear `presentation/router/index.tsx` usando `createBrowserRouter`:
  - `/onboarding`: Nueva ruta para configurar el perfil inicial.
  - `/`: Layout principal (`MainLayout`) con un Sidebar y Topbar estáticos.
    - `/dashboard` (Ruta por defecto).
    - `/library` (Instalaciones).
    - `/servers` (Servidores mock).
    - `/settings` (Ajustes avanzados y de perfil).

### 6. Rediseño Visual (Tailwind CSS)
- **Estética:** Migrar los componentes a Tailwind CSS manteniendo la vibra "Cinematic Nebula" (glassmorphism, fondos oscuros de alto contraste, brillos de acento).
- **Componentes (`presentation/components`):**
  - **`ui/`:** Componentes reutilizables e independientes del dominio (Button, Card, Modal, Input).
  - **`layout/`:** `Sidebar`, `Topbar`.
  - **`features/`:** Paneles específicos (`PlayPanel`, `ServerCard`, `LogConsole`).
- **Páginas (`presentation/pages`):** Dividir el enorme `App.tsx` en `Onboarding.tsx`, `Dashboard.tsx`, `Library.tsx`, `Servers.tsx` y `Settings.tsx`.

## Suposiciones y Decisiones
- **Aislamiento Total:** Los componentes de React (Capa de Presentación) **nunca** llamarán directamente a `window.api` o `localStorage`. Todo pasará a través de los stores de Zustand que consumirán los adaptadores.
- **Persistencia Mockeada:** Como el perfil es un mock, usaremos `localStorage` temporalmente a través del adaptador de persistencia para mantener el estado entre recargas (y permitir que el onboarding sólo aparezca una vez).
- **Limpieza:** Se eliminarán `App.css` y el CSS anterior para dar paso a un ecosistema limpio de Tailwind CSS.

## Pasos de Verificación
1. **Compilación:** Ejecutar `npm run dev` o `npm run build` en `react-ui` y confirmar que no hay errores de TypeScript.
2. **Flujo de Onboarding:** Al entrar sin datos previos, la aplicación debe forzar la redirección a `/onboarding`. Al completar los datos, debe llevar al usuario a `/dashboard`.
3. **Navegación:** Comprobar que los enlaces del Sidebar cambian la ruta y renderizan los componentes de `Library`, `Servers` y `Settings` sin recargar la página.
4. **Desacoplamiento:** Simular el evento "Play" y verificar que los logs y estados de la consola fluyen correctamente desde el Adaptador de Electron hacia el estado de Zustand, actualizando la UI de forma reactiva.
5. **Estética:** Verificar que el rediseño conserva la estética solicitada (UI premium, modular, con Tailwind).