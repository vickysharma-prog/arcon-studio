import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { ARCON_ERRORS, arcon } from "../server/lib/arcon.js";
import { Reasons } from "../server/lib/shapes.js";

export default defineAction({
  description:
    "Read why the design is the way it is: the plan's reasons from the person's interview, each style, colour and material choice with the loved things it came from, and what each loved thing gave. Explain design decisions only from these facts.",
  schema: z.object({ id: z.string().min(1).describe("Arcon project id") }),
  outputSchema: Reasons,
  errors: defineActionErrors(...ARCON_ERRORS),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ id }) => arcon<z.infer<typeof Reasons>>(`/projects/${encodeURIComponent(id)}/reasons`),
});
