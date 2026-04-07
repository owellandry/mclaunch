import { json } from "../../core/http/response";
import type { Router } from "../../core/http/router";

export const registerAccountRoutes = (router: Router): void => {
  router.add(
    "POST",
    "/api/v1/accounts",
    async ({ jsonBody, services }) => {
      const body = await jsonBody<{ displayName?: string; email?: string | null }>();
      const displayName = body.displayName?.trim();

      if (!displayName) {
        return json(
          {
            ok: false,
            error: {
              code: "INVALID_ACCOUNT_PAYLOAD",
              message: "displayName es obligatorio para crear una cuenta local.",
            },
          },
          { status: 400 },
        );
      }

      const account = await services.accountsService.createLocalAccount({
        displayName,
        email: body.email ?? null,
      });

      return json({ ok: true, data: account }, { status: 201 });
    },
    {
      module: "accounts",
      summary: "Crea una cuenta local basica para futuras extensiones del launcher.",
    },
  );

  router.add(
    "GET",
    "/api/v1/accounts",
    async ({ services }) => json({ ok: true, data: await services.accountsService.list() }),
    {
      private: true,
      module: "accounts",
      summary: "Lista las cuentas registradas. Ruta privada.",
    },
  );

  router.add(
    "GET",
    "/api/v1/accounts/me",
    async ({ services, principal }) => {
      const account = principal ? await services.accountsService.getById(principal.sub) : null;
      if (!account) {
        return json(
          {
            ok: false,
            error: {
              code: "ACCOUNT_NOT_FOUND",
              message: "No se encontro la cuenta asociada al token.",
            },
          },
          { status: 404 },
        );
      }

      return json({ ok: true, data: account });
    },
    {
      private: true,
      module: "accounts",
      summary: "Devuelve la cuenta autenticada. Ruta privada.",
    },
  );
};
