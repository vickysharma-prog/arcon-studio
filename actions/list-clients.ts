import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

import { clients, projects } from "../engine/db/schema.ts";
import { getDb } from "../server/db/index.js";
import { architectOf } from "../server/lib/projects.js";
import { Client } from "../server/lib/shapes.js";


export default defineAction({
  description: "List the architect's clients, newest first, with how many projects each has.",
  schema: z.object({}),
  outputSchema: z.object({ clients: z.array(Client) }),
  errors: defineActionErrors("not_signed_in"),
  http: { method: "GET" },
  readOnly: true,
  run: async (_args, ctx) => {
    const architect = architectOf(ctx);
    const db = getDb();
    const [rows, owned] = await Promise.all([
      db.select().from(clients).where(eq(clients.ownerEmail, architect)).orderBy(desc(clients.createdAt)),
      db.select({ clientId: projects.clientId }).from(projects).where(eq(projects.ownerEmail, architect)),
    ]);
    const count = new Map<string, number>();
    for (const p of owned) if (p.clientId) count.set(p.clientId, (count.get(p.clientId) ?? 0) + 1);
    return {
      clients: rows.map((c) => ({ id: c.id, name: c.name, contactEmail: c.contactEmail, phone: c.phone, notes: c.notes, createdAt: c.createdAt, projects: count.get(c.id) ?? 0 })),
    };
  },
});
