import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon, ownerOf } from "../server/lib/arcon.js";
import { record } from "../server/lib/changes.js";
import { ChangeInput, ChangeRow, Design, Preview } from "../server/lib/shapes.js";

// The agent's way to change a design: it works out what the change does (new plan, cost) and puts it in front of the
// person. Nothing in Arcon changes until the person approves it with apply-change.
export default defineAction({
  description:
    "Propose one change to a project's plan for the person to approve. Arcon previews it (new rooms, cost change) and saves nothing; the proposal shows in Studio with Approve and Reject. Give a short reason tied to what the person asked or to get-reasons.",
  schema: z.object({
    id: z.string().min(1).describe("Arcon project id"),
    change: ChangeInput,
    reason: z.string().min(1).max(300).describe("One sentence on why, in the person's terms"),
  }),
  outputSchema: z.object({ proposal: ChangeRow, preview: Preview, message: z.string(), nextRequiredAction: z.string() }),
  errors: defineActionErrors(...ARCON_ERRORS),
  run: async ({ id, change, reason }, ctx) => {
    const owner = ownerOf(ctx);
    const path = `/projects/${encodeURIComponent(id)}`;
    const design = await arcon<Design>(path);
    const preview = await arcon<z.infer<typeof Preview>>(`${path}/preview`, { method: "POST", body: { change }, read: true });
    const proposal = await record({
      id: randomUUID(),
      ownerEmail: owner,
      projectId: id,
      kind: "change",
      change,
      baseVersion: design.version,
      summary: preview.note,
      cost: preview.cost.text,
      reason,
      proposedBy: "agent",
      status: "pending",
      resultVersion: null,
      note: null,
      after: preview.spaces,
    });
    return {
      proposal,
      preview,
      message: `Proposed: ${preview.note} (${preview.cost.text}). Waiting for the person to approve.`,
      nextRequiredAction: "apply-change",
    };
  },
});
