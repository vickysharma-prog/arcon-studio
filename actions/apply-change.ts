import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon, ownerOf } from "../server/lib/arcon.js";
import { getOne, move, stalePending } from "../server/lib/changes.js";
import { ChangeRow } from "../server/lib/shapes.js";

type Applied = { note: string; version: number; request: { from: number; cost: string } | null };

const errors = defineActionErrors(...ARCON_ERRORS, "not_pending");

// Applies a pending proposal to the Arcon design, once, and only if the design is still at the version the proposal
// was worked out on. A person's click runs it; the agent can only ask, and the person approves each call.
export default defineAction({
  description:
    "Apply a pending proposal to the Arcon design. Needs the person's approval. It applies only if the design hasn't changed since the proposal; otherwise it is marked stale and nothing is saved.",
  schema: z.object({ changeId: z.string().min(1).describe("Proposal id from propose-change or list-changes") }),
  outputSchema: z.object({ change: ChangeRow, message: z.string(), budget: z.string().nullable() }),
  errors,
  needsApproval: true,
  run: async ({ changeId }, ctx) => {
    const owner = ownerOf(ctx);
    const claimed = await move(owner, changeId, "pending", "applying");
    if (!claimed) {
      const now = await getOne(owner, changeId);
      return errors.noWrite(now ? `This proposal is already ${now.status}.` : "No such proposal.", "not_pending", { statusCode: now ? 409 : 404 });
    }
    if (claimed.kind !== "change" || !claimed.change) {
      await move(owner, changeId, "applying", "failed", { note: "Only proposed changes can be applied." });
      return errors.fail("Only proposed changes can be applied.", "not_pending", { statusCode: 409 });
    }
    try {
      const out = await arcon<Applied>(`/projects/${encodeURIComponent(claimed.projectId)}/change`, {
        method: "POST",
        body: { change: claimed.change, baseVersion: claimed.baseVersion, by: "agent" },
      });
      const note = out.request ? `${out.note} Sent to the owner to approve (${out.request.cost}).` : out.note;
      const done = (await move(owner, changeId, "applying", "applied", { resultVersion: out.version, note }))!;
      await stalePending(owner, claimed.projectId);
      // The cost after the change, so whoever approved hears the new figure, not the one read before it.
      const budget = await arcon<{ text: string }>(`/projects/${encodeURIComponent(claimed.projectId)}/budget`).catch(() => null);
      return { change: done, message: budget ? `${note} Cost to build is now ${budget.text}.` : note, budget: budget?.text ?? null };
    } catch (e) {
      const code = (e as { errorCode?: string }).errorCode;
      // Arcon didn't answer: the proposal goes back to waiting, so approving again is safe.
      const to = code === "arcon_unavailable" || code === "connection_unavailable" ? "pending" : code === "stale" ? "stale" : "failed";
      await move(owner, changeId, "applying", to, { note: e instanceof Error ? e.message : null });
      throw e;
    }
  },
});

