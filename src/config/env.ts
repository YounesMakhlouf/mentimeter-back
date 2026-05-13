export type NodeEnv = "development" | "production" | "test";

export interface EnvConfig {
  APP_PORT: number;
  SECRET: string;
  NODE_ENV: NodeEnv;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_NAME: string;
  DATABASE_SYNCHRONIZE: boolean;
}

function required(raw: Record<string, unknown>, key: keyof EnvConfig): string {
  const v = raw[key];
  if (v === undefined || v === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return String(v);
}

function asInt(raw: string, key: string): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    throw new Error(
      `Environment variable ${key} must be an integer (got "${raw}")`,
    );
  }
  return n;
}

export function loadEnv(raw: Record<string, unknown>): EnvConfig {
  return {
    APP_PORT: asInt(required(raw, "APP_PORT"), "APP_PORT"),
    SECRET: required(raw, "SECRET"),
    NODE_ENV: (raw.NODE_ENV as NodeEnv) ?? "development",
    DATABASE_HOST: required(raw, "DATABASE_HOST"),
    DATABASE_PORT: asInt(required(raw, "DATABASE_PORT"), "DATABASE_PORT"),
    DATABASE_USERNAME: required(raw, "DATABASE_USERNAME"),
    DATABASE_PASSWORD: required(raw, "DATABASE_PASSWORD"),
    DATABASE_NAME: required(raw, "DATABASE_NAME"),
    DATABASE_SYNCHRONIZE: raw.DATABASE_SYNCHRONIZE === "true",
  };
}
