import { json } from "../../core/http/response";
import type { Router } from "../../core/http/router";

export const registerDownloadRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/downloads",
    async ({ query, services }) => {
      const items = await services.downloadsService.list({
        app: query.get("app") || undefined,
        platform: query.get("platform") || undefined,
        arch: query.get("arch") || undefined,
        kind: query.get("kind") || undefined,
      });

      return json({
        ok: true,
        data: {
          filters: {
            app: query.get("app"),
            platform: query.get("platform"),
            arch: query.get("arch"),
            kind: query.get("kind"),
          },
          items,
        },
      });
    },
    {
      module: "downloads",
      summary: "Lista los artefactos encontrados para launcher e installer usando filtros por query params.",
    },
  );

  router.add(
    "GET",
    "/api/v1/downloads/resolve",
    async ({ query, services }) => {
      const artifact = await services.downloadsService.resolve({
        app: query.get("app") || undefined,
        platform: query.get("platform") || undefined,
        arch: query.get("arch") || undefined,
        kind: query.get("kind") || undefined,
      });

      if (!artifact) {
        return json(
          {
            ok: false,
            error: {
              code: "DOWNLOAD_NOT_FOUND",
              message: "No se encontro un artefacto que coincida con los parametros solicitados.",
            },
          },
          { status: 404 },
        );
      }

      return json({ ok: true, data: artifact });
    },
    {
      module: "downloads",
      summary: "Resuelve el mejor artefacto segun app, plataforma, arquitectura y tipo.",
    },
  );

  router.add(
    "GET",
    "/api/v1/downloads/files/:app/:fileName",
    async ({ params, services }) => {
      const file = await services.downloadsService.readFile(params.app, params.fileName);
      if (!file) {
        return json(
          {
            ok: false,
            error: {
              code: "DOWNLOAD_FILE_NOT_FOUND",
              message: "No se encontro el archivo solicitado.",
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
      module: "downloads",
      summary: "Descarga un artefacto publico encontrado por el servicio de downloads.",
    },
  );

  router.add(
    "POST",
    "/api/v1/downloads/reindex",
    async ({ services }) => json({ ok: true, data: await services.downloadsService.reindex() }),
    {
      private: true,
      module: "downloads",
      summary: "Fuerza un reindex del catalogo de descargas. Ruta privada.",
    },
  );
};
