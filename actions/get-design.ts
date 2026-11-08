import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon } from "../server/lib/arcon.js";
import { Design } from "../server/lib/shapes.js";

export default defineAction({
  description:
    "Read a project's chosen plan: rooms (id, name, kind, floor, area in m², rect in metres), the concept and why, the shell, the current version, and whether the person can edit. Use room ids from here in changes.",
  schema: z.object({ id: z.string().min(1).describe("Arcon project id from list-projects") }),
  outputSchema: Design,
  errors: defineActionErrors(...ARCON_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }) => arcon<Design>(`/projects/${encodeURIComponent(id)}`),
});
