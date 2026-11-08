import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon, ownerOf } from "../server/lib/arcon.js";
import { record, staleBefore } from "../server/lib/changes.js";
import { ChangeInput, ChangeRow } from "../server/lib/shapes.js";

type Applied = { note: string; version: number; request: { from: number; cost: string } | null };

// The person's own edit from a Studio control. Hidden from the agent, which proposes instead.
export default defineAction({
  description: "Apply the person's own change to the plan from a Studio control, against the version they saw.",
  schema: z.object({
    id: z.string().min(1).describe("Arcon project id"),
    change: ChangeInput,
    baseVersion: z.number().int().min(0).describe("The design version the person was looking at"),
  }),
  outputSchema: z.object({ change: ChangeRow, message: z.string() }),
  errors: defineActionErrors(...ARCON_ERRORS),
  agentTool: false,
  run: async ({ id, change, baseVersion }, ctx) => {
    const owner = ownerOf(ctx);
    const out = await arcon<Applied>(`/projects/${encodeURIComponent(id)}/change`, { method: "POST", body: { change, baseVersion, by: "person" } });
    const note = out.request ? `${out.note} Sent to the owner to approve (${out.request.cost}).` : out.note;
    const row = await record({
      id: randomUUID(),
      ownerEmail: owner,
      projectId: id,
      kind: "change",
      change,
      baseVersion,
      summary: out.note,
      cost: out.request?.cost ?? null,
      reason: null,
      proposedBy: "person",
      status: "applied",
      resultVersion: out.version,
      note,
      after: null,
    });
    await staleBefore(owner, id, out.version);
    return { change: row, message: note };
  },
});
