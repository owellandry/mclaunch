import crypto from "node:crypto";
import type { PostgresDatabase } from "../../infrastructure/postgres/database";

export type StoredAccount = {
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

type AccountRow = {
  id: string;
  provider: "local" | "microsoft";
  display_name: string;
  email: string | null;
  uuid: string | null;
  skin_url: string | null;
  provider_account_id: string | null;
  created_at: Date;
  updated_at: Date;
  metadata: Record<string, unknown>;
};

const mapAccount = (row: AccountRow): StoredAccount => ({
  id: row.id,
  provider: row.provider,
  displayName: row.display_name,
  email: row.email,
  uuid: row.uuid,
  skinUrl: row.skin_url,
  providerAccountId: row.provider_account_id,
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
  metadata: row.metadata ?? {},
});

export class AccountsService {
  constructor(private readonly database: PostgresDatabase) {}

  async list(): Promise<StoredAccount[]> {
    const result = await this.database.query<AccountRow>(
      `
        select
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          created_at,
          updated_at,
          metadata
        from accounts
        order by updated_at desc
      `,
    );

    return result.rows.map(mapAccount);
  }

  async getById(id: string): Promise<StoredAccount | null> {
    const result = await this.database.query<AccountRow>(
      `
        select
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          created_at,
          updated_at,
          metadata
        from accounts
        where id = $1
        limit 1
      `,
      [id],
    );

    return result.rows[0] ? mapAccount(result.rows[0]) : null;
  }

  async createLocalAccount(input: { displayName: string; email?: string | null }): Promise<StoredAccount> {
    const id = crypto.randomUUID();
    const result = await this.database.query<AccountRow>(
      `
        insert into accounts (
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          metadata
        )
        values ($1, 'local', $2, $3, null, null, null, '{}'::jsonb)
        returning
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          created_at,
          updated_at,
          metadata
      `,
      [id, input.displayName.trim(), input.email?.trim() || null],
    );

    return mapAccount(result.rows[0]);
  }

  async upsertMicrosoftAccount(input: {
    uuid: string;
    displayName: string;
    skinUrl: string | null;
    profile: Record<string, unknown>;
  }): Promise<StoredAccount> {
    const existing = await this.database.query<AccountRow>(
      `
        select
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          created_at,
          updated_at,
          metadata
        from accounts
        where provider = 'microsoft' and provider_account_id = $1
        limit 1
      `,
      [input.uuid],
    );

    if (existing.rows[0]) {
      const updated = await this.database.query<AccountRow>(
        `
          update accounts
          set
            display_name = $2,
            uuid = $3,
            skin_url = $4,
            metadata = $5::jsonb,
            updated_at = now()
          where id = $1
          returning
            id,
            provider,
            display_name,
            email,
            uuid,
            skin_url,
            provider_account_id,
            created_at,
            updated_at,
            metadata
        `,
        [
          existing.rows[0].id,
          input.displayName,
          input.uuid,
          input.skinUrl,
          JSON.stringify({ profile: input.profile }),
        ],
      );

      return mapAccount(updated.rows[0]);
    }

    const inserted = await this.database.query<AccountRow>(
      `
        insert into accounts (
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          metadata
        )
        values ($1, 'microsoft', $2, null, $3, $4, $5, $6::jsonb)
        returning
          id,
          provider,
          display_name,
          email,
          uuid,
          skin_url,
          provider_account_id,
          created_at,
          updated_at,
          metadata
      `,
      [
        crypto.randomUUID(),
        input.displayName,
        input.uuid,
        input.skinUrl,
        input.uuid,
        JSON.stringify({ profile: input.profile }),
      ],
    );

    return mapAccount(inserted.rows[0]);
  }
}
