import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { clients, projects } from "../engine/db/schema.ts";
import { getDb } from "../server/db/index.js";
import { architectOf } from "../server/lib/projects.js";
import { ProjectCard } from "../server/lib/shapes.js";

export default defineAction({
  description:
    "List the architect's projects, newest first: id, title, client, type, city, status (interview, designing, ready, review, approved, building, done), whether plan options exist and whether one is chosen.",
  schema: z.object({ clientId: z.string().optional().describe("Only this client's projects") }),
  outputSchema: z.object({ projects: z.array(ProjectCard) }),
  errors: defineActionErrors("not_signed_in"),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ clientId }, ctx) => {
    const architect = architectOf(ctx);
    const db = getDb();
    const [rows, people] = await Promise.all([
      db
        .select({
          id: projects.id,
          title: projects.title,
          spaceType: projects.spaceType,
          status: projects.status,
          site: projects.site,
          options: projects.options,
          chosenOption: projects.chosenOption,
          clientId: projects.clientId,
          designedFor: projects.designedFor,
          updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.ownerEmail, architect))
        .orderBy(desc(projects.updatedAt))
        .limit(100),
      db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.ownerEmail, architect)),
    ]);
    const nameOf = new Map(people.map((c) => [c.id, c.name]));
    return {
      projects: rows
        .filter((r) => !clientId || r.clientId === clientId)
        .map((r) => ({
          id: r.id,
          title: r.title ?? "Untitled project",
          spaceType: r.spaceType,
          status: r.status,
          location: ((r.site ?? {}) as { location?: string }).location ?? null,
          hasOptions: Array.isArray(r.options) && r.options.length > 0,
          hasPlan: r.chosenOption !== null,
          clientId: r.clientId,
          clientName: (r.clientId && nameOf.get(r.clientId)) || r.designedFor,
          updatedAt: r.updatedAt,
        })),
    };
  },
});
