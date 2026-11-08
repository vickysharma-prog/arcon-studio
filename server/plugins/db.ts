import { runMigrations } from "@agent-native/core/db";

export default runMigrations(
  [
    {
      version: 1,
      name: "studio_changes",
      sql: `CREATE TABLE IF NOT EXISTS studio_changes (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  change JSONB,
  base_version INTEGER NOT NULL,
  summary TEXT NOT NULL,
  cost TEXT,
  reason TEXT,
  proposed_by TEXT NOT NULL,
  status TEXT NOT NULL,
  result_version INTEGER,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_changes_owner_project ON studio_changes (owner_email, project_id, created_at);`,
    },
  ],
  { table: "studio_migrations" },
);
