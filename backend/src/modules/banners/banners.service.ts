import crypto from "node:crypto";
import type { PostgresDatabase } from "../../infrastructure/postgres/database";
import type { RedisCache } from "../../infrastructure/redis/cache";

export type Banner = {
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

type BannerRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  mobile_image_url: string | null;
  target_url: string | null;
  placement: string;
  variant: string;
  is_active: boolean;
  sort_order: number;
  starts_at: Date | null;
  ends_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
};

type CreateBannerInput = {
  slug: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  targetUrl?: string | null;
  placement: string;
  variant?: string;
  isActive?: boolean;
  sortOrder?: number;
  startsAt?: string | null;
  endsAt?: string | null;
  metadata?: Record<string, unknown>;
};

type UpdateBannerInput = Partial<CreateBannerInput>;

const CACHE_KEY = "mclaunch:banners:list";
const CACHE_TTL_SECONDS = 30;

const mapBanner = (row: BannerRow): Banner => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  subtitle: row.subtitle,
  imageUrl: row.image_url,
  mobileImageUrl: row.mobile_image_url,
  targetUrl: row.target_url,
  placement: row.placement,
  variant: row.variant,
  isActive: row.is_active,
  sortOrder: row.sort_order,
  startsAt: row.starts_at ? row.starts_at.toISOString() : null,
  endsAt: row.ends_at ? row.ends_at.toISOString() : null,
  metadata: row.metadata ?? {},
  createdAt: row.created_at.toISOString(),
  updatedAt: row.updated_at.toISOString(),
});

const sanitizeOptionalString = (value: string | null | undefined): string | null => {
  const normalized = value?.trim();
  return normalized ? normalized : null;
};

export class BannersService {
  constructor(
    private readonly database: PostgresDatabase,
    private readonly cache: RedisCache,
  ) {}

  async listPublic(filters: { placement?: string }): Promise<Banner[]> {
    const cacheKey = `${CACHE_KEY}:public:${filters.placement ?? "all"}`;
    const cached = await this.cache.getJson<Banner[]>(cacheKey);
    if (cached) return cached;

    const values: unknown[] = [];
    let where = `
      where is_active = true
        and (starts_at is null or starts_at <= now())
        and (ends_at is null or ends_at >= now())
    `;

    if (filters.placement) {
      values.push(filters.placement);
      where += ` and placement = $${values.length}`;
    }

    const result = await this.database.query<BannerRow>(
      `
        select
          id,
          slug,
          title,
          subtitle,
          image_url,
          mobile_image_url,
          target_url,
          placement,
          variant,
          is_active,
          sort_order,
          starts_at,
          ends_at,
          metadata,
          created_at,
          updated_at
        from banners
        ${where}
        order by sort_order asc, created_at desc
      `,
      values,
    );

    const banners = result.rows.map(mapBanner);
    await this.cache.setJson(cacheKey, banners, CACHE_TTL_SECONDS);
    return banners;
  }

  async listAll(filters: { placement?: string; includeInactive?: boolean }): Promise<Banner[]> {
    const values: unknown[] = [];
    let where = "where 1=1";

    if (filters.placement) {
      values.push(filters.placement);
      where += ` and placement = $${values.length}`;
    }
    if (!filters.includeInactive) {
      where += " and is_active = true";
    }

    const result = await this.database.query<BannerRow>(
      `
        select
          id,
          slug,
          title,
          subtitle,
          image_url,
          mobile_image_url,
          target_url,
          placement,
          variant,
          is_active,
          sort_order,
          starts_at,
          ends_at,
          metadata,
          created_at,
          updated_at
        from banners
        ${where}
        order by sort_order asc, created_at desc
      `,
      values,
    );

    return result.rows.map(mapBanner);
  }

