export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogEntry = {
  id: number;
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  details?: unknown;
};

type LogFilters = {
  limit?: number;
  level?: LogLevel;
  module?: string;
  text?: string;
  sessionId?: string;
};

const MAX_LOG_ENTRIES = 500;
const MAX_SERIALIZE_DEPTH = 4;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === "[object Object]";
};

const normalizeLogValue = (value: unknown, depth = 0): unknown => {
  if (value === null || value === undefined) return value ?? null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }

  if (depth >= MAX_SERIALIZE_DEPTH) {
    if (Array.isArray(value)) return `[array(${value.length})]`;
    if (isPlainObject(value)) return "[object]";
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => normalizeLogValue(item, depth + 1));
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, normalizeLogValue(entryValue, depth + 1)]),
    );
  }

  return String(value);
};

const hasSessionId = (details: unknown, sessionId: string): boolean => {
  if (!details || typeof details !== "object") return false;
  const candidate = details as Record<string, unknown>;

  if (candidate.sessionId === sessionId) return true;

  return Object.values(candidate).some((value) => {
    if (typeof value === "object" && value !== null) return hasSessionId(value, sessionId);
    return false;
  });
};

export class LogsService {
  private readonly entries: LogEntry[] = [];
  private nextId = 1;

  write(level: LogLevel, module: string, message: string, details?: unknown): LogEntry {
    const entry: LogEntry = {
      id: this.nextId,
      timestamp: new Date().toISOString(),
      level,
      module,
      message,
      details: details === undefined ? undefined : normalizeLogValue(details),
    };

    this.nextId += 1;
    this.entries.push(entry);

    if (this.entries.length > MAX_LOG_ENTRIES) {
      this.entries.splice(0, this.entries.length - MAX_LOG_ENTRIES);
    }

    return entry;
  }

  debug(module: string, message: string, details?: unknown): LogEntry {
    return this.write("debug", module, message, details);
  }

  info(module: string, message: string, details?: unknown): LogEntry {
    return this.write("info", module, message, details);
  }

  warn(module: string, message: string, details?: unknown): LogEntry {
    return this.write("warn", module, message, details);
  }

  error(module: string, message: string, details?: unknown): LogEntry {
    return this.write("error", module, message, details);
  }

  list(filters: LogFilters = {}): { total: number; entries: LogEntry[] } {
    const normalizedLimit = Math.min(Math.max(filters.limit ?? 100, 1), 200);
    let results = [...this.entries];

    if (filters.level) {
      results = results.filter((entry) => entry.level === filters.level);
    }

    if (filters.module) {
      results = results.filter((entry) => entry.module === filters.module);
    }

    if (filters.text?.trim()) {
      const text = filters.text.trim().toLowerCase();
      results = results.filter((entry) => {
        const haystack = `${entry.message} ${JSON.stringify(entry.details ?? {})}`.toLowerCase();
        return haystack.includes(text);
      });
    }

    if (filters.sessionId?.trim()) {
      const sessionId = filters.sessionId.trim();
      results = results.filter((entry) => hasSessionId(entry.details, sessionId));
    }

    const total = results.length;
    const entries = results.slice(-normalizedLimit).reverse();

    return { total, entries };
  }
}
