import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { architectOf as ownerOf } from "../server/lib/projects.js";
import { listFor } from "../server/lib/changes.js";
import { ChangeRow } from "../server/lib/shapes.js";

export default defineAction({
  description: "List the project's Studio feed, newest first: the agent's proposals (pending, applied, rejected or stale) and the person's own edits and undos.",
  schema: z.object({ id: z.string().min(1).describe("Arcon Studio project id") }),
  outputSchema: z.object({ changes: z.array(ChangeRow) }),
  errors: defineActionErrors("not_signed_in"),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => ({ changes: await listFor(ownerOf(ctx), id) }),
});
