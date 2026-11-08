import { sql } from "drizzle-orm";
import { index, integer, jsonb, pgTable, text } from "drizzle-orm/pg-core";

// One row per change to an Arcon design made from Studio: an agent's proposal waiting for a person, a person's
// own edit, or an undo. The feed is these rows, newest first, so who did what is never a separate record to keep in step.
export const changes = pgTable(
  "studio_changes",
  {
    id: text("id").primaryKey(),
    ownerEmail: text("owner_email").notNull(),
    projectId: text("project_id").notNull(),
    /** "change" or "undo". */
    kind: text("kind").notNull(),
    /** The Arcon change, null for an undo. */
    change: jsonb("change"),
    /** The Arcon version the change was worked out against. It applies only there. */
    baseVersion: integer("base_version").notNull(),
    summary: text("summary").notNull(),
    /** The cost line Arcon gave when previewing it, if any. */
    cost: text("cost"),
    reason: text("reason"),
    /** "agent" or "person". */
    proposedBy: text("proposed_by").notNull(),
    /** pending, applying, applied, rejected, stale or failed. */
    status: text("status").notNull(),
    resultVersion: integer("result_version"),
    note: text("note"),
    createdAt: text("created_at").notNull().default(sql`now()`),
    updatedAt: text("updated_at").notNull().default(sql`now()`),
  },
  (t) => [index("studio_changes_owner_project").on(t.ownerEmail, t.projectId, t.createdAt)],
);
