# Backend API

Backend HTTP + WebSocket del ecosistema del launcher. Corre sobre Bun, usa PostgreSQL para persistencia, Redis para cache/sesiones y expone rutas versionadas bajo `/api/v1`.

Este README esta pensado para responder tres preguntas rapido:

1. Que hace el backend.
2. Que endpoints existen y como se usan.
3. Que necesita en disco y en variables de entorno para funcionar.

## Resumen rapido

- Runtime: Bun
- HTTP server: `Bun.serve`
- Persistencia: PostgreSQL
- Cache y sesiones temporales: Redis
- Login Microsoft/Minecraft: `msmc`
- Version de API actual: `v1`
- WebSocket del launcher: `/ws/v1/launcher`

## Que resuelve este backend

- Healthcheck y metadata publica minima del ecosistema.
- Login OAuth con Microsoft y normalizacion de cuentas Minecraft.
- Emision y validacion de JWT propios del backend.
- Persistencia de cuentas en PostgreSQL.
- Catalogo de builds de launcher e installer a partir de archivos presentes en disco.
- Catalogo de hotupdates a partir de manifests JSON + bundles ya publicados.
- CRUD de banners promocionales.
- Canal WebSocket para actividad del launcher y entrega de config inicial.
- Buffer interno de logs para diagnostico.

## Estructura

```text
backend/
|-- .env.example
|-- package.json
|-- README.md
|-- src/
|   |-- index.ts
|   |-- config/
|   |   `-- env.ts
|   |-- core/
|   |   |-- http/
|   |   |   |-- response.ts
|   |   |   `-- router.ts
|   |   `-- security/
|   |       `-- token-service.ts
|   |-- infrastructure/
|   |   |-- filesystem/
|   |   |   `-- artifacts.ts
|   |   |-- postgres/
|   |   |   |-- database.ts
|   |   |   `-- migrate.ts
|   |   `-- redis/
|   |       `-- cache.ts
|   |-- modules/
|   |   |-- accounts/
|   |   |-- banners/
|   |   |-- downloads/
|   |   |-- health/
|   |   |-- hotupdates/
|   |   |-- launcher-socket/
|   |   |-- login/
|   |   |-- logs/
|   |   `-- public-config/
|   `-- types/
|       `-- bun.d.ts
`-- tsconfig.json
```

## Bootstrap y ciclo de vida

El entrypoint es [src/index.ts](./src/index.ts).

En el arranque hace esto:

1. Carga `.env.local` y `.env` desde `backend/` o desde la raiz del repo.
2. Resuelve configuracion con [src/config/env.ts](./src/config/env.ts).
3. Conecta a PostgreSQL.
4. Ejecuta migraciones minimas (`accounts` y `banners`).
5. Conecta a Redis.
6. Instancia todos los servicios de dominio.
7. Registra rutas HTTP y el WebSocket.
8. Empieza a escuchar en `MCLAUNCH_API_BASE_URL`.

## Scripts

Desde la raiz del repo:

```bash
pnpm dev:api
pnpm start:api
pnpm typecheck:api
```

Desde la carpeta `backend/`:

```bash
bun install
bun run dev
bun run start
bun run typecheck
```

## Variables de entorno

Las variables viven normalmente en `backend/.env`.

