import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { missingForDesign } from "../engine/interview/logic.ts";
import { picksOf, problems, toProject, type Answers } from "../engine/interview/script.ts";
import { postEvent } from "../engine/project/thread.ts";
import { updateProject } from "../engine/project/store.ts";
import { profileFor } from "../engine/qloo/profile.ts";
import { ownProject, PROJECT_ERRORS } from "../server/lib/projects.js";
import { signalsOf } from "../server/lib/taste.js";

const errors = defineActionErrors(...PROJECT_ERRORS, "not_waiting", "incomplete");

// The interview's last step: every answer is checked against Arcon's script and becomes the project, ready to
// design. No model runs here. The three things the client loves are kept as the client named them.
export default defineAction({
  description: "Save a finished interview to its project, so it can be designed. The answers come from the interview screen.",
  schema: z.object({
    id: z.string().min(1).describe("Project id"),
    answers: z.record(z.string(), z.unknown()).describe("Every answer, keyed by question id"),
    lang: z.enum(["en", "hi", "hinglish"]).default("en").describe('Language the interview ran in: "en", "hi" or "hinglish"'),
  }),
  outputSchema: z.object({ id: z.string() }),
  errors,
  agentTool: false,
  run: async ({ id, answers: raw, lang }, ctx) => {
    const { project, architect } = await ownProject(id, ctx);
    if (project.status !== "interview") return errors.noWrite("This project's interview is already done.", "not_waiting", { statusCode: 409 });
    const answers = raw as Answers;
    const wrong = problems(answers);
    if (wrong.length) return errors.noWrite(`Some answers are missing: ${wrong.join("; ")}.`, "incomplete", { statusCode: 400 });
    const signals = signalsOf(picksOf(answers));
    const taste = await profileFor(signals);
    const fields = toProject(answers, lang);
    const p = await updateProject(id, { ...fields, title: project.title ?? fields.title, status: "designing", taste_signals: signals, taste });
    const missing = missingForDesign(p);
    if (missing.length) {
      await updateProject(id, { status: "interview" });
      return errors.fail(`The interview left out ${missing.join(", ")}.`, "incomplete", { statusCode: 400 });
    }
    await postEvent(p, { id: architect, name: p.designed_for ?? "The client" }, { type: "answered" }).catch(() => {});
    return { id };
  },
});
