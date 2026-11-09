import { fail } from "@agent-native/core/action";

import { estimate, isNewBuild, marketOf, projectTier } from "../../engine/budget/costs.ts";
import type { Brief } from "../../engine/design/brief.ts";
import { sayCredit, tasteTrail } from "../../engine/design/trail.ts";
import { isLocked } from "../../engine/project/change.ts";
import { getProject, type Project } from "../../engine/project/store.ts";
import { budgetView, designView } from "../../engine/studio/view.ts";
import { chosenOf, versionOf } from "../../engine/workspace/apply.ts";

// What every project action needs: the signed-in architect, their project (never anyone else's), and the reads the
// UI and the agent share, worked out by Studio's engine on Studio's own data.

export const PROJECT_ERRORS = ["not_signed_in", "not_found", "no_plan", "done", "stale", "does_not_fit", "approved", "nothing_to_undo", "bad_change"] as const;
export type ProjectError = (typeof PROJECT_ERRORS)[number];

/** The signed-in architect. */
export function architectOf(ctx?: { userEmail?: string }): string {
  const email = ctx?.userEmail;
  if (!email) fail("Sign in to Studio first.", { errorCode: "not_signed_in", statusCode: 401 });
  return email;
}

/** The architect's own project, or a not-found failure (another architect's project reads as missing). */
export async function ownProject(id: string, ctx?: { userEmail?: string }): Promise<{ project: Project; architect: string }> {
  const architect = architectOf(ctx);
  const project = await getProject(id).catch(() => null);
  if (!project || project.owner_id !== architect) fail("That project isn't one of yours.", { errorCode: "not_found", statusCode: 404 });
  return { project, architect };
}

/** Engine outcomes (status + body with a code) as an action failure. */
export function failOutcome(o: { status: number; body: Record<string, unknown> }): never {
  const code = typeof o.body.code === "string" && (PROJECT_ERRORS as readonly string[]).includes(o.body.code) ? (o.body.code as ProjectError) : "bad_change";
  fail(String(o.body.error ?? "That didn't work."), { errorCode: code, statusCode: o.status, ...(typeof o.body.version === "number" ? { details: { version: o.body.version } } : {}) });
}

/** The chosen plan as Studio shows it: rooms, sizes, concept and reasons, the version it's at. */
export async function readDesign(p: Project) {
  const at = chosenOf(p);
  if ("status" in at) failOutcome(at);
  const version = await versionOf(p.id);
  const view = designView(p, at.current, "owner", p.status !== "done", version, isLocked(p.status), "");
  return { ...view, url: `/projects/${p.id}/3d` };
}

/** The cost to build the chosen plan, in the project's currency, or null before a plan is chosen. */
export function readBudget(p: Project) {
  const at = chosenOf(p);
  if ("status" in at) return null;
  return budgetView(estimate(at.current, projectTier(p), marketOf(p.site?.location), isNewBuild(p), p.site?.location));
}

/** Why the design is the way it is: the plan's reasons and each taste choice with what it came from. */
export function readReasons(p: Project) {
  const at = chosenOf(p);
  const plan = "status" in at ? null : at.current;
  const trail = tasteTrail(p, (p.brief ?? null) as Brief | null, plan);
  return {
    plan: plan?.concept ? { name: plan.concept.name, why: plan.concept.why } : null,
    choices: trail.choices.map((c) => ({ what: c.what, choice: c.choice, from: c.from.map(sayCredit) })),
    loves: trail.loves.map((l) => ({ name: l.name, kind: l.kind, gave: l.gave })),
  };
}
