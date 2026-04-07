import { json } from "./response";
import type { BackendEnv } from "../../config/env";
import type { TokenService, AuthPrincipal } from "../security/token-service";
import type { LoginService } from "../../modules/login/login.service";
import type { AccountsService } from "../../modules/accounts/accounts.service";
import type { DownloadsService } from "../../modules/downloads/downloads.service";
import type { HotupdatesService } from "../../modules/hotupdates/hotupdates.service";
import type { BannersService } from "../../modules/banners/banners.service";
import type { LauncherActivityService } from "../../modules/launcher-socket/launcher-activity.service";
import type { LogsService } from "../../modules/logs/logs.service";
import type { PostgresDatabase } from "../../infrastructure/postgres/database";
import type { RedisCache } from "../../infrastructure/redis/cache";

export type RouteServices = {
  env: BackendEnv;
  tokenService: TokenService;
  loginService: LoginService;
  accountsService: AccountsService;
  downloadsService: DownloadsService;
  hotupdatesService: HotupdatesService;
  bannersService: BannersService;
  launcherActivityService: LauncherActivityService;
  logsService: LogsService;
  postgres: PostgresDatabase;
  redis: RedisCache;
  startedAt: number;
};

export type RouteContext = {
  request: Request;
  url: URL;
  params: Record<string, string>;
  query: URLSearchParams;
  services: RouteServices;
  principal: AuthPrincipal | null;
  jsonBody<T>(): Promise<T>;
};

type RouteDefinition = {
  method: string;
  path: string;
  segments: string[];
  isPrivate: boolean;
  hidden: boolean;
  module: string;
  summary: string;
  handler: (ctx: RouteContext) => Promise<Response> | Response;
};

const splitPath = (value: string): string[] => value.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);

export class Router {
  private readonly routes: RouteDefinition[] = [];

  add(
    method: string,
    path: string,
    handler: RouteDefinition["handler"],
    options: { private?: boolean; hidden?: boolean; module: string; summary: string },
  ): void {
    this.routes.push({
      method: method.toUpperCase(),
      path,
      segments: splitPath(path),
      isPrivate: options.private ?? false,
      hidden: options.hidden ?? false,
      module: options.module,
      summary: options.summary,
      handler,
    });
  }

  describe(): Array<Pick<RouteDefinition, "method" | "path" | "isPrivate" | "module" | "summary">> {
    return this.routes
      .filter((route) => !route.hidden)
      .map(({ method, path, isPrivate, module, summary }) => ({
      method,
      path,
      isPrivate,
      module,
      summary,
      }));
  }

  async handle(request: Request, services: RouteServices): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();
    const pathnameSegments = splitPath(url.pathname);

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const params = this.matchSegments(route.segments, pathnameSegments);
      if (!params) continue;

      const principal = route.isPrivate ? this.authenticate(request, services) : null;
      if (route.isPrivate && !principal) {
        return json(
          {
            ok: false,
            error: {
              code: "UNAUTHORIZED",
              message: "Se requiere un token Bearer valido para acceder a esta ruta.",
            },
          },
          { status: 401 },
        );
      }

      const context: RouteContext = {
        request,
        url,
        params,
        query: url.searchParams,
        services,
        principal,
        jsonBody: async <T>() => (await request.json()) as T,
      };

      return route.handler(context);
    }

    return json(
      {
        ok: false,
        error: {
          code: "NOT_FOUND",
          message: `No existe una ruta para ${method} ${url.pathname}`,
        },
      },
      { status: 404 },
    );
  }

  private authenticate(request: Request, services: RouteServices): AuthPrincipal | null {
    const header = request.headers.get("authorization");
    if (!header?.startsWith("Bearer ")) return null;
    return services.tokenService.verify(header.slice("Bearer ".length).trim());
  }

  private matchSegments(template: string[], actual: string[]): Record<string, string> | null {
    if (template.length !== actual.length) return null;
    const params: Record<string, string> = {};

    for (let i = 0; i < template.length; i += 1) {
      const expected = template[i];
      const received = actual[i];
      if (expected.startsWith(":")) {
        params[expected.slice(1)] = decodeURIComponent(received);
        continue;
      }
      if (expected !== received) return null;
    }

    return params;
  }
}
