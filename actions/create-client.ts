import { randomUUID } from "node:crypto";
import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { clients } from "../engine/db/schema.ts";
import { getDb } from "../server/db/index.js";
import { architectOf } from "../server/lib/projects.js";

export default defineAction({
  description: "Add a client for the architect. Name is required; email, phone and notes are optional.",
  schema: z.object({
    name: z.string().trim().min(1).max(80).describe("The client's name"),
    contactEmail: z.string().trim().email().max(120).optional().describe("The client's email, if the architect has it"),
    phone: z.string().trim().max(40).optional().describe("The client's phone, if the architect has it"),
    notes: z.string().trim().max(1000).optional().describe("Anything the architect wants to remember about them"),
  }),
  outputSchema: z.object({ id: z.string(), name: z.string() }),
  errors: defineActionErrors("not_signed_in"),
  run: async ({ name, contactEmail, phone, notes }, ctx) => {
    const architect = architectOf(ctx);
    const id = randomUUID();
    await getDb()
      .insert(clients)
      .values({ id, ownerEmail: architect, name, contactEmail: contactEmail ?? null, phone: phone ?? null, notes: notes ?? null });
    return { id, name };
  },
});
