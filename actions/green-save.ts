import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { updateProject } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

const Change = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("plants"), room: z.string().max(80), n: z.number().int().min(1).max(20) }),
  z.object({ kind: z.literal("swap"), room: z.string().max(80), plant: z.string().max(60) }),
  z.object({ kind: z.literal("outdoor") }),
]);

// The greener choices ticked on the green step, kept with the interview so the 3D and the list follow them.
export default defineAction({
  description: "Save the greener choices ticked for a project. For the screen.",
  schema: z.object({ id: z.string().min(1).describe("Project id"), ticked: z.array(z.object({ id: z.string().max(160), label: z.string().max(200), change: Change })).max(80) }),
  outputSchema: z.object({ ok: z.boolean() }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  agentTool: false,
  run: async ({ id, ticked }, ctx) => {
    const { project } = await ownProject(id, ctx);
    await updateProject(id, { interview: { ...project.interview, green: ticked } });
    return { ok: true };
  },
});
