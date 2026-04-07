import { html, json } from "../../core/http/response";
import type { Router } from "../../core/http/router";

const callbackPage = (title: string, message: string): string => `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: ui-sans-serif, system-ui, sans-serif; background: #0b1020; color: #f4f7fb; display: grid; place-items: center; min-height: 100vh; margin: 0; }
      .card { width: min(560px, calc(100vw - 32px)); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px; }
      h1 { margin: 0 0 12px; font-size: 1.8rem; }
      p { margin: 0; line-height: 1.6; color: #d0dbeb; }
    </style>
  </head>
  <body>
    <section class="card">
      <h1>${title}</h1>
      <p>${message}</p>
    </section>
  </body>
</html>`;

export const registerLoginRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/login/start",
    async ({ query, services }) => {
      const prompt = query.get("prompt") || "select_account";
      const session = await services.loginService.start(prompt);

      return json({
        ok: true,
        data: {
          flow: "microsoft_oauth_authorization_code",
          sessionId: session.id,
          authorizeUrl: session.authorizeUrl,
          callbackUrl: session.redirectUri,
          expiresAt: new Date(session.expiresAt).toISOString(),
        },
      });
    },
    {
      module: "login",
      summary: "Inicia un flujo de login Microsoft/Minecraft y devuelve la URL de autorizacion.",
    },
  );

  router.add(
    "GET",
    "/api/v1/login/status/:sessionId",
    async ({ params, services }) => {
      const session = await services.loginService.getStatus(params.sessionId);
      if (!session) {
        return json(
          {
            ok: false,
            error: {
              code: "LOGIN_SESSION_NOT_FOUND",
              message: "No se encontro la sesion de login solicitada.",
            },
          },
          { status: 404 },
        );
      }

      return json({ ok: true, data: session });
    },
    {
      module: "login",
      summary: "Consulta el estado de una sesion de login iniciada por el launcher.",
    },
  );

  router.add(
    "GET",
    "/api/v1/login/callback/:sessionId",
    async ({ params, query, services }) => {
      const code = query.get("code");
      const oauthError = query.get("error");
      const oauthDescription = query.get("error_description");

      if (oauthError) {
        await services.loginService.fail(params.sessionId, oauthDescription || oauthError);
        return html(
          callbackPage("Inicio de sesion cancelado", "La autenticacion fue cancelada o rechazada. Puedes volver al launcher."),
        );
      }

      if (!code) {
        await services.loginService.fail(params.sessionId, "No se recibio ningun codigo OAuth.");
        return html(callbackPage("Codigo invalido", "No se recibio un codigo valido para continuar el login."));
      }

      const session = await services.loginService.complete(params.sessionId, code);
      if (session.status === "completed") {
        return html(
          callbackPage(
            "Login completado",
            "Tu cuenta ya fue autenticada. Puedes volver al launcher y continuar con la sesion.",
          ),
        );
      }

      return html(
        callbackPage(
          "No se pudo completar el login",
          session.error || "Ocurrio un error al completar la autenticacion. Revisa el launcher para mas detalles.",
        ),
      );
    },
    {
      module: "login",
      summary: "Recibe el callback OAuth de Microsoft y completa el login del launcher.",
    },
  );

  router.add(
    "POST",
    "/api/v1/login/logout",
    () => json({ ok: true, data: { loggedOut: true } }),
    {
      private: true,
      module: "login",
      summary: "Placeholder de logout privado para futuras sesiones persistentes del backend.",
    },
  );
};
