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
      h1 { margin: 0 0 12px; font-size: 1.6rem; }
      p { margin: 0; line-height: 1.6; color: #d0dbeb; }
    </style>
    <script>
      window.addEventListener("load", () => {
        try {
          window.opener?.postMessage({ source: "mclaunch-discord-auth", status: "completed" }, "*");
        } catch {}
        window.setTimeout(() => { window.close(); }, 900);
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

export const registerDiscordRoutes = (router: Router): void => {
  router.add(
    "GET",
    "/api/v1/discord/status",
    async ({ services }) =>
      json({
        ok: true,
        data: {
          configured: services.discordService.isConfigured(),
          botConfigured: Boolean(services.env.discordBotToken),
          clientId: services.env.discordClientId || null,
          redirectUri: services.env.discordRedirectUri,
          scopes: services.env.discordScopes.split(/\s+/).filter(Boolean),
        },
      }),
    {
      module: "discord",
      summary: "Indica si Discord OAuth y el bot estan configurados.",
    },
  );

  router.add(
    "POST",
    "/api/v1/discord/oauth/start",
    async ({ services, principal }) => {
      if (!principal) {
        return json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "Se requiere sesion del launcher." } },
          { status: 401 },
        );
      }

      try {
        const session = await services.discordService.startOAuth(principal.sub);
        return json({
          ok: true,
          data: {
            flow: "discord_oauth",
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
              code: "DISCORD_NOT_CONFIGURED",
              message: error instanceof Error ? error.message : "Discord no configurado.",
            },
          },
          { status: 503 },
        );
      }
    },
    {
      private: true,
      module: "discord",
      summary: "Inicia OAuth de Discord y vincula la cuenta al JWT del launcher.",
    },
  );

  router.add(
    "GET",
    "/api/v1/discord/oauth/status/:sessionId",
    async ({ params, services, principal }) => {
      if (!principal) {
        return json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "Se requiere sesion del launcher." } },
          { status: 401 },
        );
      }

      const session = await services.discordService.getOAuthStatus(params.sessionId);
      if (!session) {
        return json(
          {
            ok: false,
            error: { code: "DISCORD_SESSION_NOT_FOUND", message: "Sesion OAuth de Discord no encontrada." },
          },
          { status: 404 },
        );
      }

      // Do not leak another account's OAuth session
      if (session.accountId !== principal.sub) {
        return json(
          { ok: false, error: { code: "FORBIDDEN", message: "La sesion no pertenece a esta cuenta." } },
          { status: 403 },
        );
      }

      return json({
        ok: true,
        data: {
          id: session.id,
          status: session.status,
          expiresAt: new Date(session.expiresAt).toISOString(),
          error: session.error ?? null,
          link: session.result?.link ?? null,
        },
      });
    },
    {
      private: true,
      module: "discord",
      summary: "Consulta el estado de una sesion OAuth de Discord.",
    },
  );

  router.add(
    "GET",
    "/api/v1/discord/oauth/callback",
    async ({ query, services }) => {
      const state = query.get("state")?.trim();
      const code = query.get("code");
      const oauthError = query.get("error");
      const oauthDescription = query.get("error_description");

      services.logsService.info("discord-route", "Callback OAuth Discord (GET) recibido.", {
        hasState: Boolean(state),
        hasCode: Boolean(code),
        oauthError: oauthError ?? null,
      });

      if (!state) {
        return html(callbackPage("Sesion invalida", "Falta el parametro state de Discord OAuth."));
      }

      if (oauthError) {
        await services.discordService.failOAuth(state, oauthDescription || oauthError);
        return html(
          callbackPage(
            "Discord cancelado",
            "La autorizacion de Discord fue cancelada o rechazada. Puedes volver al launcher.",
          ),
        );
      }

      if (!code) {
        await services.discordService.failOAuth(state, "No se recibio code de Discord.");
        return html(callbackPage("Codigo invalido", "Discord no envio un codigo OAuth valido."));
      }

      const session = await services.discordService.completeOAuth(state, code);
      if (session.status === "completed") {
        return html(
          callbackPage(
            "Discord vinculado",
            "Tu cuenta de Discord quedo conectada al launcher. Ya puedes cerrar esta ventana.",
          ),
        );
      }

      return html(
        callbackPage(
          "No se pudo vincular Discord",
          session.error || "Ocurrio un error al completar la autorizacion de Discord.",
        ),
      );
    },
    {
      module: "discord",
      summary: "Callback OAuth de Discord (browser redirect). Vincula la cuenta y cierra el popup.",
    },
  );

  /**
   * Explicit completion used by the Electron main process.
   * More reliable than depending on the popup finishing the GET redirect.
   */
  router.add(
    "POST",
    "/api/v1/discord/oauth/complete",
    async ({ jsonBody, services }) => {
      try {
        const body = await jsonBody<{ state?: string; code?: string; error?: string; error_description?: string }>();
        const state = body?.state?.trim();
        const code = body?.code?.trim();

        services.logsService.info("discord-route", "Complete OAuth Discord (POST) recibido.", {
          hasState: Boolean(state),
          hasCode: Boolean(code),
          oauthError: body?.error ?? null,
        });

        if (!state) {
          return json(
            { ok: false, error: { code: "INVALID_PAYLOAD", message: "state es obligatorio." } },
            { status: 400 },
          );
        }

        if (body?.error) {
          await services.discordService.failOAuth(state, body.error_description || body.error);
          return json({
            ok: true,
            data: { status: "error", error: body.error_description || body.error, link: null },
          });
        }

        if (!code) {
          return json(
            { ok: false, error: { code: "INVALID_PAYLOAD", message: "code es obligatorio." } },
            { status: 400 },
          );
        }

        const session = await services.discordService.completeOAuth(state, code);
        return json({
          ok: true,
          data: {
            id: session.id,
            status: session.status,
            error: session.error ?? null,
            link: session.result?.link ?? null,
          },
        });
      } catch (error) {
        return json(
          {
            ok: false,
            error: {
              code: "DISCORD_COMPLETE_FAILED",
              message: error instanceof Error ? error.message : "No se pudo completar Discord OAuth.",
            },
          },
          { status: 500 },
        );
      }
    },
    {
      module: "discord",
      summary: "Completa OAuth Discord con code+state (usado por Electron main). Publico.",
    },
  );

  router.add(
    "GET",
    "/api/v1/discord/me",
    async ({ services, principal }) => {
      if (!principal) {
        return json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "Se requiere sesion del launcher." } },
          { status: 401 },
        );
      }

      const link = await services.discordService.getLinkByAccountId(principal.sub);
      if (!link) {
        return json(
          {
            ok: false,
            error: {
              code: "DISCORD_NOT_LINKED",
              message: "Esta cuenta del launcher no tiene Discord vinculado.",
            },
          },
          { status: 404 },
        );
      }

      return json({ ok: true, data: link });
    },
    {
      private: true,
      module: "discord",
      summary: "Devuelve el vinculo Discord de la cuenta autenticada.",
    },
  );

  router.add(
    "GET",
    "/api/v1/discord/friends",
    async ({ services, principal, query }) => {
      if (!principal) {
        return json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "Se requiere sesion del launcher." } },
          { status: 401 },
        );
      }

      try {
        const onlineOnly = query.get("online") !== "0" && query.get("online") !== "false";
        const payload = onlineOnly
          ? await services.discordService.listOnlineFriends(principal.sub)
          : await services.discordService.listAllFriends(principal.sub);

        return json({
          ok: true,
          data: {
            link: payload.link,
            friends: payload.friends,
            onlineCount: payload.friends.filter((f) => f.isOnline).length,
            source: payload.source,
            note: payload.note,
          },
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "No se pudieron listar amigos de Discord.";
        const code = message.includes("no tiene Discord") ? "DISCORD_NOT_LINKED" : "DISCORD_FRIENDS_FAILED";
        return json(
          { ok: false, error: { code, message } },
          { status: code === "DISCORD_NOT_LINKED" ? 404 : 500 },
        );
      }
    },
    {
      private: true,
      module: "discord",
      summary: "Lista amigos/red Discord. Por defecto solo online (?online=0 para todos).",
    },
  );

  router.add(
    "DELETE",
    "/api/v1/discord/link",
    async ({ services, principal }) => {
      if (!principal) {
        return json(
          { ok: false, error: { code: "UNAUTHORIZED", message: "Se requiere sesion del launcher." } },
          { status: 401 },
        );
      }

      const removed = await services.discordService.unlink(principal.sub);
      return json({ ok: true, data: { unlinked: removed } });
    },
    {
      private: true,
      module: "discord",
      summary: "Desvincula Discord de la cuenta autenticada.",
    },
  );
};
