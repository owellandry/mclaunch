import { ApiError, ApiErrorCode } from "@/core/errors/ApiError";

type BackendApiError = {
  code: string;
  message: string;
};

type BackendEnvelope<T> = {
  ok: boolean;
  data?: T;
  error?: BackendApiError;
};

export type BackendAccount = {
  id: string;
  provider: "local" | "microsoft";
  displayName: string;
  email: string | null;
  uuid: string | null;
  skinUrl: string | null;
  providerAccountId: string | null;
  createdAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
};

export type BackendLoginStart = {
  flow: string;
  sessionId: string;
  authorizeUrl: string;
  callbackUrl: string;
  expiresAt: string;
};

export type BackendLoginStatus = {
  id: string;
  prompt: string;
  redirectUri: string;
  authorizeUrl: string;
  status: "pending" | "completed" | "error" | "expired";
  createdAt: number;
  expiresAt: number;
  result?: {
    accessToken: string;
    account: BackendAccount;
    launcher: {
      msmcToken: string;
      mclcAuth: unknown;
      profile: unknown;
    };
  };
  error?: string;
};

export type BackendBanner = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  targetUrl: string | null;
  placement: string;
  variant: string;
  isActive: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_API_BASE_URL = "https://my3u2eiq2b78xmirlj4l.servgrid.xyz";

const trimTrailingSlashes = (value: string): string => value.replace(/\/+$/, "");

/**
 * Resolve the backend HTTP base URL.
 *
 * Priority:
 * 1. Electron preload (`window.api.getApiBaseUrl`) — real runtime URL
 * 2. Non-empty `VITE_MCLAUNCH_API_BASE_URL`
 * 3. Hardcoded default (production API)
 *
 * Never fall back to "" / same-origin Vite, or API calls become HTML 200s
 * from the dev server and explode with ApiError 3003.
 */
export const getBackendApiBaseUrl = (): string => {
  try {
    const runtimeValue = window.api?.getApiBaseUrl?.();
    if (typeof runtimeValue === "string" && runtimeValue.trim()) {
      return trimTrailingSlashes(runtimeValue.trim());
    }
  } catch {
    // window.api may be unavailable outside Electron
  }

  const viteValue =
    typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_MCLAUNCH_API_BASE_URL === "string"
      ? import.meta.env.VITE_MCLAUNCH_API_BASE_URL
      : undefined;

  if (typeof viteValue === "string" && viteValue.trim()) {
    return trimTrailingSlashes(viteValue.trim());
  }

  return DEFAULT_API_BASE_URL;
};

const codeForStatus = (status: number): ApiErrorCode => {
  if (status >= 500) return ApiErrorCode.REMOTE_SERVER_ERROR;
  if (status === 401) return ApiErrorCode.AUTH_ERROR;
  if (status >= 400) return ApiErrorCode.REQUEST_REJECTED;
  return ApiErrorCode.REMOTE_SERVER_ERROR;
};

const parseEnvelope = async <T>(response: Response): Promise<T> => {
  const contentType = response.headers.get("content-type") || "";

  let payload: BackendEnvelope<T>;
  try {
    if (!contentType.includes("application/json")) {
      throw new Error("Not JSON");
    }
    payload = (await response.json()) as BackendEnvelope<T>;
  } catch {
    const text = await response.text().catch(() => "");
    const snippet = text.slice(0, 120).replace(/\s+/g, " ").trim();
    const code =
      response.status >= 500
        ? ApiErrorCode.REMOTE_SERVER_ERROR
        : ApiErrorCode.UNEXPECTED_RESPONSE;
    throw new ApiError(
      code,
      `La API respondió ${response.status} (${response.statusText}) con contenido inesperado: "${snippet}"`,
      response.status,
    );
  }

  if (!response.ok || !payload.ok || !payload.data) {
    const message = payload.error?.message || `La API respondió con estado ${response.status}.`;
    throw new ApiError(codeForStatus(response.status), message, response.status);
  }

  return payload.data;
};

export const backendRequest = async <T>(
  path: string,
  options?: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    token?: string | null;
    body?: unknown;
    signal?: AbortSignal;
  },
): Promise<T> => {
  const headers = new Headers();
  if (options?.body !== undefined) {
    headers.set("Content-Type", "application/json");
  }
  if (options?.token?.trim()) {
    headers.set("Authorization", `Bearer ${options.token.trim()}`);
  }

  let response: Response;
  try {
    response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
      method: options?.method || "GET",
      headers,
      body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    });
  } catch (err) {
    // TypeError de fetch → error de red (DNS, timeout, conexión rechazada, etc.)
    throw new ApiError(
      ApiErrorCode.NETWORK_ERROR,
      `No se pudo conectar con el servidor: ${err instanceof Error ? err.message : "error desconocido"}`,
    );
  }

  return parseEnvelope<T>(response);
};
