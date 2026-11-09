import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { editDesign } from "../engine/workspace/apply.ts";
import { getOne, move, stalePending } from "../server/lib/changes.js";
import { architectOf, failOutcome, ownProject, PROJECT_ERRORS, readBudget } from "../server/lib/projects.js";
import { ChangeRow } from "../server/lib/shapes.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "not_pending");

// Applies a pending proposal once, and only to the version of the design it was worked out on. A click in Studio
// runs it; the agent can only ask, and the architect approves each call.
export default defineAction({
  description:
    "Apply a pending proposal to the design. Needs the architect's approval. It applies only if the design hasn't changed since the proposal; otherwise it is marked out of date and nothing is saved.",
  schema: z.object({ changeId: z.string().min(1).describe("Proposal id from propose-change or list-changes") }),
  outputSchema: z.object({ change: ChangeRow, message: z.string(), budget: z.string().nullable() }),
  errors,
  needsApproval: true,
  run: async ({ changeId }, ctx) => {
    const architect = architectOf(ctx);
    const found = await getOne(architect, changeId);
    if (!found) return errors.noWrite("No such proposal.", "not_pending", { statusCode: 404 });
    const { project } = await ownProject(found.projectId, ctx);
    const claimed = await move(architect, changeId, "pending", "applying");
    if (!claimed) return errors.noWrite(`This proposal is already ${found.status}.`, "not_pending", { statusCode: 409 });
    if (claimed.kind !== "change" || !claimed.change) {
      await move(architect, changeId, "applying", "failed", { note: "Only proposed changes can be applied." });
      return errors.fail("Only proposed changes can be applied.", "not_pending", { statusCode: 409 });
    }
    const actor = { id: architect, name: `${architect.split("@")[0]}'s agent` };
    const out = await editDesign({ project, role: "owner" }, { change: claimed.change }, actor, claimed.baseVersion).catch((e: unknown) => ({
      status: 500,
      body: { error: e instanceof Error ? e.message : "That didn't save.", code: "bad_change" } as Record<string, unknown>,
    }));
    if (out.status !== 200) {
      await move(architect, changeId, "applying", out.body.code === "stale" ? "stale" : "failed", { note: String(out.body.error ?? "") });
      failOutcome(out);
    }
    const { note, version } = out.body as { note: string; version: number };
    const done = (await move(architect, changeId, "applying", "applied", { resultVersion: version, note }))!;
    await stalePending(architect, project.id);
    // The cost after the change, so whoever approved hears the new figure, not the one read before it.
    const budget = readBudget((await ownProject(project.id, ctx)).project)?.text ?? null;
    return { change: done, message: budget ? `${note} Cost to build is now ${budget}.` : note, budget };
  },
});
