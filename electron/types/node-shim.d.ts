declare module "node:path" {
  const path: {
    join: (...parts: string[]) => string;
  };
  export default path;
}

declare const __dirname: string;

declare const process: {
  env: Record<string, string | undefined>;
  platform: string;
};

declare function setTimeout(
  callback: (...args: unknown[]) => void,
  ms?: number,
  ...args: unknown[]
): unknown;
