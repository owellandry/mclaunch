import { json, noContent } from "../../core/http/response";
import type { Router } from "../../core/http/router";

type BannerPayload = {
  slug?: string;
  title?: string;
  subtitle?: string | null;
  imageUrl?: string;
  mobileImageUrl?: string | null;
  targetUrl?: string | null;
  placement?: string;
  variant?: string;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  metadata?: Record<string, unknown>;
};

const validateCreatePayload = (body: BannerPayload): string | null => {
  if (!body.slug?.trim()) return "slug es obligatorio.";
  if (!body.title?.trim()) return "title es obligatorio.";
  if (!body.imageUrl?.trim()) return "imageUrl es obligatorio.";
  if (!body.placement?.trim()) return "placement es obligatorio.";
  return null;
};

export const registerBannerRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/banners",
    async ({ query, services }) => {
      const placement = query.get("placement") || undefined;
      const banners = await services.bannersService.listPublic({ placement });
      return json({ ok: true, data: banners });
    },
    {
      module: "banners",
      summary: "Lista banners publicos activos, opcionalmente filtrados por placement.",
    },
  );

  router.add(
    "GET",
    "/api/v1/banners/admin",
    async ({ query, services }) => {
      const placement = query.get("placement") || undefined;
      const includeInactive = query.get("includeInactive") === "true";
      const banners = await services.bannersService.listAll({ placement, includeInactive });
      return json({ ok: true, data: banners });
    },
    {
      private: true,
      module: "banners",
      summary: "Lista banners para administracion. Ruta privada.",
    },
  );

  router.add(
    "POST",
    "/api/v1/banners",
    async ({ jsonBody, services }) => {
      const body = await jsonBody<BannerPayload>();
      const validationError = validateCreatePayload(body);
      if (validationError) {
        return json(
          {
            ok: false,
            error: {
              code: "INVALID_BANNER_PAYLOAD",
              message: validationError,
            },
          },
          { status: 400 },
        );
      }

      const banner = await services.bannersService.create({
        slug: body.slug as string,
        title: body.title as string,
        subtitle: body.subtitle ?? null,
        imageUrl: body.imageUrl as string,
        mobileImageUrl: body.mobileImageUrl ?? null,
        targetUrl: body.targetUrl ?? null,
        placement: body.placement as string,
        variant: body.variant,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
        startsAt: body.startsAt ?? null,
        endsAt: body.endsAt ?? null,
        metadata: body.metadata ?? {},
      });

      return json({ ok: true, data: banner }, { status: 201 });
    },
    {
      private: true,
      module: "banners",
      summary: "Crea un banner nuevo. Ruta privada.",
    },
  );

  router.add(
    "PATCH",
    "/api/v1/banners/:id",
    async ({ params, jsonBody, services }) => {
      const body = await jsonBody<BannerPayload>();
      const banner = await services.bannersService.update(params.id, body);

      if (!banner) {
        return json(
          {
            ok: false,
            error: {
              code: "BANNER_NOT_FOUND",
              message: "No se encontro el banner solicitado.",
            },
          },
          { status: 404 },
        );
      }

      return json({ ok: true, data: banner });
    },
    {
      private: true,
      module: "banners",
      summary: "Actualiza un banner existente. Ruta privada.",
    },
  );

  router.add(
    "DELETE",
    "/api/v1/banners/:id",
    async ({ params, services }) => {
      const deleted = await services.bannersService.remove(params.id);
      if (!deleted) {
        return json(
          {
            ok: false,
            error: {
              code: "BANNER_NOT_FOUND",
              message: "No se encontro el banner solicitado.",
            },
          },
          { status: 404 },
        );
      }

      return noContent();
    },
    {
      private: true,
      module: "banners",
      summary: "Elimina un banner. Ruta privada.",
    },
  );

  router.add(
    "POST",
    "/api/v1/banners/reindex",
    async ({ services }) => json({ ok: true, data: await services.bannersService.reindex() }),
    {
      private: true,
      module: "banners",
      summary: "Limpia cache publica de banners. Ruta privada.",
    },
  );
};
