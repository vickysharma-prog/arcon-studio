import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { projects, versions } from "../db/schema.ts";
import type { Layout, Program, SpaceType } from "../layout/schema.ts";
import type { Profile } from "../qloo/taste.ts";

// A project in Arcon Studio: one architect's design for one client. Same shape and functions as Studio's store, so
// the engine reads it unchanged; here it lives in Studio's own database and always belongs to the architect who made
// it (owner_id is the architect's email).

export type Site = {
  width?: number;
  depth?: number;
  floors?: number;
  location?: string;
  units?: "imperial" | "metric";
  geo?: { lat: number; lon: number; for: string }; // where `location` is on the map, found once
};
export type TasteSignal = { entityId: string; name: string; layer: 1 | 2 | 3; type?: string };

export type Project = {
  id: string;
  owner_id: string | null;
  guest_id: string | null;
  mode: "owner" | "pro";
  space_type: SpaceType | null;
  title: string | null;
  status: "interview" | "designing" | "ready" | "review" | "approved" | "building" | "done";
  site: Site;
  interview: Record<string, unknown>;
  taste_signals: TasteSignal[];
  taste: Profile | null;
  brief: unknown;
  program: Program | null;
  options?: Layout[] | null;
  chosen_option: number | null;
  unlocked_at?: string | null;
  toured_at?: string | null;
  self_build?: boolean;
  designed_for?: string | null;
  handed_over_at?: string | null;
  warranty_months?: number | null;
  handover_note?: string | null;
  /** Studio: the architect's client this project is for. */
  client_id?: string | null;
  updated_at?: string;
};

type Patch = Partial<Omit<Project, "id">>;
type Row = typeof projects.$inferSelect;

/** Row to the engine's Project. Studio projects are always a pro's, and always unlocked (no pay-per-project here). */
export function toProject(r: Row): Project {
  return {
    id: r.id,
    owner_id: r.ownerEmail,
    guest_id: null,
    mode: "pro",
    space_type: r.spaceType as SpaceType | null,
    title: r.title,
    status: r.status as Project["status"],
    site: (r.site ?? {}) as Site,
    interview: (r.interview ?? {}) as Record<string, unknown>,
    taste_signals: (r.tasteSignals ?? []) as TasteSignal[],
    taste: (r.taste ?? null) as Profile | null,
    brief: r.brief ?? null,
    program: (r.program ?? null) as Program | null,
    options: (r.options ?? null) as Layout[] | null,
    chosen_option: r.chosenOption,
    unlocked_at: r.createdAt,
    toured_at: r.tourDone ? r.updatedAt : null,
    designed_for: r.designedFor,
    client_id: r.clientId,
    updated_at: r.updatedAt,
  };
}

/** The engine's patch to columns. Fields Studio doesn't keep (handover, warranty, guest) are dropped. */
export function toColumns(p: Patch): Partial<typeof projects.$inferInsert> {
  const c: Partial<typeof projects.$inferInsert> = {};
  if (p.owner_id !== undefined && p.owner_id !== null) c.ownerEmail = p.owner_id;
  if (p.client_id !== undefined) c.clientId = p.client_id;
  if (p.space_type !== undefined) c.spaceType = p.space_type;
  if (p.title !== undefined) c.title = p.title;
  if (p.status !== undefined) c.status = p.status;
  if (p.site !== undefined) c.site = p.site;
  if (p.interview !== undefined) c.interview = p.interview;
  if (p.taste_signals !== undefined) c.tasteSignals = p.taste_signals;
  if (p.taste !== undefined) c.taste = p.taste;
  if (p.brief !== undefined) c.brief = p.brief;
  if (p.program !== undefined) c.program = p.program;
  if (p.options !== undefined) c.options = p.options;
  if (p.chosen_option !== undefined) c.chosenOption = p.chosen_option;
  if (p.designed_for !== undefined) c.designedFor = p.designed_for;
  if (p.toured_at !== undefined) c.tourDone = !!p.toured_at;
  return c;
}

