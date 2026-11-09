import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { designView } from "../engine/studio/view.ts";
import { chosenOf, previewChange, versionOf } from "../engine/workspace/apply.ts";
import { record } from "../server/lib/changes.js";
import { failOutcome, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { ChangeInput, ChangeRow, Preview } from "../server/lib/shapes.js";

// The agent's way to change a design: work out what the change does (new plan, cost) and put it in front of the
// architect. Nothing changes until the architect approves it with apply-change.
export default defineAction({
  description:
    "Propose one change to a project's plan for the architect to approve. Previews it (new rooms, cost change) and saves nothing; the proposal shows in Studio with Approve and Reject. Give a short reason tied to the client's interview or get-reasons.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    change: ChangeInput,
    reason: z.string().min(1).max(300).describe("One sentence on why, in the client's terms"),
  }),
  outputSchema: z.object({ proposal: ChangeRow, preview: Preview, message: z.string(), nextRequiredAction: z.string() }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  run: async ({ id, change, reason }, ctx) => {
    const { project, architect } = await ownProject(id, ctx);
    const at = chosenOf(project);
    if ("status" in at) failOutcome(at);
    const out = previewChange(project, at.current, change);
    if ("error" in out) failOutcome({ status: 422, body: { error: out.error, code: "does_not_fit" } });
    const after = designView(project, out.layout, "owner", false, 0, false, "");
    const preview = { note: out.note, cost: out.cost, rooms: after.rooms, spaces: after.spaces, shell: after.shell };
    const proposal = await record({
      id: randomUUID(),
      ownerEmail: architect,
      projectId: id,
      kind: "change",
      change,
      baseVersion: await versionOf(id),
      summary: out.note,
      cost: out.cost.text,
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
      message: `Proposed: ${out.note} (${out.cost.text}). Waiting for the architect to approve.`,
      nextRequiredAction: "apply-change",
    };
  },
});
