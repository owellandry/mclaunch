import { json } from "../../core/http/response";
import type { Router } from "../../core/http/router";

export const registerHotupdateRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/hotupdates",
    async ({ query, services }) => {
      const items = await services.hotupdatesService.list({
        platform: query.get("platform") || undefined,
        arch: query.get("arch") || undefined,
        channel: query.get("channel") || undefined,
      });

      return json({
        ok: true,
        data: {
          filters: {
            platform: query.get("platform"),
            arch: query.get("arch"),
            channel: query.get("channel"),
          },
          items,
        },
      });
    },
    {
      module: "hotupdates",
      summary: "Lista paquetes de hotupdate disponibles para futuras integraciones con Electron.",
    },
  );

  router.add(
    "GET",
    "/api/v1/hotupdates/resolve",
    async ({ query, services }) => {
      const artifact = await services.hotupdatesService.resolve({
        platform: query.get("platform") || undefined,
        arch: query.get("arch") || undefined,
        channel: query.get("channel") || undefined,
      });

      if (!artifact) {
        return json(
          {
            ok: false,
            error: {
              code: "HOTUPDATE_NOT_FOUND",
              message: "No se encontro un paquete de hotupdate que coincida con los parametros enviados.",
            },
          },
          { status: 404 },
        );
      }

      return json({ ok: true, data: artifact });
    },
    {
      module: "hotupdates",
      summary: "Resuelve el mejor paquete de hotupdate segun plataforma, arquitectura y canal.",
    },
  );

  router.add(
    "GET",
    "/api/v1/hotupdates/files/:fileName",
    async ({ params, services }) => {
      const file = await services.hotupdatesService.readFile(params.fileName);
      if (!file) {
        return json(
          {
            ok: false,
            error: {
              code: "HOTUPDATE_FILE_NOT_FOUND",
              message: "No se encontro el archivo de hotupdate solicitado.",
            },
          },
          { status: 404 },
        );
      }

      return new Response(new Uint8Array(file.bytes), {
        status: 200,
        headers: {
          "content-type": "application/octet-stream",
          "content-disposition": `attachment; filename="${file.artifact.fileName}"`,
          "content-length": String(file.artifact.size),
        },
      });
    },
    {
      module: "hotupdates",
      summary: "Descarga un paquete de hotupdate publico.",
    },
  );

  router.add(
    "POST",
    "/api/v1/hotupdates/reindex",
    async ({ services }) => json({ ok: true, data: await services.hotupdatesService.reindex() }),
    {
      private: true,
      module: "hotupdates",
      summary: "Fuerza un reindex del catalogo de hotupdates. Ruta privada.",
    },
  );
};
