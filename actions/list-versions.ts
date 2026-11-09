import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { listVersions } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

export default defineAction({
  description: "List the saved versions of a project's design, newest first, with what changed in each.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({ versions: z.array(z.object({ version: z.number(), note: z.string(), created_at: z.string() })) }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => {
    await ownProject(id, ctx);
    return { versions: await listVersions(id) };
  },
});
