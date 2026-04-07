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
    <script>
      window.addEventListener("load", () => {
        try {
          window.opener?.postMessage({ source: "mclaunch-auth", status: "completed" }, "*");
        } catch {}
        window.setTimeout(() => {
          window.close();
        }, 900);
      });
    </script>
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
      try {
        const prompt = query.get("prompt") || "select_account";
        services.logsService.info("login-route", "Solicitud de inicio de login recibida.", { prompt });
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
      } catch (error) {
        return json(
          {
            ok: false,
            error: {
              code: "LOGIN_NOT_CONFIGURED",
              message: error instanceof Error ? error.message : "El login Microsoft no esta configurado.",
            },
          },
          { status: 503 },
        );
      }
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
        services.logsService.warn("login-route", "Sesion de login consultada no encontrada.", {
          sessionId: params.sessionId,
        });
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
    "/api/v1/login/callback",
    async ({ query, services }) => {
      const state = query.get("state")?.trim();
      const sessionId = state || query.get("sessionId")?.trim();
      const code = query.get("code");
      const oauthError = query.get("error");
      const oauthDescription = query.get("error_description");
      services.logsService.info("login-route", "Callback OAuth recibido.", {
        sessionId: sessionId ?? null,
        hasCode: Boolean(code),
        oauthError: oauthError ?? null,
        hasState: Boolean(state),
      });

      if (!sessionId) {
        services.logsService.warn("login-route", "Callback OAuth sin sessionId/state.", {
          query: Object.fromEntries(query.entries()),
        });
        return html(
          callbackPage(
            "Sesion invalida",
            "No se recibio el parametro state esperado para vincular el login con una sesion activa.",
          ),
        );
      }

      if (oauthError) {
        await services.loginService.fail(sessionId, oauthDescription || oauthError);
        services.logsService.warn("login-route", "Microsoft devolvio un error OAuth.", {
          sessionId,
          oauthError,
          oauthDescription: oauthDescription ?? null,
        });
        return html(
          callbackPage("Inicio de sesion cancelado", "La autenticacion fue cancelada o rechazada. Puedes volver al launcher."),
        );
      }

      if (!code) {
        await services.loginService.fail(sessionId, "No se recibio ningun codigo OAuth.");
        services.logsService.warn("login-route", "Callback OAuth recibido sin code.", { sessionId });
        return html(callbackPage("Codigo invalido", "No se recibio un codigo valido para continuar el login."));
      }

      const session = await services.loginService.complete(sessionId, code);
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
    "GET",
    "/api/v1/login/callback/:sessionId",
    async ({ params, query, services }) => {
      const code = query.get("code");
      const oauthError = query.get("error");
      const oauthDescription = query.get("error_description");
      services.logsService.info("login-route", "Callback OAuth legacy recibido.", {
        sessionId: params.sessionId,
        hasCode: Boolean(code),
        oauthError: oauthError ?? null,
      });

      if (oauthError) {
        await services.loginService.fail(params.sessionId, oauthDescription || oauthError);
        services.logsService.warn("login-route", "Microsoft devolvio un error OAuth en callback legacy.", {
          sessionId: params.sessionId,
          oauthError,
          oauthDescription: oauthDescription ?? null,
        });
        return html(
          callbackPage("Inicio de sesion cancelado", "La autenticacion fue cancelada o rechazada. Puedes volver al launcher."),
        );
      }

      if (!code) {
        await services.loginService.fail(params.sessionId, "No se recibio ningun codigo OAuth.");
        services.logsService.warn("login-route", "Callback OAuth legacy sin code.", {
          sessionId: params.sessionId,
        });
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
      summary: "Compatibilidad temporal para callbacks antiguos con sessionId en la ruta.",
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