| Variable | Uso | Default |
| --- | --- | --- |
| `MCLAUNCH_API_PORT` | Puerto HTTP | `8787` |
| `MCLAUNCH_API_HOST` | Host de escucha | `127.0.0.1` |
| `MCLAUNCH_API_BASE_URL` | URL publica base usada en respuestas y links de descarga | `http://127.0.0.1:8787` |
| `MCLAUNCH_API_JWT_SECRET` | Secreto para firmar JWT propios | `mclaunch-dev-secret-change-me` |
| `MCLAUNCH_DISCORD_CLIENT_ID` | Se envia al launcher por WebSocket | vacio |
| `MCLAUNCH_MICROSOFT_CLIENT_ID` | OAuth Microsoft | vacio |
| `MCLAUNCH_MICROSOFT_CLIENT_SECRET` | OAuth Microsoft confidencial | vacio |
| `MCLAUNCH_MICROSOFT_REDIRECT_URI` | Callback OAuth | `${MCLAUNCH_API_BASE_URL}/api/v1/login/callback` |
| `MCLAUNCH_POSTGRES_URL` | Conexion a PostgreSQL | `postgres://postgres:postgres@127.0.0.1:5432/mclaunch` |
| `MCLAUNCH_REDIS_URL` | Conexion a Redis | `redis://127.0.0.1:6379` |
| `MCLAUNCH_DOWNLOADS_DIR` | Carpeta de builds del launcher | `dist` |
| `MCLAUNCH_INSTALLER_DOWNLOADS_DIR` | Carpeta de builds del installer | `react-installer/dist-installer` |
| `MCLAUNCH_HOTUPDATE_PACKAGES_DIR` | Carpeta de manifests y bundles de hotupdate | `build/hotupdates` |

## Persistencia y cache

### PostgreSQL

Las migraciones actuales crean solo estas tablas:

- `accounts`
- `banners`

No hay un sistema de migraciones incremental con versiones; [src/infrastructure/postgres/migrate.ts](./src/infrastructure/postgres/migrate.ts) ejecuta una lista fija de `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`.

### Redis

Redis se usa para:

- Sesiones temporales de login OAuth.
- Cache del catalogo de descargas.
- Cache del catalogo de hotupdates.
- Cache publica de banners.
- Estado de sesiones del WebSocket del launcher.

Claves importantes:

- `mclaunch:login:session:*`
- `mclaunch:downloads:catalog:v1`
- `mclaunch:hotupdates:catalog:v2`
- `mclaunch:banners:list:public:*`
- `mclaunch:launcher:ws:session:*`
- `mclaunch:launcher:ws:latest`

## Auth y seguridad

Las rutas privadas exigen:

```http
Authorization: Bearer <token>
```

El token lo firma [src/core/security/token-service.ts](./src/core/security/token-service.ts) usando HMAC SHA-256 y el secreto `MCLAUNCH_API_JWT_SECRET`.

Notas utiles:

- No depende de una libreria JWT externa.
- El payload guarda `sub`, `username`, `scopes`, `provider`, `iat` y `exp`.
- Si el token expira o la firma no coincide, la ruta responde `401`.

## Endpoints

La API puede auto-describirse via `GET /api`, pero aqui va el mapa humano.

### Meta y salud

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `GET` | `/` | publica | Landing HTML minima del backend |
| `GET` | `/api` | publica | Indice JSON con rutas registradas |
| `GET` | `/api/v1/health` | publica | Valida Postgres y Redis y devuelve uptime |
| `GET` | `/api/v1/public-config` | publica | Devuelve metadata publica minima del ecosistema |

Ejemplo de healthcheck:

```bash
curl http://127.0.0.1:8787/api/v1/health
```

### Login

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `GET` | `/api/v1/login/start` | publica | Inicia login OAuth y devuelve `authorizeUrl`, `sessionId`, `callbackUrl`, `expiresAt` |
| `GET` | `/api/v1/login/status/:sessionId` | publica | Consulta el estado de una sesion de login |
| `GET` | `/api/v1/login/callback` | publica | Callback OAuth actual, usa `state` para encontrar la sesion |
| `GET` | `/api/v1/login/callback/:sessionId` | publica | Callback legacy con `sessionId` en la ruta |
| `POST` | `/api/v1/login/from-launcher` | privada | Registra un login ya resuelto en Electron y emite JWT de backend |
| `POST` | `/api/v1/login/logout` | privada | Placeholder de logout |

#### Flujo OAuth actual

