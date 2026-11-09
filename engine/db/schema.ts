import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, primaryKey, serial, text } from "drizzle-orm/pg-core";

// The architect's data in Arcon Studio: their clients, each client's projects, the saved versions of a design, the
// project thread and the client's approvals. Every row belongs to one architect (owner_email), the signed-in person.

export const clients = pgTable(
  "studio_clients",
  {
    id: text("id").primaryKey(),
    ownerEmail: text("owner_email").notNull(),
    name: text("name").notNull(),
    /** The client's own address, for sending them the interview. Theirs, not an account. */
    contactEmail: text("contact_email"),
    phone: text("phone"),
    notes: text("notes"),
    createdAt: text("created_at").notNull().default(sql`now()`),
  },
  (t) => [index("studio_clients_owner").on(t.ownerEmail, t.createdAt)],
);

export const projects = pgTable(
  "studio_projects",
  {
    id: text("id").primaryKey(),
    ownerEmail: text("owner_email").notNull(),
    clientId: text("client_id"),
    spaceType: text("space_type"),
    title: text("title"),
    status: text("status").notNull().default("interview"),
    site: jsonb("site").notNull().default({}),
    interview: jsonb("interview").notNull().default({}),
    tasteSignals: jsonb("taste_signals").notNull().default([]),
    taste: jsonb("taste"),
    brief: jsonb("brief"),
    program: jsonb("program"),
    options: jsonb("options"),
    chosenOption: integer("chosen_option"),
    designedFor: text("designed_for"),
    tourDone: boolean("tour_done").notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`now()`),
    updatedAt: text("updated_at").notNull().default(sql`now()`),
  },
  (t) => [index("studio_projects_owner").on(t.ownerEmail, t.updatedAt), index("studio_projects_client").on(t.clientId)],
);

export const versions = pgTable(
  "studio_versions",
  {
    projectId: text("project_id").notNull(),
    version: integer("version").notNull(),
    layout: jsonb("layout").notNull(),
    note: text("note").notNull(),
    createdAt: text("created_at").notNull().default(sql`now()`),
  },
  (t) => [primaryKey({ columns: [t.projectId, t.version] })],
);

export const messages = pgTable(
  "studio_messages",
  {
    id: serial("id").primaryKey(),
    projectId: text("project_id").notNull(),
    kind: text("kind").notNull(),
    authorName: text("author_name").notNull(),
    /** "architect", "client" or "agent". */
    authorRole: text("author_role").notNull(),
    body: text("body").notNull(),
    roomId: text("room_id"),
    roomName: text("room_name"),
    level: integer("level"),
    version: integer("version"),
    data: jsonb("data").notNull().default({}),
    createdAt: text("created_at").notNull().default(sql`now()`),
  },
  (t) => [index("studio_messages_project").on(t.projectId, t.createdAt)],
);

export const approvals = pgTable(
  "studio_approvals",
  {
    id: serial("id").primaryKey(),
    projectId: text("project_id").notNull(),
    version: integer("version").notNull(),
    decision: text("decision").notNull(),
    decidedBy: text("decided_by").notNull(),
    note: text("note"),
    createdAt: text("created_at").notNull().default(sql`now()`),
  },
  (t) => [index("studio_approvals_project").on(t.projectId, t.createdAt)],
);

/** Hand-written migrations for these tables, applied by the server's db plugin. Append, never edit. */
export const ENGINE_MIGRATIONS = [
  {
    version: 3,
    name: "studio_architect_data",
    sql: `CREATE TABLE IF NOT EXISTS studio_clients (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  name TEXT NOT NULL,
  contact_email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_clients_owner ON studio_clients (owner_email, created_at);
CREATE TABLE IF NOT EXISTS studio_projects (
  id TEXT PRIMARY KEY,
  owner_email TEXT NOT NULL,
  client_id TEXT,
  space_type TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'interview',
  site JSONB NOT NULL DEFAULT '{}'::jsonb,
  interview JSONB NOT NULL DEFAULT '{}'::jsonb,
  taste_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
  taste JSONB,
  brief JSONB,
  program JSONB,
  options JSONB,
  chosen_option INTEGER,
  designed_for TEXT,
  tour_done BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL DEFAULT now(),
  updated_at TEXT NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_projects_owner ON studio_projects (owner_email, updated_at);
CREATE INDEX IF NOT EXISTS studio_projects_client ON studio_projects (client_id);
CREATE TABLE IF NOT EXISTS studio_versions (
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  layout JSONB NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, version)
);
CREATE TABLE IF NOT EXISTS studio_messages (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_role TEXT NOT NULL,
  body TEXT NOT NULL,
  room_id TEXT,
  room_name TEXT,
  level INTEGER,
  version INTEGER,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TEXT NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_messages_project ON studio_messages (project_id, created_at);
CREATE TABLE IF NOT EXISTS studio_approvals (
  id SERIAL PRIMARY KEY,
  project_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  decision TEXT NOT NULL,
  decided_by TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS studio_approvals_project ON studio_approvals (project_id, created_at);`,
  },
];
