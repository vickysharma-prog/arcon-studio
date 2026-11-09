import { and, desc, eq } from "drizzle-orm";
import { estimate, isNewBuild, marketOf, money, projectTier, type Market } from "../budget/costs.ts";
import { db } from "../db/index.ts";
import { approvals } from "../db/schema.ts";
import { versionsSince } from "./store.ts";
import type { Layout } from "../layout/schema.ts";
import type { Project } from "./store.ts";

// Change requests: once a design is approved, a change to it is a request, not a fact. It shows what changed and what
// it does to the cost, and waits for whoever approves the design; approved, it's what gets built; declined, the
// design goes back to the approved version. The build carries on either way. (Vicky, 16 Oct.)

/** Stages where a change to the design is a request. After move-in, nothing changes. */
export const LOCKED = ["approved", "building"] as const;
export const isLocked = (status: string) => (LOCKED as readonly string[]).includes(status);

/** "+$3.2K", "−$800", or no change, in the market's own money. */
export function deltaText(delta: number, m: Market): string {
  if (Math.abs(delta) < 1) return "no change to the cost";
  return `${delta > 0 ? "+" : "−"}${money(Math.abs(delta), m)}`;
}

/** What a change does to the cost: the middle of the estimate after, less the middle before. */
export function costDelta(before: Layout, after: Layout, p: Pick<Project, "interview" | "site">): { delta: number; text: string } {
  const market = marketOf(p.site?.location);
  const mid = (l: Layout) => {
    const e = estimate(l, projectTier(p as Project), market, isNewBuild(p as Project), p.site?.location);
    return (e.total.low + e.total.high) / 2;
  };
  const delta = Math.round(mid(after) - mid(before));
  return { delta, text: deltaText(delta, market) };
}

export type PendingChange = { from: number; to: number; notes: string[]; delta: number; text: string; approved: Layout };

/** The version last approved, or null if none was. */
export async function approvedVersion(projectId: string): Promise<number | null> {
  const [row] = await db()
    .select({ version: approvals.version })
    .from(approvals)
    .where(and(eq(approvals.projectId, projectId), eq(approvals.decision, "approved")))
    .orderBy(desc(approvals.createdAt), desc(approvals.id))
    .limit(1);
  return row?.version ?? null;
}

/** The change waiting for approval on a locked design: every version since the approved one, and its cost. */
export async function pendingChange(p: Project): Promise<PendingChange | null> {
  if (!isLocked(p.status)) return null;
  const from = await approvedVersion(p.id);
  if (from === null) return null;
  const rows = await versionsSince(p.id, from);
  const approved = rows.find((r) => r.version === from);
  const latest = rows.at(-1);
  if (!approved || !latest || latest.version === from) return null;
  return { from, to: latest.version, notes: rows.filter((r) => r.version > from).map((r) => r.note), approved: approved.layout, ...costDelta(approved.layout, latest.layout, p) };
}
