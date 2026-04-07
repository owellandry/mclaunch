import { createClient, type RedisClientType } from "redis";

export class RedisCache {
  readonly client: RedisClientType;

  constructor(url: string) {
    this.client = createClient({ url });
  }

  async connect(): Promise<void> {
    this.client.on("error", (error) => {
      console.error("[redis] error", error);
    });
    await this.client.connect();
    await this.client.ping();
  }

  async close(): Promise<void> {
    if (this.client.isOpen) {
      await this.client.quit();
    }
  }

  async ping(): Promise<string> {
    return this.client.ping();
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.client.set(key, raw, { EX: ttlSeconds });
      return;
    }
    await this.client.set(key, raw);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }
}