1. El launcher llama `GET /api/v1/login/start`.
2. La API responde con la URL de Microsoft y un `sessionId`.
3. El usuario autentica en Microsoft.
4. Microsoft redirige a `MCLAUNCH_MICROSOFT_REDIRECT_URI`.
5. El callback guarda el resultado en Redis.
6. El launcher consulta `GET /api/v1/login/status/:sessionId` hasta ver `status = "completed"`.
7. Cuando termina, el backend devuelve:
   - `accessToken` del backend
   - `account` persistida en Postgres
   - `launcher.msmcToken`
   - `launcher.mclcAuth`
   - `launcher.profile`

#### Query params de `GET /api/v1/login/start`

| Param | Requerido | Uso |
| --- | --- | --- |
| `prompt` | no | Se pasa a Microsoft. Default: `select_account` |

Ejemplo:

```bash
curl "http://127.0.0.1:8787/api/v1/login/start?prompt=select_account"
```

#### Body de `POST /api/v1/login/from-launcher`

```json
{
  "msmcToken": "token serializado por msmc",
  "mclcAuth": {},
  "profile": {
    "id": "uuid-de-minecraft",
    "name": "Player",
    "skins": [
      {
        "state": "ACTIVE",
        "url": "https://..."
      }
    ]
  }
}
```

### Accounts

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `POST` | `/api/v1/accounts` | publica | Crea una cuenta local basica |
| `GET` | `/api/v1/accounts` | privada | Lista cuentas persistidas |
| `GET` | `/api/v1/accounts/me` | privada | Devuelve la cuenta asociada al token |

#### Body de `POST /api/v1/accounts`

```json
{
  "displayName": "Burge",
  "email": "burge@example.com"
}
```

Reglas:

- `displayName` es obligatorio.
- `email` es opcional.
- Las cuentas Microsoft se crean o actualizan automaticamente durante login.

### Downloads

Sirve para indexar builds del launcher e installer a partir de archivos presentes en disco.

Roots usadas hoy:

- `launcher` -> `MCLAUNCH_DOWNLOADS_DIR`
- `installer` -> `MCLAUNCH_INSTALLER_DOWNLOADS_DIR`

El escaneo infiere:

- `platform` por nombre/ext (`.exe`, `.dmg`, `.AppImage`, `win`, `mac`, `linux`)
- `arch` por nombre (`x64`, `arm64`, `x86`, etc.)
- `kind` por extension (`installer`, `portable`, `binary`, `package`, `archive`)

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `GET` | `/api/v1/downloads` | publica | Lista artefactos filtrables |
| `GET` | `/api/v1/downloads/resolve` | publica | Devuelve el mejor match para los filtros enviados |
| `GET` | `/api/v1/downloads/files/:app/:fileName` | publica | Descarga el binario real |
| `POST` | `/api/v1/downloads/reindex` | privada | Limpia cache y vuelve a indexar |

#### Query params soportados

| Param | Uso |
| --- | --- |
| `app` | `launcher` o `installer` |
| `platform` | `windows`, `macos`, `linux` |
| `arch` | `x64`, `arm64`, `x86`, `universal`, etc. |
| `kind` | `installer`, `portable`, `archive`, `package`, `binary` |

Ejemplos:

```bash
curl "http://127.0.0.1:8787/api/v1/downloads?app=installer&platform=windows&arch=x64"
curl "http://127.0.0.1:8787/api/v1/downloads/resolve?app=launcher&platform=linux&arch=arm64"
```

### Hotupdates

Sirve para listar y resolver paquetes de hotupdate publicados en `MCLAUNCH_HOTUPDATE_PACKAGES_DIR`.

No indexa cualquier zip suelto: espera manifests JSON validos y, para cada manifest, su bundle asociado.

Campos minimos esperados en el manifest:

- `releaseId`
- `publishedAt`
- `appVersion`
- `bundle.fileName`

Campos utiles adicionales:

