import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { loadEnv } from "./config/env";
import { Router, type RouteServices } from "./core/http/router";
import { html, json } from "./core/http/response";
import { TokenService } from "./core/security/token-service";
import { registerAccountRoutes } from "./modules/accounts/accounts.routes";
import { AccountsService } from "./modules/accounts/accounts.service";
import { registerBannerRoutes } from "./modules/banners/banners.routes";
import { BannersService } from "./modules/banners/banners.service";
import { DownloadsService } from "./modules/downloads/downloads.service";
import { registerDownloadRoutes } from "./modules/downloads/downloads.routes";
import { registerHealthRoutes } from "./modules/health/health.routes";
import { HotupdatesService } from "./modules/hotupdates/hotupdates.service";
import { registerHotupdateRoutes } from "./modules/hotupdates/hotupdates.routes";
import { LoginService } from "./modules/login/login.service";
import { registerLoginRoutes } from "./modules/login/login.routes";
import { registerPublicConfigRoutes } from "./modules/public-config/public-config.routes";
import { LauncherActivityService } from "./modules/launcher-socket/launcher-activity.service";
import { PostgresDatabase } from "./infrastructure/postgres/database";
import { runMigrations } from "./infrastructure/postgres/migrate";
import { RedisCache } from "./infrastructure/redis/cache";

const loadBackendDotenv = (): void => {
  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, "backend", ".env.local"),
    path.join(cwd, "backend", ".env"),
    path.join(cwd, ".env.local"),
    path.join(cwd, ".env"),
  ];

  for (const filePath of candidates) {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false, quiet: true });
    }
  }
};

loadBackendDotenv();

const bootstrap = async (): Promise<void> => {
  const env = loadEnv();
  const packageJsonPath = path.join(process.cwd(), "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as { version?: string };

  const postgres = new PostgresDatabase(env.postgresUrl);
  await postgres.connect();
  await runMigrations(postgres);

  const redis = new RedisCache(env.redisUrl);
  await redis.connect();

  const services = {} as RouteServices;
  services.env = env;
  services.postgres = postgres;
  services.redis = redis;
  services.tokenService = new TokenService(env.jwtSecret);
  services.accountsService = new AccountsService(postgres);
  services.bannersService = new BannersService(postgres, redis);
  services.downloadsService = new DownloadsService(env.publicBaseUrl, packageJson.version || "0.0.0", redis, [
    { scope: "launcher", dir: env.downloadsDir },
    { scope: "installer", dir: env.installerDownloadsDir },
  ]);
  services.launcherActivityService = new LauncherActivityService(redis, env);
  services.hotupdatesService = new HotupdatesService(
    env.publicBaseUrl,
    packageJson.version || "0.0.0",
    redis,
    env.hotupdatePackagesDir,
  );
  services.loginService = new LoginService(env, services.accountsService, services.tokenService, redis);
  services.startedAt = Date.now();

  const router = new Router();

  router.add(
    "GET",
    "/",
    () =>
      html(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>MC Launch API</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; background: #07111f; color: #edf4ff; }
      main { max-width: 860px; margin: 0 auto; padding: 48px 24px; }
      code { background: rgba(255,255,255,0.08); padding: 2px 8px; border-radius: 8px; }
      .card { border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); border-radius: 18px; padding: 20px; }
    </style>
  </head>
  <body>
    <main>
      <div class="card">
        <h1>MC Launch API</h1>
        <p>Backend Bun versionado, hexagonal y micromodular para login, cuentas, downloads y hotupdates.</p>
        <p>Base URL: <code>${env.publicBaseUrl}</code></p>
        <p>Explora las rutas en <code>/api</code> y <code>/api/v1/health</code>.</p>
      </div>
    </main>
  </body>
</html>`),
    {
      module: "meta",
      summary: "Landing minima del backend.",
    },
  );

  router.add(
    "GET",
    "/api",
    () =>
      json({
        ok: true,
        data: {
          name: "MC Launch API",
          version: "v1",
          baseUrl: env.publicBaseUrl,
          routes: router.describe(),
        },
      }),
    {
      module: "meta",
      summary: "Indice de rutas publicas y privadas disponibles en el backend.",
    },
  );

  registerHealthRoutes(router);
  registerPublicConfigRoutes(router);
  registerLoginRoutes(router);
  registerAccountRoutes(router);
  registerBannerRoutes(router);
  registerDownloadRoutes(router);
  registerHotupdateRoutes(router);

  const server = Bun.serve<{ sessionId: string }>({
    hostname: env.host,
    port: env.port,
    fetch: (request, serverRef) => {
      const url = new URL(request.url);
      if (url.pathname === "/ws/v1/launcher") {
        const upgraded = serverRef.upgrade(request, {
          data: {
            sessionId: randomUUID(),
          },
        });

        if (upgraded) {
          return;
        }

        return json(
          {
            ok: false,
            error: {
              code: "WS_UPGRADE_FAILED",
              message: "No fue posible abrir el canal WebSocket del launcher.",
            },
          },
          { status: 400 },
        );
      }

      return router.handle(request, services);
    },
    error: (error) =>
      json(
        {
          ok: false,
          error: {
            code: "INTERNAL_SERVER_ERROR",
            message: error.message,
          },
        },
        { status: 500 },
      ),
    websocket: {
      open: async (ws) => {
        await services.launcherActivityService.registerConnection(ws.data.sessionId);
        ws.send(JSON.stringify(services.launcherActivityService.createWelcomeMessage(ws.data.sessionId)));
      },
      message: async (ws, message) => {
        const text = typeof message === "string" ? message : message.toString("utf8");
        const responses = await services.launcherActivityService.handleMessage(ws.data.sessionId, text);
        for (const payload of responses) {
          ws.send(JSON.stringify(payload));
        }
      },
      close: async (ws) => {
        await services.launcherActivityService.disconnect(ws.data.sessionId);
      },
    },
  });

  console.log(`[api] MC Launch API escuchando en ${env.publicBaseUrl}`);
  console.log(`[api] Postgres: ${env.postgresUrl}`);
  console.log(`[api] Redis: ${env.redisUrl}`);
  console.log(`[api] Descargas launcher: ${env.downloadsDir}`);
  console.log(`[api] Descargas installer: ${env.installerDownloadsDir}`);
  console.log(`[api] Hotupdates: ${env.hotupdatePackagesDir}`);
  console.log(`[api] WebSocket launcher: ${env.publicBaseUrl.replace(/^http/i, "ws")}/ws/v1/launcher`);

  process.on("SIGINT", async () => {
    server.stop(true);
    await Promise.allSettled([redis.close(), postgres.close()]);
    process.exit(0);
  });
};

bootstrap().catch((error) => {
  console.error("[api] error fatal durante el bootstrap", error);
  process.exit(1);
});
