import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { editDesign } from "../engine/workspace/apply.ts";
import { record, stalePending } from "../server/lib/changes.js";
import { failOutcome, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { ChangeInput, ChangeRow } from "../server/lib/shapes.js";

// The architect's own edit from a Studio control. Hidden from the agent, which proposes instead.
export default defineAction({
  description: "Apply the architect's own change to the plan from a Studio control, against the version they saw.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    change: ChangeInput,
    baseVersion: z.number().int().min(0).describe("The design version the architect was looking at"),
  }),
  outputSchema: z.object({ change: ChangeRow, message: z.string() }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  agentTool: false,
  run: async ({ id, change, baseVersion }, ctx) => {
    const { project, architect } = await ownProject(id, ctx);
    const out = await editDesign({ project, role: "owner" }, { change }, { id: architect, name: architect.split("@")[0] ?? architect }, baseVersion);
    if (out.status !== 200) failOutcome(out);
    const { note, version } = out.body as { note: string; version: number };
    const row = await record({
      id: randomUUID(),
      ownerEmail: architect,
      projectId: id,
      kind: "change",
      change,
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
