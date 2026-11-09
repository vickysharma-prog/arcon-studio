import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { allowedSources, Brief, keepHonest, keepStyle, revealedStyle } from "../engine/design/brief.ts";
import { updateProject } from "../engine/project/store.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "incomplete");

// The design brief in words a client reads: a style name, the feel, a palette, materials, light and plants. The
// agent writes it from the interview and what the client loves; every "from" may only name something the client
// actually said, and anything else is dropped before it is saved.
export default defineAction({
  description:
    "Save the design brief for a project: style name (2-3 words), a two-sentence summary, 4-6 palette colours (name, #hex, role base/accent/wood/metal/green/textile), 3-6 materials with where they go, lighting mood and fixtures, 2-6 plants. Each 'from' lists only things the client named in the interview (get-project shows them).",
  schema: z.object({ id: z.string().min(1).describe("Project id"), brief: Brief }),
  outputSchema: z.object({ id: z.string(), name: z.string(), dropped: z.number().describe("Credits removed because the client never named them") }),
  errors,
  run: async ({ id, brief }, ctx) => {
    const { project: p } = await ownProject(id, ctx);
    if (p.status === "interview") return errors.noWrite("Finish the interview first.", "incomplete", { statusCode: 409 });
    const honest = keepHonest(brief, allowedSources(p));
    const count = (b: Brief) => b.palette.flatMap((c) => c.from).length + b.materials.flatMap((m) => m.from).length + b.lighting.from.length;
    const saved = { ...honest, name: keepStyle(honest.name, revealedStyle(p)) };
    await updateProject(id, { brief: saved });
    return { id, name: saved.name, dropped: count(brief) - count(honest) };
  },
});
