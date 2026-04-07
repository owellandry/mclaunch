import { json } from "../../core/http/response";
import type { Router } from "../../core/http/router";
import type { LogLevel } from "./logs.service";

const resolveLevel = (value: string | null): LogLevel | undefined => {
  if (value === "debug" || value === "info" || value === "warn" || value === "error") return value;
  return undefined;
};

const resolveLimit = (value: string | null): number | undefined => {
  if (!value?.trim()) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

export const registerLogsRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/logs",
    ({ query, services }) => {
      const level = resolveLevel(query.get("level"));
      const moduleName = query.get("module")?.trim() || undefined;
      const text = query.get("text")?.trim() || undefined;
      const sessionId = query.get("sessionId")?.trim() || undefined;
      const limit = resolveLimit(query.get("limit"));

      const data = services.logsService.list({
        level,
        module: moduleName,
        text,
        sessionId,
        limit,
      });

      return json({
        ok: true,
        data: {
          ...data,
          filters: {
            level: level ?? null,
            module: moduleName ?? null,
            text: text ?? null,
            sessionId: sessionId ?? null,
            limit: limit ?? 100,
          },
        },
      });
    },
    {
      private: true,
      module: "logs",
      summary: "Devuelve logs internos recientes del backend para diagnostico. Ruta privada.",
    },
  );
};
