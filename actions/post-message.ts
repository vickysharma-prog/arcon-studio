import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { postMessage } from "../engine/project/thread.ts";
import { architectOf, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

// A note on the project thread, from the architect (or, for the agent, from the agent).
export default defineAction({
  description: "Post a note on a project's thread, optionally about one room. Use for the architect's notes; the agent posts as itself.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    body: z.string().trim().min(1).max(4000).describe("The note"),
    room: z.object({ id: z.string().max(80), name: z.string().max(80), level: z.number().int().min(0).max(5) }).nullable().optional().describe("The room it is about, if any"),
  }),
  outputSchema: z.unknown(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  run: async ({ id, body, room }, ctx) => {
    const { project } = await ownProject(id, ctx);
    const architect = architectOf(ctx);
    const byAgent = ctx?.caller === "tool";
    return postMessage(project, { name: byAgent ? `${architect.split("@")[0]}'s agent` : (architect.split("@")[0] ?? architect) }, { body, room: room ?? null, role: byAgent ? "agent" : "architect" });
  },
});
