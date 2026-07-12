import path from "node:path";

export type BackendEnv = {
  port: number;
  host: string;
  publicBaseUrl: string;
  jwtSecret: string;
  discordClientId: string;
  discordClientSecret: string;
  discordBotToken: string;
  discordRedirectUri: string;
  /** Space-separated OAuth scopes. Default: identify. Add relationships.read if Discord approved it. */
  discordScopes: string;
  /** Optional home guild id used for mutual presence when relationships API is unavailable. */
  discordGuildId: string;
  microsoftClientId: string;
  microsoftClientSecret: string;
  microsoftRedirectUri: string;
  postgresUrl: string;
  redisUrl: string;
  downloadsDir: string;
  installerDownloadsDir: string;
  hotupdatePackagesDir: string;
};

const resolveNumber = (value: string | undefined, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const loadEnv = (): BackendEnv => {
  const cwd = process.cwd();
  const port = resolveNumber(process.env.MCLAUNCH_API_PORT, 8787);
  const host = process.env.MCLAUNCH_API_HOST?.trim() || "127.0.0.1";
  const publicBaseUrl = process.env.MCLAUNCH_API_BASE_URL?.trim() || `http://${host}:${port}`;
  const microsoftRedirectUri =
    process.env.MCLAUNCH_MICROSOFT_REDIRECT_URI?.trim() || `${publicBaseUrl.replace(/\/+$/, "")}/api/v1/login/callback`;
  const base = publicBaseUrl.replace(/\/+$/, "");
  const discordRedirectUri =
    process.env.MCLAUNCH_DISCORD_REDIRECT_URI?.trim() || `${base}/api/v1/discord/oauth/callback`;

  return {
    port,
    host,
    publicBaseUrl,
    jwtSecret: process.env.MCLAUNCH_API_JWT_SECRET?.trim() || "mclaunch-dev-secret-change-me",
    discordClientId: process.env.MCLAUNCH_DISCORD_CLIENT_ID?.trim() || "",
    discordClientSecret: process.env.MCLAUNCH_DISCORD_CLIENT_SECRET?.trim() || "",
    discordBotToken: process.env.MCLAUNCH_DISCORD_BOT_TOKEN?.trim() || "",
    discordRedirectUri,
    discordScopes: process.env.MCLAUNCH_DISCORD_SCOPES?.trim() || "identify",
    discordGuildId: process.env.MCLAUNCH_DISCORD_GUILD_ID?.trim() || "",
    microsoftClientId: process.env.MCLAUNCH_MICROSOFT_CLIENT_ID?.trim() || "",
    microsoftClientSecret: process.env.MCLAUNCH_MICROSOFT_CLIENT_SECRET?.trim() || "",
    microsoftRedirectUri,
    postgresUrl:
      process.env.MCLAUNCH_POSTGRES_URL?.trim() ||
      "postgres://postgres:postgres@127.0.0.1:5432/mclaunch",
    redisUrl: process.env.MCLAUNCH_REDIS_URL?.trim() || "redis://127.0.0.1:6379",
    downloadsDir: process.env.MCLAUNCH_DOWNLOADS_DIR?.trim() || path.join(cwd, "dist"),
    installerDownloadsDir:
      process.env.MCLAUNCH_INSTALLER_DOWNLOADS_DIR?.trim() || path.join(cwd, "react-installer", "dist-installer"),
    hotupdatePackagesDir:
      process.env.MCLAUNCH_HOTUPDATE_PACKAGES_DIR?.trim() || path.join(cwd, "build", "hotupdates"),
  };
};
