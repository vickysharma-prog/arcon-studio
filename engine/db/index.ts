import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

// The engine reaches the database through whatever the server hands it once at start (Studio's own Drizzle
// database), so the engine's pure code and its tests never load the server.

// biome-ignore lint/suspicious/noExplicitAny: the schema type lives with the server
type Db = PgDatabase<PgQueryResultHKT, any>;

let get: (() => Db) | null = null;

export function provideDb(f: () => Db) {
  get = f;
}

export function db(): Db {
  if (!get) throw new Error("The engine's database isn't set up: provideDb() runs in server/plugins/db.ts.");
  return get();
}
