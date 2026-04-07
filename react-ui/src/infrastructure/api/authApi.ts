import { backendRequest, type BackendAccount, type BackendLoginStart, type BackendLoginStatus } from "./backendClient";

const LOGIN_POLL_INTERVAL_MS = 2_000;
const LOGIN_POLL_TIMEOUT_MS = 1000 * 60 * 5;

export const authApi = {
  startMicrosoftLogin(prompt = "select_account"): Promise<BackendLoginStart> {
    return backendRequest<BackendLoginStart>(`/api/v1/login/start?prompt=${encodeURIComponent(prompt)}`);
  },

  getLoginStatus(sessionId: string, signal?: AbortSignal): Promise<BackendLoginStatus> {
    return backendRequest<BackendLoginStatus>(`/api/v1/login/status/${encodeURIComponent(sessionId)}`, { signal });
  },

  getCurrentAccount(token: string, signal?: AbortSignal): Promise<BackendAccount> {
    return backendRequest<BackendAccount>("/api/v1/accounts/me", { token, signal });
  },

  logout(token: string, signal?: AbortSignal): Promise<{ loggedOut: boolean }> {
    return backendRequest<{ loggedOut: boolean }>("/api/v1/login/logout", {
      method: "POST",
      token,
      signal,
    });
  },

  async waitForLogin(sessionId: string, signal?: AbortSignal): Promise<BackendLoginStatus> {
    const startedAt = Date.now();
    let lastStatus: BackendLoginStatus["status"] | null = null;

    while (true) {
      if (signal?.aborted) {
        throw new Error("El flujo de login fue cancelado.");
      }

      const status = await this.getLoginStatus(sessionId, signal);
      if (status.status !== lastStatus) {
        console.info("[Auth] Estado de login actualizado", {
          sessionId,
          status: status.status,
          redirectUri: status.redirectUri,
        });
        lastStatus = status.status;
      }
      if (status.status === "completed") return status;
      if (status.status === "error") {
        throw new Error(status.error || "No se pudo completar el inicio de sesion.");
      }
      if (status.status === "expired") {
        throw new Error("La sesion de login expiro. Vuelve a intentarlo.");
      }
      if (Date.now() - startedAt > LOGIN_POLL_TIMEOUT_MS) {
        throw new Error("El inicio de sesion tardo demasiado. Reintenta el flujo.");
      }

      await new Promise((resolve) => window.setTimeout(resolve, LOGIN_POLL_INTERVAL_MS));
    }
  },
};
