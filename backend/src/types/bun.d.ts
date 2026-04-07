declare global {
  type BunServerWebSocket<T = unknown> = {
    data: T;
    send(message: string): number;
    close(code?: number, reason?: string): void;
  };

  type BunWebSocketHandler<T = unknown> = {
    open?(ws: BunServerWebSocket<T>): void | Promise<void>;
    message?(ws: BunServerWebSocket<T>, message: string | Buffer): void | Promise<void>;
    close?(ws: BunServerWebSocket<T>, code: number, reason: string): void | Promise<void>;
  };

  type BunServeServer<T = unknown> = {
    port: number;
    stop(closeActiveConnections?: boolean): void;
    upgrade(request: Request, options?: { data?: T }): boolean;
  };

  const Bun: {
    serve<T = unknown>(options: {
      port: number;
      hostname?: string;
      fetch(
        request: Request,
        server: BunServeServer<T>,
      ): Response | undefined | Promise<Response | undefined>;
      error?(error: Error): Response;
      websocket?: BunWebSocketHandler<T>;
    }): BunServeServer<T>;
  };
}

export {};
