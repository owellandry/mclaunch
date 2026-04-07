# MC Launch API

Backend construido con Bun para soportar autenticacion, cuentas, banners, descargas y hotupdates del launcher.

## Stack actual

- Bun para el servidor HTTP
- PostgreSQL para persistencia
- Redis para sesiones temporales y cache
- `msmc` para login Microsoft/Minecraft

## Objetivos de esta base

- rutas versionadas bajo `/api/v1`
- canal WebSocket versionado para actividad del launcher bajo `/ws/v1`
- separacion modular por dominio
- distincion entre rutas publicas y privadas
- login Microsoft/Minecraft reutilizando `msmc`
- persistencia de cuentas en PostgreSQL
- sesiones de login y cache de catalogos en Redis
- resolucion de descargas por parametros (`app`, `platform`, `arch`, `kind`)
- almacenamiento y entrega de banners para distintas ubicaciones de la app
- soporte inicial para paquetes de hotupdate

## Estructura

```text
backend/
|-- src/
|   |-- config/                  # variables de entorno
|   |-- core/                    # router, respuestas y seguridad
|   |-- infrastructure/
|   |   |-- filesystem/          # escaneo de artefactos
|   |   |-- postgres/            # cliente y migraciones
|   |   `-- redis/               # cache y sesiones
|   |-- modules/
|   |   |-- accounts/            # cuentas persistidas en Postgres
|   |   |-- banners/             # banners reutilizables para distintas vistas
|   |   |-- downloads/           # catalogo de builds del launcher/installer
|   |   |-- health/              # healthcheck
|   |   |-- hotupdates/          # paquetes de hotupdate
|   |   `-- login/               # login Microsoft/Minecraft
|   `-- index.ts                 # bootstrap del servidor
`-- tsconfig.json
```

## Comandos

```bash
pnpm dev:api
pnpm start:api
pnpm typecheck:api
```

Tambien puedes trabajar el backend como paquete aislado:

```bash
cd backend
bun install
bun run dev
```

## Variables principales

Las variables del backend deben vivir en `backend/.env`.

- `MCLAUNCH_API_PORT`
- `MCLAUNCH_API_HOST`
- `MCLAUNCH_API_BASE_URL`
- `MCLAUNCH_API_JWT_SECRET`
- `MCLAUNCH_DISCORD_CLIENT_ID`
- `MCLAUNCH_MICROSOFT_CLIENT_ID`
- `MCLAUNCH_MICROSOFT_CLIENT_SECRET`
- `MCLAUNCH_MICROSOFT_REDIRECT_URI`
- `MCLAUNCH_POSTGRES_URL`
- `MCLAUNCH_REDIS_URL`
- `MCLAUNCH_DOWNLOADS_DIR`
- `MCLAUNCH_INSTALLER_DOWNLOADS_DIR`
- `MCLAUNCH_HOTUPDATE_PACKAGES_DIR`

## Rutas publicas

- `GET /api`
- `GET /api/v1/health`
- `GET /api/v1/public-config`
- `GET /api/v1/login/start`
- `GET /api/v1/login/status/:sessionId`
- `GET /api/v1/login/callback/:sessionId`
- `POST /api/v1/accounts`
- `GET /api/v1/downloads`
- `GET /api/v1/downloads/resolve`
- `GET /api/v1/downloads/files/:app/:fileName`
- `GET /api/v1/banners`
- `GET /api/v1/hotupdates`
- `GET /api/v1/hotupdates/resolve`
- `GET /api/v1/hotupdates/files/:fileName`

## Socket del launcher

- `WS /ws/v1/launcher`

Este canal se usa para:

- registrar la sesion activa del launcher
- reportar estados como `launcher`, `launching` y `playing`
- devolver configuracion inicial al cliente al conectar, como el `discordClientId`
- dejar lista una base para futuros eventos en tiempo real

## Rutas privadas

Requieren `Authorization: Bearer <token>`

- `POST /api/v1/login/logout`
- `GET /api/v1/accounts`
- `GET /api/v1/accounts/me`
- `GET /api/v1/banners/admin`
- `POST /api/v1/banners`
- `PATCH /api/v1/banners/:id`
- `DELETE /api/v1/banners/:id`
- `POST /api/v1/banners/reindex`
- `POST /api/v1/downloads/reindex`
- `POST /api/v1/hotupdates/reindex`

## Flujo de login

1. El launcher llama `GET /api/v1/login/start`
2. La API devuelve `authorizeUrl`, `sessionId` y `callbackUrl`
3. El launcher abre esa URL en navegador o webview
4. Microsoft redirige al callback fijo configurado en `MCLAUNCH_MICROSOFT_REDIRECT_URI`
5. El launcher consulta `GET /api/v1/login/status/:sessionId`
6. Cuando el estado es `completed`, la respuesta incluye:
   - token del backend
   - cuenta normalizada desde Postgres
   - payload util para el launcher (`msmcToken`, `mclcAuth`, `profile`)

## Notas

- Las cuentas ya no se guardan en JSON.
- Redis se usa para sesiones de login y cache del catalogo de downloads/hotupdates.
- La metadata publica minima para clientes se expone desde `/api/v1/public-config`.
- El `MCLAUNCH_DISCORD_CLIENT_ID` vive del lado del backend y Electron lo recibe al abrir el socket `/ws/v1/launcher`.
- El login backend requiere una app propia registrada en Microsoft Entra ID. El `redirect_uri` debe coincidir exactamente con `MCLAUNCH_MICROSOFT_REDIRECT_URI`.
- Los modulos de descargas y hotupdates exponen artefactos encontrados en disco; si no existen builds en los directorios configurados, responderan vacios.

## Despliegue al servidor

El repo incluye el workflow `deploy-backend.yml` para desplegar automaticamente cuando cambie `backend/`.

Convenciones del servidor ya preparadas:

- usuario de deploy: `mclaunch`
- carpeta del codigo: `/opt/mclaunch/backend/app`
- archivo de entorno manual: `/opt/mclaunch/backend/shared/.env`
- servicio: `mclaunch-backend.service`
- comando remoto de deploy: `/usr/local/bin/mclaunch-backend-deploy`

Variables de GitHub recomendadas:

- `BACKEND_DEPLOY_HOST`
- `BACKEND_DEPLOY_PORT`
- `BACKEND_DEPLOY_USER`
- `BACKEND_DEPLOY_PATH`

Secret de GitHub requerido:

- `BACKEND_DEPLOY_SSH_KEY`

El `.env` del servidor no lo sube el workflow. Debe existir manualmente en `/opt/mclaunch/backend/shared/.env` antes del primer deploy.
