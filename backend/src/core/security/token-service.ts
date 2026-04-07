import crypto from "node:crypto";

export type AuthPrincipal = {
  sub: string;
  username: string;
  scopes: string[];
  provider: string;
  exp: number;
};

type TokenPayload = Omit<AuthPrincipal, "exp"> & {
  iat: number;
  exp: number;
};

const encodeJson = (value: unknown): string =>
  Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const decodeJson = <T>(value: string): T =>
  JSON.parse(Buffer.from(value, "base64").toString("utf8")) as T;

export class TokenService {
  constructor(private readonly secret: string) {}

  issue(payload: { sub: string; username: string; scopes: string[]; provider: string }, expiresInSeconds = 60 * 60 * 8): string {
    const now = Math.floor(Date.now() / 1000);
    const body: TokenPayload = {
      ...payload,
      iat: now,
      exp: now + expiresInSeconds,
    };

    const header = encodeJson({ alg: "HS256", typ: "JWT" });
    const content = encodeJson(body);
    const signature = this.sign(`${header}.${content}`);
    return `${header}.${content}.${signature}`;
  }

  verify(token: string): AuthPrincipal | null {
    const [header, content, signature] = token.split(".");
    if (!header || !content || !signature) return null;
    if (this.sign(`${header}.${content}`) !== signature) return null;

    try {
      const payload = decodeJson<TokenPayload>(content);
      if (payload.exp <= Math.floor(Date.now() / 1000)) return null;

      return {
        sub: payload.sub,
        username: payload.username,
        scopes: payload.scopes,
        provider: payload.provider,
        exp: payload.exp,
      };
    } catch {
      return null;
    }
  }

  private sign(value: string): string {
    return crypto.createHmac("sha256", this.secret).update(value).digest("base64url");
  }
}
