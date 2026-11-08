import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon } from "../server/lib/arcon.js";
import { ProjectCard } from "../server/lib/shapes.js";

export default defineAction({
  description: "List the person's Arcon projects (their own and ones they are on), newest first, with id, title, role and whether a plan is chosen.",
  schema: z.object({}),
  outputSchema: z.object({ projects: z.array(ProjectCard) }),
  errors: defineActionErrors(...ARCON_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async () => arcon<{ projects: z.infer<typeof ProjectCard>[] }>("/projects"),
});
