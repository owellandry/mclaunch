export type BackendApiError = {
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

export const getBackendApiBaseUrl = (): string => {
  const runtimeValue = window.api?.getApiBaseUrl?.();
  if (runtimeValue?.trim()) return trimTrailingSlashes(runtimeValue.trim());

  const viteValue =
    typeof import.meta !== "undefined" && typeof import.meta.env?.VITE_MCLAUNCH_API_BASE_URL === "string"
      ? import.meta.env.VITE_MCLAUNCH_API_BASE_URL
      : "";

  if (viteValue.trim()) return trimTrailingSlashes(viteValue.trim());
  return DEFAULT_API_BASE_URL;
};

const parseEnvelope = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as BackendEnvelope<T>;

  if (!response.ok || !payload.ok || !payload.data) {
    const message = payload.error?.message || `La API respondio con estado ${response.status}.`;
    throw new Error(message);
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

  const response = await fetch(`${getBackendApiBaseUrl()}${path}`, {
    method: options?.method || "GET",
    headers,
    body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  });

  return parseEnvelope<T>(response);
};
