import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { TIERS, type Tier } from "../engine/budget/costs.ts";
import { shoppingFor } from "../engine/shop/fetch.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

export default defineAction({
  description: "Read the shopping list for a project's chosen plan: every piece of furniture and finish, priced at a finish level. For the screen.",
  schema: z.object({ id: z.string().min(1).describe("Project id"), tier: z.string().optional().describe("Finish level, e.g. essential, mid, premium, luxury") }),
  outputSchema: z.unknown(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  agentTool: false,
  run: async ({ id, tier }, ctx) => {
    const { project } = await ownProject(id, ctx);
    return shoppingFor(project, (TIERS as readonly string[]).includes(tier ?? "") ? (tier as Tier) : undefined);
  },
});
