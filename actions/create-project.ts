import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { clients } from "../engine/db/schema.ts";
import { SpaceType } from "../engine/layout/schema.ts";
import { createProject } from "../engine/project/store.ts";
import { getDb } from "../server/db/index.js";
import { architectOf } from "../server/lib/projects.js";

const errors = defineActionErrors("not_signed_in", "not_found");

// A new project for one of the architect's clients. It starts at the interview, which the client answers with the
// architect (in the room or on a call); the type and city given here are already answered.
export default defineAction({
  description: "Start a new project for one of the architect's clients. It opens at the interview.",
  schema: z.object({
    clientId: z.string().min(1).describe("Client id from list-clients or create-client"),
    title: z.string().trim().max(80).optional().describe('Project name, e.g. "Mehta house"; defaults to the client\'s name'),
    spaceType: SpaceType.optional().describe('"house", "apartment", "office", "cafe", "hotel", "shop" or "studio", if known'),
    location: z.string().trim().max(120).optional().describe("City, if known"),
  }),
  outputSchema: z.object({ id: z.string(), title: z.string() }),
  errors,
  run: async ({ clientId, title, spaceType, location }, ctx) => {
    const architect = architectOf(ctx);
    const [client] = await getDb().select().from(clients).where(and(eq(clients.id, clientId), eq(clients.ownerEmail, architect)));
    if (!client) return errors.noWrite("That client isn't one of yours.", "not_found", { statusCode: 404 });
    const name = title?.trim() || `${client.name.split(/\s+/)[0]}'s ${spaceType ?? "project"}`;
    const p = await createProject({
      owner_id: architect,
      client_id: client.id,
      title: name,
      designed_for: client.name,
      ...(spaceType ? { space_type: spaceType } : {}),
      ...(location ? { site: { location } } : {}),
    });
    return { id: p.id, title: name };
  },
});
