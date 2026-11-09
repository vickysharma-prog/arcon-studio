import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { architectOf as ownerOf } from "../server/lib/projects.js";
import { getOne, move } from "../server/lib/changes.js";
import { ChangeRow } from "../server/lib/shapes.js";

const errors = defineActionErrors("not_signed_in", "not_pending");

export default defineAction({
  description: "Reject a pending proposal. The design stays as it is. Use when the person says no to a proposal.",
  schema: z.object({
    changeId: z.string().min(1).describe("Proposal id"),
    note: z.string().max(300).optional().describe("What the person said, if they gave a reason"),
  }),
  outputSchema: z.object({ change: ChangeRow }),
  errors,
  run: async ({ changeId, note }, ctx) => {
    const owner = ownerOf(ctx);
    const done = await move(owner, changeId, "pending", "rejected", note ? { note } : {});
    if (done) return { change: done };
    const now = await getOne(owner, changeId);
    return errors.noWrite(now ? `This proposal is already ${now.status}.` : "No such proposal.", "not_pending", { statusCode: now ? 409 : 404 });
  },
});
