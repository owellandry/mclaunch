import type { PostgresDatabase } from "./database";

const statements = [
  `
    create table if not exists accounts (
      id uuid primary key,
      provider text not null,
      display_name text not null,
      email text null,
      uuid text null,
      skin_url text null,
      provider_account_id text null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `,
  `
    create unique index if not exists accounts_provider_account_uidx
    on accounts (provider, provider_account_id)
    where provider_account_id is not null;
  `,
  `
    create index if not exists accounts_updated_at_idx
    on accounts (updated_at desc);
  `,
  `
    create table if not exists banners (
      id uuid primary key,
      slug text not null unique,
      title text not null,
      subtitle text null,
      image_url text not null,
      mobile_image_url text null,
      target_url text null,
      placement text not null,
      variant text not null default 'default',
      is_active boolean not null default true,
      sort_order integer not null default 0,
      starts_at timestamptz null,
      ends_at timestamptz null,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `,
  `
    create index if not exists banners_placement_active_idx
    on banners (placement, is_active, sort_order asc, created_at desc);
  `,
  `
    create table if not exists discord_links (
      id uuid primary key,
      account_id uuid not null references accounts(id) on delete cascade,
      discord_user_id text not null,
      username text not null,
      global_name text null,
      discriminator text null,
      avatar text null,
      access_token text not null,
      refresh_token text null,
      token_expires_at timestamptz null,
      scopes text not null default '',
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `,
  `
    create unique index if not exists discord_links_account_uidx
    on discord_links (account_id);
  `,
  `
    create unique index if not exists discord_links_discord_user_uidx
    on discord_links (discord_user_id);
  `,
  `
    create index if not exists discord_links_updated_at_idx
    on discord_links (updated_at desc);
  `,
];

export const runMigrations = async (database: PostgresDatabase): Promise<void> => {
  for (const statement of statements) {
    await database.query(statement);
  }
};
