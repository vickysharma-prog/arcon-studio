import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ownProject, PROJECT_ERRORS, readDesign } from "../server/lib/projects.js";
import { Design } from "../server/lib/shapes.js";

export default defineAction({
  description:
    "Read a project's chosen plan: rooms (id, name, kind, floor, area in m², rect in metres), the concept and why, the shell, the current version, whether the kitchen is open (kitchenOpen), and whether it can be edited. Use room ids from here in changes.",
  schema: z.object({ id: z.string().min(1).describe("Project id from list-projects") }),
  outputSchema: Design.extend({ kitchenOpen: z.boolean().nullable().describe("true if the kitchen opens to the living space, false if it is its own room, null if there is no kitchen") }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => {
    const { project } = await ownProject(id, ctx);
    const d = await readDesign(project);
    const kitchen = d.rooms.find((r) => r.kind === "kitchen");
    return { ...d, kitchenOpen: kitchen ? kitchen.open !== false : null };
  },
});
