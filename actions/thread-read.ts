import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { pendingChange } from "../engine/project/change.ts";
import { canSendForReview } from "../engine/project/review.ts";
import { inPersonClient, lastApproval, listMessages } from "../engine/project/thread.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

// The project thread as Arcon's thread screen reads it: notes and events, the review state, and a change waiting
// on an approved design. The architect posts, sends for review and records the client's answer.
export default defineAction({
  description: "Read a project's thread: notes, events, whether it can go to the client for review, and any change waiting on an approved design.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.unknown(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => {
    const { project: p, architect } = await ownProject(id, ctx);
    const [messages, approval, inPerson, pending] = await Promise.all([listMessages(p.id), lastApproval(p.id), inPersonClient(p, "owner"), pendingChange(p)]);
    return {
      messages,
      me: architect,
      role: "owner",
      teamChannel: false,
      canPost: true,
      status: p.status,
      canReview: canSendForReview(p),
      canDecide: p.status === "review",
      change: pending ? { from: pending.from, to: pending.to, notes: pending.notes, cost: pending.text, canDecide: true } : null,
      inPerson,
      approval: approval && p.designed_for ? { ...approval, by: `${p.designed_for} (in person)` } : approval,
    };
  },
});
