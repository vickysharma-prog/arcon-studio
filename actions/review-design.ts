import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { saveVersion, updateProject } from "../engine/project/store.ts";
import { canSendForReview } from "../engine/project/review.ts";
import { pendingChange } from "../engine/project/change.ts";
import { decide, inPersonClient, postEvent, recordApproval, sendForReview } from "../engine/project/thread.ts";
import { architectOf, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "not_waiting");

// Review with the client, as Studio's thread runs it: the architect sends the design for review, then records the
// client's answer from their meeting (approve, or changes), or their answer to a change on an approved design.
export default defineAction({
  description: "Send a design to the client for review, or record the client's answer: approve, changes, change-approve or change-decline. The architect records it from the meeting.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    action: z.enum(["send", "approve", "changes", "change-approve", "change-decline"]).describe('"send" for review, or the client\'s answer'),
    note: z.string().trim().max(2000).optional().describe("What the client said"),
  }),
  outputSchema: z.unknown(),
  errors,
  needsApproval: (args, ctx) => ctx?.caller === "tool" && args.action !== "send",
  run: async ({ id, action, note }, ctx) => {
    const { project: p } = await ownProject(id, ctx);
    const architect = architectOf(ctx);
    const actor = { id: architect, name: architect.split("@")[0] ?? architect };
    if (action === "send") {
      if (!canSendForReview(p)) return errors.noWrite("Choose a plan first, or wait for the current review.", "not_waiting", { statusCode: 409 });
      return { status: "review", version: await sendForReview(p, actor) };
    }
    const inPerson = await inPersonClient(p, "owner");
    if (action === "change-approve" || action === "change-decline") {
      const pending = await pendingChange(p);
      if (!pending) return errors.noWrite("There's no change waiting.", "not_waiting", { statusCode: 409 });
      let version = pending.to;
      if (action === "change-decline") {
        const options = [...(p.options ?? [])];
        if (p.chosen_option !== null) options[p.chosen_option] = pending.approved;
        await updateProject(p.id, { options });
        version = await saveVersion(p.id, pending.approved, `Change declined: back to version ${pending.from}`);
      }
      await recordApproval(p.id, version, inPerson ?? actor.name, note || "");
      const what = action === "change-approve" ? "approved" : "declined";
      await postEvent(p, actor, { type: "change", what, version: what === "approved" ? version : pending.from, cost: pending.text, note: note || null, for: inPerson }).catch(() => {});
      return { ok: true, version };
    }
    if (p.status !== "review") return errors.noWrite("There's nothing waiting for review.", "not_waiting", { statusCode: 409 });
    const version = await decide(p, actor, action === "approve" ? "approved" : "changes", note || null, inPerson);
    return { status: action === "approve" ? "approved" : "ready", version };
  },
});
