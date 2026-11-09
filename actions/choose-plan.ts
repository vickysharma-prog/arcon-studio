import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { chooseOption } from "../engine/design/run.ts";
import { postEvent } from "../engine/project/thread.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "incomplete");

// The architect picks one of the plan options; it becomes version 1 of the design.
export default defineAction({
  description: "Choose one of a project's plan options (index from get-project). It becomes the first version of the design.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    option: z.number().int().min(0).max(5).describe("Index of the plan option, from 0"),
  }),
  outputSchema: z.object({ id: z.string(), name: z.string() }),
  errors,
  run: async ({ id, option }, ctx) => {
    const { project, architect } = await ownProject(id, ctx);
    if (project.chosen_option !== null) return errors.noWrite("A plan is already chosen.", "incomplete", { statusCode: 409 });
    const layout = project.options?.[option];
    if (!layout) return errors.noWrite(`There is no plan option ${option + 1}.`, "incomplete", { statusCode: 404 });
    const p = await chooseOption(id, option);
    const name = layout.concept?.name ?? `Plan ${option + 1}`;
    await postEvent(p, { id: architect, name: architect.split("@")[0] ?? architect }, { type: "chose", plan: name }).catch(() => {});
    return { id, name };
  },
});
