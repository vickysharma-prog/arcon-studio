import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { isNewBuild } from "../engine/budget/costs.ts";
import { latestVersion } from "../engine/project/store.ts";
import { chosenOf } from "../engine/workspace/apply.ts";
import { failOutcome, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

// What the 3D view draws: the design as it stands (the latest saved version), its brief and the client's taste.
export default defineAction({
  description: "Read what the 3D view of a project draws: the current layout, the brief and the taste. For the screen, not for the agent.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({
    title: z.string(),
    layout: z.unknown(),
    brief: z.unknown().nullable(),
    taste: z.unknown().nullable(),
    newBuild: z.boolean(),
    version: z.number(),
  }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async ({ id }, ctx) => {
    const { project: p } = await ownProject(id, ctx);
    const at = chosenOf(p);
    if ("status" in at) failOutcome(at);
    const saved = await latestVersion(p.id);
    return {
      title: p.title ?? "Untitled project",
      layout: saved?.layout ?? at.current,
      brief: p.brief ?? null,
      taste: p.taste ?? null,
      newBuild: isNewBuild(p),
      version: saved?.version ?? 0,
    };
  },
});