const now = () => new Date().toISOString();

export async function createProject(fields: Patch = {}): Promise<Project> {
  if (!fields.owner_id) throw new Error("A project needs its architect.");
  const [row] = await db()
    .insert(projects)
    .values({ id: randomUUID(), ownerEmail: fields.owner_id, ...toColumns(fields) })
    .returning();
  return toProject(row as Row);
}

export async function getProject(id: string): Promise<Project> {
  const [row] = await db().select().from(projects).where(eq(projects.id, id));
  if (!row) throw new Error("No such project.");
  return toProject(row as Row);
}

export async function updateProject(id: string, patch: Patch): Promise<Project> {
  const [row] = await db()
    .update(projects)
    .set({ ...toColumns(patch), updatedAt: now() })
    .where(eq(projects.id, id))
    .returning();
  if (!row) throw new Error("No such project.");
  return toProject(row as Row);
}

// Once a project has an owner, only that account can open it. Until then, the browser that started it can.
export const ownsProject = (p: Pick<Project, "owner_id" | "guest_id">, who: { userId?: string | null; guestId?: string | null }) =>
  p.owner_id ? !!who.userId && p.owner_id === who.userId : !!who.guestId && p.guest_id === who.guestId;

export async function deleteProject(id: string) {
  await db().delete(versions).where(eq(versions.projectId, id));
  await db().delete(projects).where(eq(projects.id, id));
}

// Merge one interview section into what's already stored, so answers build up over the conversation.
export async function saveInterview(id: string, section: string, data: Record<string, unknown>) {
  const p = await getProject(id);
  const prev = (p.interview[section] as Record<string, unknown>) ?? {};
  return updateProject(id, { interview: { ...p.interview, [section]: { ...prev, ...data } } });
}

// Add taste signals, skipping entities already recorded.
export async function addTasteSignals(id: string, signals: TasteSignal[]) {
  const p = await getProject(id);
  const known = new Set(p.taste_signals.map((s) => s.entityId));
  const merged = [...p.taste_signals, ...signals.filter((s) => !known.has(s.entityId))];
  return updateProject(id, { taste_signals: merged });
}

/** Saves a new version of the design. Two saves at once can't both take the same number (it's the primary key). */
export async function saveVersion(projectId: string, layout: Layout, note: string) {
  const last = await latestVersion(projectId);
  const version = (last?.version ?? 0) + 1;
  await db().insert(versions).values({ projectId, version, layout, note });
  return version;
}

export async function latestVersion(projectId: string): Promise<{ version: number; layout: Layout } | null> {
  const [row] = await db()
    .select({ version: versions.version, layout: versions.layout })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.version))
    .limit(1);
  return row ? { version: row.version, layout: row.layout as Layout } : null;
}

/** The saved versions of a design, newest first, with what changed in each. */
export const listVersions = (projectId: string) =>
  db()
    .select({ version: versions.version, note: versions.note, created_at: versions.createdAt })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.version))
    .limit(30);

/** Versions from `from` on, oldest first: what a change since an approval is made of. */
export async function versionsSince(projectId: string, from: number) {
  const rows = await db().select().from(versions).where(eq(versions.projectId, projectId)).orderBy(versions.version);
  return rows.filter((r) => r.version >= from).map((r) => ({ version: r.version, note: r.note, layout: r.layout as Layout }));
}

/** Steps back one version: the newest is deleted and the one before it returned, or null if there's nothing to undo. */
export async function undoVersion(projectId: string): Promise<{ version: number; layout: Layout } | null> {
  const rows = await db()
    .select({ version: versions.version, layout: versions.layout })
    .from(versions)
    .where(eq(versions.projectId, projectId))
    .orderBy(desc(versions.version))
    .limit(2);
  if (rows.length < 2) return null;
  await db()
    .delete(versions)
    .where(and(eq(versions.projectId, projectId), eq(versions.version, rows[0]!.version)));
  return { version: rows[1]!.version, layout: rows[1]!.layout as Layout };
}
