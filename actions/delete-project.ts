import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { deleteProject } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

export default defineAction({
  description: "Delete one of the architect's projects and its saved versions. From the project screen only.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({ ok: z.boolean() }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  agentTool: false,
  run: async ({ id }, ctx) => {
    await ownProject(id, ctx);
    await deleteProject(id);
    return { ok: true };
  },
});
