import { json } from "../../core/http/response";
import type { Router } from "../../core/http/router";

export const registerPublicConfigRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/public-config",
    ({ services }) =>
      json({
        ok: true,
        data: {
          app: {
            name: "MC Launch",
            apiVersion: "v1",
          },
        },
      }),
    {
      module: "public-config",
      summary: "Expone metadata publica minima del backend para clientes del ecosistema.",
    },
  );
};
