import { Pool, type QueryResult, type QueryResultRow } from "pg";

export class PostgresDatabase {
  readonly pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  async connect(): Promise<void> {
    await this.pool.query("select 1");
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  async query<T extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, values);
  }
}
