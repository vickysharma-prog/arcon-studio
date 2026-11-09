import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { ecoFor } from "../engine/green/eco.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

export default defineAction({
  description: "Read the greener brands and nurseries for a project. For the screen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.unknown(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async ({ id }, ctx) => ecoFor((await ownProject(id, ctx)).project).catch(() => ({ brands: [], nurseries: [] })),
});
