import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ownProject, PROJECT_ERRORS, readReasons } from "../server/lib/projects.js";
import { Reasons } from "../server/lib/shapes.js";

export default defineAction({
  description:
    "Read why the design is the way it is: the plan's reasons from the client's interview, each style, colour and material choice with what it came from, and what each loved thing gave. Explain design decisions only from these facts.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: Reasons,
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => readReasons((await ownProject(id, ctx)).project),
});
