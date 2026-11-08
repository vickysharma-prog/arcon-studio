import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon } from "../server/lib/arcon.js";
import { Design } from "../server/lib/shapes.js";

export default defineAction({
  description:
    "Read a project's chosen plan: rooms (id, name, kind, floor, area in m², rect in metres), the concept and why, the shell, the current version, whether the kitchen is open (kitchenOpen), and whether the person can edit. Use room ids from here in changes.",
  schema: z.object({ id: z.string().min(1).describe("Arcon project id from list-projects") }),
  outputSchema: Design.extend({ kitchenOpen: z.boolean().nullable().describe("true if the kitchen opens to the living space, false if it is its own room, null if there is no kitchen") }),
  errors: defineActionErrors(...ARCON_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }) => {
    const d = await arcon<Design>(`/projects/${encodeURIComponent(id)}`);
    // Arcon leaves `open` off a kitchen that is open, which reads as "unknown" to a model; say it outright.
    const kitchen = d.rooms.find((r) => r.kind === "kitchen");
    return { ...d, kitchenOpen: kitchen ? kitchen.open !== false : null };
  },
});
