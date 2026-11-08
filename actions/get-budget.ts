import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon } from "../server/lib/arcon.js";
import { Budget } from "../server/lib/shapes.js";

export default defineAction({
  description: "Read the build cost of a project's chosen plan: the range, the quality tier, cost by category and by room, in the project's local currency.",
  schema: z.object({ id: z.string().min(1).describe("Arcon project id") }),
  outputSchema: Budget,
  errors: defineActionErrors(...ARCON_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }) => arcon<z.infer<typeof Budget>>(`/projects/${encodeURIComponent(id)}/budget`),
});
