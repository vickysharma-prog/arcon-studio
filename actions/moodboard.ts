import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { moodboard } from "../engine/design/moodboard.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

export default defineAction({
  description: "Read a project's moodboard tiles. For the screen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({ tiles: z.array(z.unknown()) }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async ({ id }, ctx) => ({ tiles: await moodboard((await ownProject(id, ctx)).project).catch(() => []) }),
});
