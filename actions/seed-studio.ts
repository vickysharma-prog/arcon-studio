import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";

import { projects } from "../engine/db/schema.ts";
import { getDb } from "../server/db/index.js";
import { architectOf } from "../server/lib/projects.js";
import { seedStudio } from "../server/lib/seed.js";

// Fills the studio with sample clients at every stage, once, and names the project the guided demo opens on.
export default defineAction({
  description: "Add the sample clients and projects to the architect's studio (once), for the guided demo. For the screen.",
  schema: z.object({}),
  outputSchema: z.object({ added: z.boolean(), demo: z.string().nullable() }),
  errors: defineActionErrors("not_signed_in"),
  agentTool: false,
  run: async (_args, ctx) => {
    const architect = architectOf(ctx);
    const made = await seedStudio(architect);
    const [demo] = await getDb()
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.ownerEmail, architect), eq(projects.title, "Priya's house")))
      .orderBy(desc(projects.updatedAt))
      .limit(1);
    return { added: !!made, demo: demo?.id ?? null };
  },
});
