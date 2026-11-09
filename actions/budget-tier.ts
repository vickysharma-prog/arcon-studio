import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { projectTier } from "../engine/budget/costs.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

// The finish level the budget starts at: the one the client asked for in the interview.
export default defineAction({
  description: "Read the finish level a project's budget starts at, from the client's interview. For the screen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({ tier: z.string(), signals: z.array(z.unknown()) }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async ({ id }, ctx) => ({ tier: projectTier((await ownProject(id, ctx)).project), signals: [] }),
});
