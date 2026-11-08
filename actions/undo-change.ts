import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon, ownerOf } from "../server/lib/arcon.js";
import { record, staleBefore } from "../server/lib/changes.js";
import { ChangeRow } from "../server/lib/shapes.js";

// Steps the design back one version, if it is still at the version the person saw. Hidden from the agent.
export default defineAction({
  description: "Undo the last change to the plan, if the design is still at the version the person saw.",
  schema: z.object({
    id: z.string().min(1).describe("Arcon project id"),
    baseVersion: z.number().int().min(0).describe("The design version the person was looking at"),
  }),
  outputSchema: z.object({ change: ChangeRow, message: z.string() }),
  errors: defineActionErrors(...ARCON_ERRORS),
  agentTool: false,
  run: async ({ id, baseVersion }, ctx) => {
    const owner = ownerOf(ctx);
    const out = await arcon<{ note: string; version: number }>(`/projects/${encodeURIComponent(id)}/undo`, { method: "POST", body: { baseVersion } });
    const row = await record({
      id: randomUUID(),
      ownerEmail: owner,
      projectId: id,
      kind: "undo",
      change: null,
      baseVersion,
      summary: out.note,
      cost: null,
      reason: null,
      proposedBy: "person",
      status: "applied",
      resultVersion: out.version,
      note: out.note,
    });
    await staleBefore(owner, id, out.version);
    return { change: row, message: out.note };
  },
});
