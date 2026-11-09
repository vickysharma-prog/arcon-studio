import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ownProject, PROJECT_ERRORS, readBudget } from "../server/lib/projects.js";
import { Budget } from "../server/lib/shapes.js";

export default defineAction({
  description: "Read the build cost of a project's chosen plan: the range, the quality tier, cost by category and by room, in the project's local currency. Null before a plan is chosen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: Budget.nullable(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => readBudget((await ownProject(id, ctx)).project),
});