  async getById(id: string): Promise<Banner | null> {
    const result = await this.database.query<BannerRow>(
      `
        select
          id,
          slug,
          title,
          subtitle,
          image_url,
          mobile_image_url,
          target_url,
          placement,
          variant,
          is_active,
          sort_order,
          starts_at,
          ends_at,
          metadata,
          created_at,
          updated_at
        from banners
        where id = $1
        limit 1
      `,
      [id],
    );

    return result.rows[0] ? mapBanner(result.rows[0]) : null;
  }

  async create(input: CreateBannerInput): Promise<Banner> {
    const result = await this.database.query<BannerRow>(
      `
        insert into banners (
          id,
          slug,
          title,
          subtitle,
          image_url,
          mobile_image_url,
          target_url,
          placement,
          variant,
          is_active,
          sort_order,
          starts_at,
          ends_at,
          metadata
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
        returning
          id,
          slug,
          title,
          subtitle,
          image_url,
          mobile_image_url,
          target_url,
          placement,
          variant,
          is_active,
          sort_order,
          starts_at,
          ends_at,
          metadata,
          created_at,
          updated_at
      `,
      [
        crypto.randomUUID(),
        input.slug.trim(),
        input.title.trim(),
        sanitizeOptionalString(input.subtitle),
        input.imageUrl.trim(),
        sanitizeOptionalString(input.mobileImageUrl),
        sanitizeOptionalString(input.targetUrl),
        input.placement.trim(),
        input.variant?.trim() || "default",
        input.isActive ?? true,
        input.sortOrder ?? 0,
        input.startsAt ?? null,
        input.endsAt ?? null,
        JSON.stringify(input.metadata ?? {}),
      ],
    );

    await this.clearPublicCache();
    return mapBanner(result.rows[0]);
  }

  async update(id: string, input: UpdateBannerInput): Promise<Banner | null> {
    const current = await this.getById(id);
    if (!current) return null;

    const result = await this.database.query<BannerRow>(
      `
        update banners
        set
          slug = $2,
          title = $3,
          subtitle = $4,
          image_url = $5,
          mobile_image_url = $6,
          target_url = $7,
          placement = $8,
          variant = $9,
          is_active = $10,
          sort_order = $11,
          starts_at = $12,
          ends_at = $13,
          metadata = $14::jsonb,
          updated_at = now()
        where id = $1
        returning
          id,
          slug,
          title,
          subtitle,
          image_url,
          mobile_image_url,
          target_url,
          placement,
          variant,
          is_active,
          sort_order,
          starts_at,
          ends_at,
          metadata,
          created_at,
          updated_at
      `,
      [
        id,
        input.slug?.trim() || current.slug,
        input.title?.trim() || current.title,
        input.subtitle !== undefined ? sanitizeOptionalString(input.subtitle) : current.subtitle,
        input.imageUrl?.trim() || current.imageUrl,
        input.mobileImageUrl !== undefined ? sanitizeOptionalString(input.mobileImageUrl) : current.mobileImageUrl,
        input.targetUrl !== undefined ? sanitizeOptionalString(input.targetUrl) : current.targetUrl,
        input.placement?.trim() || current.placement,
        input.variant?.trim() || current.variant,
        input.isActive ?? current.isActive,
        input.sortOrder ?? current.sortOrder,
        input.startsAt !== undefined ? input.startsAt : current.startsAt,
        input.endsAt !== undefined ? input.endsAt : current.endsAt,
        JSON.stringify(input.metadata ?? current.metadata ?? {}),
      ],
    );

    await this.clearPublicCache();
    return mapBanner(result.rows[0]);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.database.query("delete from banners where id = $1", [id]);
    await this.clearPublicCache();
    return (result.rowCount ?? 0) > 0;
  }

  async reindex(): Promise<{ updatedAt: string }> {
    await this.clearPublicCache();
    return { updatedAt: new Date().toISOString() };
  }

  private async clearPublicCache(): Promise<void> {
    const keys = await this.cache.client.keys(`${CACHE_KEY}:public:*`);
    if (keys.length > 0) {
      await this.cache.client.del(keys);
    }
  }
}
