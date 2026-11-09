import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { projectView } from "../server/lib/view.js";

// The whole project for Arcon's project screens in Studio: brief, plans, chosen plan, interview, status.
export default defineAction({
  description: "Read the whole project as the project screens show it. For the screen, not the agent.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.unknown(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async ({ id }, ctx) => projectView((await ownProject(id, ctx)).project),
});
