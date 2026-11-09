import { and, desc, eq } from "drizzle-orm";
import { db } from "../db/index.ts";
import { approvals, messages } from "../db/schema.ts";
import { latestVersion, saveVersion, updateProject, type Project } from "./store.ts";
import type { ProjectRole } from "./access.ts";
import { eventText, statusAfter, type ThreadEvent } from "./review.ts";

// The project thread in Arcon Studio: the architect's notes, the agent's, and the project's own events (a plan chosen,
// a change saved, a review), plus the client's answer, which the architect records from their meeting. The client
// has no account here; Studio is the architect's tool.

export type Channel = "all";
export type AuthorRole = "architect" | "client" | "agent";
export type Attachment = { path: string; name: string; type: string; size: number; url?: string };
export type Message = {
  id: number;
  channel: Channel;
  kind: "message" | "event";
  author_id: string | null;
  author_name: string;
  author_role: AuthorRole;
  body: string;
  room_id: string | null;
  room_name: string | null;
  level: number | null;
  version: number | null;
  data: Partial<ThreadEvent> & Record<string, unknown>;
  attachments: Attachment[];
  created_at: string;
};

type Row = typeof messages.$inferSelect;
const toMessage = (r: Row): Message => ({
  id: r.id,
  channel: "all",
  kind: r.kind as Message["kind"],
  author_id: null,
  author_name: r.authorName,
  author_role: r.authorRole as AuthorRole,
  body: r.body,
  room_id: r.roomId,
  room_name: r.roomName,
  level: r.level,
  version: r.version,
  data: (r.data ?? {}) as Message["data"],
  attachments: [],
  created_at: r.createdAt,
});

type Post = { body: string; room?: { id: string; name: string; level: number } | null; version?: number | null; role?: AuthorRole };

/** A note on the project, from the architect, the client (as the architect records it) or the agent. */
export async function postMessage(p: Pick<Project, "id">, author: { id?: string | null; name: string }, m: Post): Promise<Message> {
  const [row] = await db()
    .insert(messages)
    .values({
      projectId: p.id,
      kind: "message",
      authorName: author.name,
      authorRole: m.role ?? "architect",
      body: m.body,
      roomId: m.room?.id ?? null,
      roomName: m.room?.name ?? null,
      level: m.room?.level ?? null,
      version: m.version ?? null,
    })
    .returning();
  return toMessage(row as Row);
}

/** One of the project's own events, in the thread. `quiet` is kept for the engine's callers; Studio rings no bell. */
export async function postEvent(p: Pick<Project, "id">, actor: { id: string | null; name: string }, e: ThreadEvent, _quiet = false) {
  await db()
    .insert(messages)
    .values({
      projectId: p.id,
      kind: "event",
      authorName: actor.name,
      authorRole: /agent/i.test(actor.name) ? "agent" : "architect",
      body: eventText(e, actor.name),
      version: "version" in e ? e.version : null,
      data: e,
    });
}

/** The latest messages, oldest first. */
export async function listMessages(projectId: string, _channel: Channel = "all", limit = 200): Promise<Message[]> {
  const rows = await db().select().from(messages).where(eq(messages.projectId, projectId)).orderBy(desc(messages.createdAt), desc(messages.id)).limit(limit);
  return rows.map((r) => toMessage(r as Row)).reverse();
}

/** The version the review is about: the latest saved one, or the chosen plan saved as version 1. */
async function currentVersion(p: Project): Promise<number> {
  const last = await latestVersion(p.id);
  if (last) return last.version;
  const layout = p.chosen_option !== null ? p.options?.[p.chosen_option] : null;
  if (!layout) throw new Error("Choose a plan first.");
  return saveVersion(p.id, layout, "Chose this plan");
}

export async function sendForReview(p: Project, actor: { id: string | null; name: string }) {
  const version = await currentVersion(p);
  await updateProject(p.id, { status: statusAfter("send", p.status) });
  await postEvent(p, actor, { type: "review", version });
  return version;
}

/** The client's answer, recorded by the architect. It locks this version when approved. */
export async function decide(p: Project, actor: { id: string; name: string }, decision: "approved" | "changes", note: string | null, inPerson: string | null = null) {
  const version = await currentVersion(p);
  await db().insert(approvals).values({ projectId: p.id, version, decision, decidedBy: inPerson ?? actor.name, note });
  await updateProject(p.id, { status: statusAfter(decision === "approved" ? "approve" : "changes", p.status) });
  await postEvent(p, actor, decision === "approved" ? { type: "approved", version, note, for: inPerson } : { type: "changes", version, note, for: inPerson });
  return version;
}

/** Records an approval directly (an architect's own change to an approved design). */
export async function recordApproval(projectId: string, version: number, by: string, note: string) {
  await db().insert(approvals).values({ projectId, version, decision: "approved", decidedBy: by, note });
}

/** The latest approval, for "Approved v3 by Priya". */
export async function lastApproval(projectId: string) {
  const [row] = await db()
    .select()
    .from(approvals)
    .where(and(eq(approvals.projectId, projectId), eq(approvals.decision, "approved")))
    .orderBy(desc(approvals.createdAt), desc(approvals.id))
    .limit(1);
  return row ? { version: row.version, user_id: row.decidedBy, decision: row.decision, created_at: row.createdAt, by: row.decidedBy } : null;
}

/** Who answers a review in Studio: the architect, for their client. */
export async function decides(_p: Pick<Project, "id" | "owner_id">, role: ProjectRole): Promise<boolean> {
  return role === "owner" || role === "architect";
}

/** The client the architect records an answer for: their first name, from the project. */
export async function inPersonClient(p: Pick<Project, "id" | "owner_id" | "mode" | "designed_for">, role: ProjectRole): Promise<string | null> {
  if ((role !== "owner" && role !== "architect") || !p.designed_for) return null;
  return p.designed_for.trim().split(/\s+/)[0] ?? null;
}
