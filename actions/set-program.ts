import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { Room } from "../engine/design/program.ts";
import { updateProject } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { plansFromRooms } from "../server/lib/plans.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "incomplete", "does_not_fit");

// The agent's room program for a project, laid out by Studio's layout engine into plan options. The agent writes the
// rooms from the interview (get-project); the geometry is always the engine's, never the model's.
export default defineAction({
  description:
    "Replace a project's plan options with ones laid out from a room program you write from the client's interview: every room they asked for, sized for how they live (m²), with zone public/private/service and floor 0 or 1. No corridors or stairs. Only before a plan is chosen.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    rooms: z.array(Room).min(2).max(30).describe("The rooms, e.g. { name: 'Study', kind: 'office', area: 10, zone: 'private', floor: 0 }"),
    reason: z.string().min(1).max(300).describe("One sentence on what this program does better than the drafted one"),
  }),
  outputSchema: z.object({ id: z.string(), options: z.array(z.object({ index: z.number(), name: z.string(), summary: z.string().nullable() })), message: z.string() }),
  errors,
  run: async ({ id, rooms, reason }, ctx) => {
    const { project: p } = await ownProject(id, ctx);
    if (p.status === "interview") return errors.noWrite("Finish the interview first.", "incomplete", { statusCode: 409 });
    if (p.chosen_option !== null) return errors.noWrite("A plan is already chosen; propose changes to it instead.", "incomplete", { statusCode: 409 });
    const out = plansFromRooms(p, rooms);
    if ("error" in out) return errors.noWrite(out.error, "does_not_fit", { statusCode: 422 });
    await updateProject(id, { program: out.program, options: out.options });
    return {
      id,
      options: out.options.map((o, index) => ({ index, name: o.concept?.name ?? `Plan ${index + 1}`, summary: o.concept?.summary ?? null })),
      message: `${out.options.length} plan options from the new program. ${reason}`,
    };
  },
});
