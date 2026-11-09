import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { missingForDesign } from "../engine/interview/logic.ts";
import { designView } from "../engine/studio/view.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { Room } from "../server/lib/shapes.js";

// A project at any stage: what the interview has, whether plans are drawn and which one is chosen. The interview
// screen and the plan options read this; get-design reads the chosen plan itself.
export default defineAction({
  description:
    "Read a project at any stage: title, client, type, city, site size, status, the interview answers so far, what is still missing before it can be designed, and the plan options (concept names and reasons) with which one is chosen.",
  schema: z.object({ id: z.string().min(1).describe("Project id") }),
  outputSchema: z.object({
    id: z.string(),
    title: z.string(),
    clientName: z.string().nullable(),
    spaceType: z.string().nullable(),
    location: z.string().nullable(),
    units: z.enum(["imperial", "metric"]),
    site: z.object({ width: z.number().nullable(), depth: z.number().nullable(), floors: z.number().nullable() }),
    status: z.string(),
    interview: z.record(z.string(), z.unknown()),
    missing: z.array(z.string()),
    hasBrief: z.boolean(),
    options: z.array(
      z.object({
        index: z.number(),
        name: z.string(),
        summary: z.string().nullable(),
        why: z.array(z.string()),
        /** Every space on the option, for drawing it. */
        spaces: z.array(Room),
        shell: z.object({ width: z.number(), depth: z.number() }),
        area: z.number(),
      }),
    ),
    chosenOption: z.number().nullable(),
  }),
  errors: defineActionErrors(...PROJECT_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }, ctx) => {
    const { project: p } = await ownProject(id, ctx);
    return {
      id: p.id,
      title: p.title ?? "Untitled project",
      clientName: p.designed_for ?? null,
      spaceType: p.space_type,
      location: p.site.location ?? null,
      units: p.site.units ?? "metric",
      site: { width: p.site.width ?? null, depth: p.site.depth ?? null, floors: p.site.floors ?? null },
      status: p.status,
      interview: p.interview,
      missing: p.status === "interview" ? [] : missingForDesign(p),
      hasBrief: !!p.brief,
      options: (p.options ?? []).map((o, index) => {
        const v = designView(p, o, "owner", false, 0, false, "");
        return {
          index,
          name: o.concept?.name ?? `Plan ${index + 1}`,
          summary: o.concept?.summary ?? null,
          why: o.concept?.why ?? [],
          spaces: v.spaces,
          shell: v.shell,
          area: Math.round(v.rooms.reduce((a, r) => a + r.area, 0)),
        };
      }),
      chosenOption: p.chosen_option,
    };
  },
});
