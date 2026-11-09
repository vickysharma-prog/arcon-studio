import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { missingForDesign } from "../engine/interview/logic.ts";
import { updateProject } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { draftPlans } from "../server/lib/plans.js";
import { briefOf } from "../server/lib/brief.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "incomplete", "does_not_fit");

// Plan options from a finished interview, at once and without a model: Arcon's tested room program for this kind
// of space, fitted to what the client said (bedrooms, a study, a guest room), laid out by Arcon's layout engine in
// two or three different ways. The agent can then write a better program with set-program.
export default defineAction({
  description:
    "Draw plan options for a project whose interview is done: Arcon's room program for the space, fitted to the interview, laid out two or three ways. Replaces any options not yet chosen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({ id: z.string(), options: z.array(z.object({ index: z.number(), name: z.string(), summary: z.string().nullable() })) }),
  errors,
  run: async ({ id }, ctx) => {
    const { project: p } = await ownProject(id, ctx);
    if (p.status === "interview") return errors.noWrite("Finish the interview first.", "incomplete", { statusCode: 409 });
    // The brief from the client's own look and feel, unless the agent already wrote one.
    const style = (p.interview.style ?? {}) as { look?: unknown; feel?: unknown };
    const brief = p.brief ?? briefOf(style.look, style.feel, p.designed_for ?? null);
    const summary = (options: typeof p.options) => (options ?? []).map((o, index) => ({ index, name: o.concept?.name ?? `Plan ${index + 1}`, summary: o.concept?.summary ?? null }));
    if (p.chosen_option !== null) {
      // A plan chosen before the brief existed only needs its brief; the plans stay as they are.
      if (!p.brief && brief) {
        await updateProject(id, { brief });
        return { id, options: summary(p.options) };
      }
      return errors.noWrite("A plan is already chosen; change it in the design instead.", "incomplete", { statusCode: 409 });
    }
    const missing = missingForDesign(p);
    if (missing.length) return errors.noWrite(`Still needed: ${missing.join(", ")}.`, "incomplete", { statusCode: 400 });
    const out = draftPlans(p);
    if ("error" in out) return errors.noWrite(out.error, "does_not_fit", { statusCode: 422 });
    await updateProject(id, { program: out.program, options: out.options, ...(brief && !p.brief ? { brief } : {}) });
    return { id, options: summary(out.options) };
  },
});