- `channel`
- `commitSha`
- `platform`
- `arch`
- `bundle.sha256`
- `bundle.size`
- `runtime.entryFile`
- `runtime.preloadFile`
- `runtime.rendererDir`

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `GET` | `/api/v1/hotupdates` | publica | Lista manifests indexados |
| `GET` | `/api/v1/hotupdates/resolve` | publica | Devuelve el mejor hotupdate segun filtros |
| `GET` | `/api/v1/hotupdates/files/:fileName` | publica | Descarga manifest o bundle |
| `POST` | `/api/v1/hotupdates/reindex` | privada | Limpia cache y reindexa |

#### Query params soportados

| Param | Uso |
| --- | --- |
| `platform` | `windows`, `macos`, `linux` |
| `arch` | `x64`, `arm64`, `universal`, etc. |
| `channel` | `stable`, `beta`, etc. |

Ejemplo:

```bash
curl "http://127.0.0.1:8787/api/v1/hotupdates/resolve?platform=windows&arch=x64&channel=stable"
```

### Banners

Persistencia y exposicion de banners publicitarios o promocionales.

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `GET` | `/api/v1/banners` | publica | Lista banners activos y vigentes |
| `GET` | `/api/v1/banners/admin` | privada | Lista banners para administracion |
| `POST` | `/api/v1/banners` | privada | Crea un banner |
| `PATCH` | `/api/v1/banners/:id` | privada | Actualiza un banner |
| `DELETE` | `/api/v1/banners/:id` | privada | Elimina un banner |
| `POST` | `/api/v1/banners/reindex` | privada | Limpia cache publica de banners |

#### Query params de lectura

| Ruta | Param | Uso |
| --- | --- | --- |
| `/api/v1/banners` | `placement` | filtra banners activos por placement |
| `/api/v1/banners/admin` | `placement` | filtra cualquier banner por placement |
| `/api/v1/banners/admin` | `includeInactive=true` | incluye inactivos y fuera de vigencia |

#### Body de creacion

```json
{
  "slug": "season-01",
  "title": "Temporada 1",
  "subtitle": "Nuevo contenido disponible",
  "imageUrl": "https://cdn.example.com/banner.png",
  "mobileImageUrl": "https://cdn.example.com/banner-mobile.png",
  "targetUrl": "https://slaumcher.net/",
  "placement": "home-top",
  "variant": "default",
  "isActive": true,
  "sortOrder": 10,
  "startsAt": "2026-04-01T00:00:00.000Z",
  "endsAt": "2026-05-01T00:00:00.000Z",
  "metadata": {
    "campaign": "launch"
  }
}
```

Minimos obligatorios:

- `slug`
- `title`
- `imageUrl`
- `placement`

### Logs internos

Existe una ruta interna oculta para diagnostico:

| Metodo | Ruta | Auth | Que hace |
| --- | --- | --- | --- |
| `GET` | `/api/v1/NX4u7o2q84` | publica pero oculta | Devuelve logs recientes en memoria |

Query params:

- `level`
- `module`
- `text`
- `sessionId`
- `limit`

Notas:

- No aparece en `GET /api` porque esta marcada como `hidden`.
- No persiste en disco.
- Mantiene hasta 500 entradas en memoria.

## WebSocket del launcher

Ruta:

```text
WS /ws/v1/launcher
```

Al conectar:

- El servidor genera un `sessionId`.
- Registra la sesion en Redis.
- Responde un mensaje `welcome` con config inicial.

### Mensajes cliente -> servidor

#### `hello`

```json
{
  "type": "hello",
  "launcherVersion": "0.1.0",
  "platform": "windows",
  "arch": "x64"
}
```

#### `activity`

```json
{
  "type": "activity",
  "mode": "playing",
  "startedAt": 1712634000000,
  "username": "Player",
  "version": "1.20.1"
}
```

`mode` solo acepta:

- `launcher`
- `launching`
- `playing`

#### `ping`

```json
{
  "type": "ping",
  "sentAt": 1712634000000
}
```

### Mensajes servidor -> cliente

#### `welcome`

