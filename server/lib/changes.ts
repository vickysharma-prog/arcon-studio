import { and, desc, eq, lt, sql } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { changes } from "../db/schema.js";
import type { Change, ChangeRow } from "./shapes.js";

// The Studio feed for a project. A proposal applies once and only against the version it was worked out on: the claim
// below moves it from pending to applying in one statement, so two approvals can never both reach Arcon.

type Row = typeof changes.$inferSelect;
const toRow = (r: Row): ChangeRow => ({
  ...r,
  kind: r.kind as ChangeRow["kind"],
  change: (r.change ?? null) as Change | null,
  proposedBy: r.proposedBy as ChangeRow["proposedBy"],
  status: r.status as ChangeRow["status"],
  after: (r.after ?? null) as ChangeRow["after"],
});

export async function record(row: Omit<Row, "createdAt" | "updatedAt">): Promise<ChangeRow> {
  const [saved] = await getDb().insert(changes).values(row).returning();
  return toRow(saved!);
}

export async function listFor(ownerEmail: string, projectId: string, limit = 50): Promise<ChangeRow[]> {
  const rows = await getDb()
    .select()
    .from(changes)
    .where(and(eq(changes.ownerEmail, ownerEmail), eq(changes.projectId, projectId)))
    .orderBy(desc(changes.createdAt))
    .limit(limit);
  return rows.map(toRow);
}

export async function getOne(ownerEmail: string, id: string): Promise<ChangeRow | null> {
  const [r] = await getDb().select().from(changes).where(and(eq(changes.ownerEmail, ownerEmail), eq(changes.id, id)));
  return r ? toRow(r) : null;
}

/** Moves a proposal from one status to another only if it is still in the first. Null when someone got there first. */
export async function move(ownerEmail: string, id: string, from: ChangeRow["status"], to: ChangeRow["status"], extra: Partial<Pick<Row, "resultVersion" | "note">> = {}): Promise<ChangeRow | null> {
  const [r] = await getDb()
    .update(changes)
    .set({ status: to, ...extra, updatedAt: sql`now()` })
    .where(and(eq(changes.ownerEmail, ownerEmail), eq(changes.id, id), eq(changes.status, from)))
    .returning();
  return r ? toRow(r) : null;
}

/** Once the design moves to `version`, every proposal worked out on an earlier one can no longer apply. */
export async function staleBefore(ownerEmail: string, projectId: string, version: number): Promise<void> {
  await getDb()
    .update(changes)
    .set({ status: "stale", updatedAt: sql`now()` })
    .where(and(eq(changes.ownerEmail, ownerEmail), eq(changes.projectId, projectId), eq(changes.status, "pending"), lt(changes.baseVersion, version)));
}
