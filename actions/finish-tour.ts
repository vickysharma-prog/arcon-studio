import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { updateProject } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

// The guided steps are done: from now on the project opens on its home.
export default defineAction({
  description: "Mark a project's guided steps as done, so it opens on its home. For the screen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({ ok: z.boolean() }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  agentTool: false,
  run: async ({ id }, ctx) => {
    const { project } = await ownProject(id, ctx);
    if (!project.toured_at) await updateProject(id, { toured_at: new Date().toISOString() });
    return { ok: true };
  },
});
