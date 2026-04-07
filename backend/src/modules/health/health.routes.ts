import { json } from "../../core/http/response";
import type { Router } from "../../core/http/router";

export const registerHealthRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/health",
    async ({ services }) => {
      await services.postgres.query("select 1");
      const redis = await services.redis.ping();

      return json({
        ok: true,
        data: {
          status: "ok",
          uptimeMs: Date.now() - services.startedAt,
          timestamp: new Date().toISOString(),
          postgres: "ok",
          redis,
        },
      });
    },
    {
      module: "health",
      summary: "Chequeo simple de salud del backend.",
    },
  );
};
