import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { ChangeSchema, chosenOf, editDesign } from "../engine/workspace/apply.ts";
import { suggestions, understand } from "../engine/workspace/understand.ts";
import { architectOf, ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

// Make changes, as Studio's workspace sends them: a change from a control, words typed in the box, or an undo. Words
// Studio's reader can't place go back with suggestions; the agent beside it handles anything harder.
export default defineAction({
  description: "Apply the architect's own change from the workspace: a structured change, typed words, or an undo. For the screen; the agent proposes instead.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    change: ChangeSchema.optional(),
    text: z.string().min(1).max(300).optional(),
    undo: z.literal(true).optional(),
  }),
  outputSchema: z.unknown(),
  errors: defineActionErrors(...PROJECT_ERRORS),
  agentTool: false,
  run: async ({ id, change, text, undo }, ctx) => {
    const { project } = await ownProject(id, ctx);
    const architect = architectOf(ctx);
    const actor = { id: architect, name: architect.split("@")[0] ?? architect };
    const a = { project, role: "owner" as const };
    let out;
    if (undo) out = await editDesign(a, { undo: true }, actor);
    else {
      let c = change;
      if (!c && text) {
        const at = chosenOf(project);
        if ("status" in at) out = at;
        else {
          const read = understand(text, at.current);
          if (read) c = read;
          else out = { status: 422, body: { error: "I couldn't place that one. Try one of these, or ask the agent beside you.", code: "bad_change", suggestions: suggestions(at.current) } };
        }
      }
      if (!out) out = c ? await editDesign(a, { change: c }, actor) : { status: 400, body: { error: "That change wasn't understood.", code: "bad_change" } };
    }
    return { status: out.status, body: out.body };
  },
});
