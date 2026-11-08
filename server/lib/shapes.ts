import { z } from "zod";

// The shapes Studio reads from Arcon and keeps itself. Each one is an action's outputSchema too, so the UI, the agent
// and any external caller get exactly this.

export const ChangeInput = z
  .discriminatedUnion("op", [
    z.object({ op: z.literal("resize"), room: z.string().min(1).describe("Room id from get-design"), by: z.number().min(0.3).max(3).describe("Scale factor for the room's area, e.g. 1.2 for 20% bigger, 0.8 for smaller") }),
    z.object({ op: z.literal("add"), kind: z.string().min(1).max(30).describe('Room kind, e.g. "bedroom", "study", "bath", "store", "pooja"'), name: z.string().min(1).max(40).describe("Name to show on the plan") }),
    z.object({ op: z.literal("remove"), room: z.string().min(1).describe("Room id from get-design") }),
    z.object({ op: z.literal("rename"), room: z.string().min(1).describe("Room id from get-design"), name: z.string().min(1).max(40).describe("New name") }),
    z.object({ op: z.literal("kitchen"), open: z.boolean().describe("true opens the kitchen to the living space, false closes it") }),
  ])
  .describe('One change to the chosen plan. op is "resize", "add", "remove", "rename" or "kitchen".');
export type Change = z.infer<typeof ChangeInput>;

const Rect = z.object({ x: z.number(), y: z.number(), w: z.number(), h: z.number() });
export const Room = z.object({ id: z.string(), name: z.string(), kind: z.string(), floor: z.number(), area: z.number(), rect: Rect, zone: z.string(), open: z.boolean().optional() });

export const Design = z.object({
  id: z.string(),
  title: z.string(),
  spaceType: z.string().nullable(),
  status: z.string(),
  role: z.string(),
  canEdit: z.boolean(),
  location: z.string().nullable(),
  units: z.enum(["imperial", "metric"]),
  version: z.number(),
  locked: z.boolean(),
  concept: z.object({ name: z.string(), summary: z.string().nullable(), why: z.array(z.string()) }).nullable(),
  shell: z.object({ width: z.number(), depth: z.number() }),
  floors: z.number(),
  rooms: z.array(Room),
  spaces: z.array(Room),
  url: z.string(),
});
export type Design = z.infer<typeof Design>;

export const Budget = z.object({
  currency: z.string(),
  tier: z.string(),
  low: z.number(),
  high: z.number(),
  text: z.string(),
  area: z.number(),
  byCategory: z.array(z.object({ category: z.string(), amount: z.number() })),
  rooms: z.array(z.object({ id: z.string(), name: z.string(), total: z.number() })),
});

export const ProjectCard = z.object({
  id: z.string(),
  title: z.string(),
  spaceType: z.string().nullable(),
  status: z.string(),
  role: z.string(),
  location: z.string().nullable(),
  hasPlan: z.boolean(),
  updatedAt: z.string(),
});

export const Reasons = z.object({
  plan: z.object({ name: z.string(), why: z.array(z.string()) }).nullable(),
  choices: z.array(z.object({ what: z.string(), choice: z.string(), from: z.array(z.string()) })),
  loves: z.array(z.object({ name: z.string(), kind: z.string(), gave: z.array(z.string()) })),
});

export const Preview = z.object({ note: z.string(), cost: z.object({ delta: z.number(), text: z.string() }), rooms: z.array(Room), spaces: z.array(Room), shell: z.object({ width: z.number(), depth: z.number() }) });

export const STATUSES = ["pending", "applying", "applied", "rejected", "stale", "failed"] as const;
export const ChangeRow = z.object({
  id: z.string(),
  projectId: z.string(),
  kind: z.enum(["change", "undo"]),
  change: ChangeInput.nullable(),
  baseVersion: z.number(),
  summary: z.string(),
  cost: z.string().nullable(),
  reason: z.string().nullable(),
  proposedBy: z.enum(["agent", "person"]),
  status: z.enum(STATUSES),
  resultVersion: z.number().nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type ChangeRow = z.infer<typeof ChangeRow>;
