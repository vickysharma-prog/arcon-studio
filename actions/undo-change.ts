import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { editDesign } from "../engine/workspace/apply.ts";
import { record, stalePending } from "../server/lib/changes.js";
import { failOutcome, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { ChangeRow } from "../server/lib/shapes.js";

// Steps the design back one version, if it is still at the version the architect saw. Hidden from the agent.
export default defineAction({
  description: "Undo the last change to the plan, if the design is still at the version the architect saw.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    baseVersion: z.number().int().min(0).describe("The design version the architect was looking at"),
  }),
  outputSchema: z.object({ change: ChangeRow, message: z.string() }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  agentTool: false,
  run: async ({ id, baseVersion }, ctx) => {
    const { project, architect } = await ownProject(id, ctx);
    const out = await editDesign({ project, role: "owner" }, { undo: true }, { id: architect, name: architect.split("@")[0] ?? architect }, baseVersion);
    if (out.status !== 200) failOutcome(out);
    const { note, version } = out.body as { note: string; version: number };
    const row = await record({
      id: randomUUID(),
      ownerEmail: architect,
      projectId: id,
      kind: "undo",
      change: null,
      baseVersion,
      summary: note,
      cost: null,
      reason: null,
      proposedBy: "person",
      status: "applied",
      resultVersion: version,
      note,
      after: null,
    });
    await stalePending(architect, id);
    return { change: row, message: note };
  },
});