```json
{
  "type": "welcome",
  "sessionId": "uuid",
  "serverTime": 1712634000000,
  "config": {
    "discordClientId": "..."
  }
}
```

#### `ack`

```json
{
  "type": "ack",
  "event": "hello",
  "serverTime": 1712634000000
}
```

#### `pong`

```json
{
  "type": "pong",
  "serverTime": 1712634000000,
  "sentAt": 1712634000000
}
```

#### `error`

```json
{
  "type": "error",
  "code": "INVALID_JSON",
  "message": "El mensaje recibido no es JSON valido."
}
```

## Contrato de carpetas para artefactos

### Downloads

El backend escanea archivos reales. Si las carpetas estan vacias, `downloads` respondera listas vacias.

Ubicaciones por default:

- Launcher: `dist`
- Installer: `react-installer/dist-installer`

Extensiones permitidas:

- `.zip`
- `.exe`
- `.msi`
- `.dmg`
- `.pkg`
- `.appimage`
- `.deb`
- `.rpm`
- `.tar.gz`
- `.tgz`
- `.bin`

### Hotupdates

La carpeta `build/hotupdates` debe contener manifests `.json` y sus bundles asociados.

Ejemplo conceptual:

```text
build/hotupdates/
|-- win-x64-stable-2026-04-09.json
`-- win-x64-stable-2026-04-09.zip
```

El manifest puede declarar runtime custom; si no, el backend usa estos defaults:

- `dist-electron/app-main.js`
- `dist-electron/preload.js`
- `react-ui/dist`

## Ejemplos de uso rapido

### Ver rutas disponibles

```bash
curl http://127.0.0.1:8787/api
```

### Crear una cuenta local

```bash
curl -X POST http://127.0.0.1:8787/api/v1/accounts ^
  -H "content-type: application/json" ^
  -d "{\"displayName\":\"Burge\",\"email\":\"burge@example.com\"}"
```

### Listar installer Windows x64

```bash
curl "http://127.0.0.1:8787/api/v1/downloads?app=installer&platform=windows&arch=x64"
```

### Resolver hotupdate estable para desktop Windows x64

```bash
curl "http://127.0.0.1:8787/api/v1/hotupdates/resolve?platform=windows&arch=x64&channel=stable"
```

### Reindexar downloads con Bearer token

```bash
curl -X POST http://127.0.0.1:8787/api/v1/downloads/reindex ^
  -H "authorization: Bearer TU_TOKEN"
```

## Despliegue

Existe el workflow [../.github/workflows/deploy-backend.yml](../.github/workflows/deploy-backend.yml).

Se dispara cuando hay push a `main` o `master` tocando:

- `backend/**`
- `.github/workflows/deploy-backend.yml`

Hace esto:

1. Valida host, user, path y SSH key.
2. Sincroniza `backend/` por `rsync`.
3. Excluye `.env`, `.env.local`, `node_modules` y `.git`.
4. Ejecuta remotamente `/usr/local/bin/mclaunch-backend-deploy`.

Variables/secret esperados en GitHub:

- `BACKEND_DEPLOY_HOST`
- `BACKEND_DEPLOY_PORT`
- `BACKEND_DEPLOY_USER`
- `BACKEND_DEPLOY_PATH`
- `BACKEND_DEPLOY_SSH_KEY`

## Notas practicas

- El backend mantiene nombres internos `MCLAUNCH_*` aunque la marca visible del producto cambie. Eso evita romper compatibilidad con despliegues y clientes ya configurados.
- `GET /api/v1/public-config` hoy devuelve `app.name = "MC Launch"` de forma literal. Si se quiere alinear branding publico desde backend, ese modulo hay que actualizarlo.
- Si Postgres o Redis no levantan, el backend falla en bootstrap.
- Si no hay client ID de Microsoft, `GET /api/v1/login/start` responde `503`.
- Si no hay archivos en las carpetas configuradas, `downloads` y `hotupdates` responden vacio sin fallar.
