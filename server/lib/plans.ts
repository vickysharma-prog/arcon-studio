import { fitNeeds, optionsFor, templateFor, toProgram } from "../../engine/design/program.ts";
import type { Layout, Program, Shell, SpaceType } from "../../engine/layout/schema.ts";
import type { Project } from "../../engine/project/store.ts";

// Plan options for a project, the same way Arcon Studio draws them when the model is busy: the tested program for its kind
// of space, fitted to the interview; if that won't lay out, the template as it is. Pure, so it is tested directly.

export type Drafted = { program: Program; options: Layout[] } | { error: string };

export const floorsOf = (p: Pick<Project, "space_type" | "site">) =>
  p.space_type === "hotel" ? 1 : Math.min(Math.max(p.site.floors ?? 1, 1), 2);

const shellOf = (p: Pick<Project, "site">): Shell => ({ width: p.site.width ?? 12, depth: p.site.depth ?? 10 });

export function draftPlans(p: Project): Drafted {
  const spaceType = (p.space_type ?? "house") as SpaceType;
  const floors = floorsOf(p);
  const shell = shellOf(p);
  const fitted = fitNeeds(templateFor(spaceType, floors), p.interview);
  const program = optionsFor(fitted, shell, p, 1) ? fitted : templateFor(spaceType, floors);
  const options = optionsFor(program, shell, p, 1);
  if (!options) return { error: `A ${spaceType} doesn't fit a ${shell.width.toFixed(1)} by ${shell.depth.toFixed(1)} m site. Check the site size.` };
  return { program, options };
}

/** A program the agent wrote (rooms with areas and zones), laid out the same way, or why it can't be. */
export function plansFromRooms(p: Project, rooms: Parameters<typeof toProgram>[2]): Drafted {
  const spaceType = (p.space_type ?? "house") as SpaceType;
  const program = fitNeeds(toProgram(spaceType, floorsOf(p), rooms), p.interview);
  const options = optionsFor(program, shellOf(p), p);
  if (!options) return { error: "Those rooms don't lay out on this site. Use fewer or smaller rooms, or keep the current plans." };
  return { program, options };
}
