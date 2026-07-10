/**
 * @file ApiError.ts
 * @description Errores con código numérico para el backend API.
 *
 * 3001 → Error de red (servidor no alcanzable, DNS, timeout)
 * 3002 → El servidor remoto respondió con error (5xx, Cloudflare 521/522/523)
 * 3003 → Respuesta inesperada (no JSON, HTML de error)
 * 3004 → Error de autenticación (token inválido/expirado)
 * 3005 → La API rechazó la solicitud (400, 404, 422, etc.)
 */

export const ApiErrorCode = {
  NETWORK_ERROR: 3001,
  REMOTE_SERVER_ERROR: 3002,
  UNEXPECTED_RESPONSE: 3003,
  AUTH_ERROR: 3004,
  REQUEST_REJECTED: 3005,
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly statusCode?: number;

  constructor(code: ApiErrorCode, message: string, statusCode?: number) {
    super(`[${code}] ${message}`);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }

  get shortLabel(): string {
    return `Error ${this.code}`;
  }
}
