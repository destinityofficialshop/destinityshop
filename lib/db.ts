import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __destinityPgPool: Pool | undefined;
}

export function getDatabaseUrl() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || "";
}

export function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

export function getPool() {
  const connectionString = getDatabaseUrl();

  if (!connectionString) {
    throw new Error("No hay DATABASE_URL ni POSTGRES_URL configurada.");
  }

  if (!global.__destinityPgPool) {
    global.__destinityPgPool = new Pool({
      connectionString,
      ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false }
    });
  }

  return global.__destinityPgPool;
}
