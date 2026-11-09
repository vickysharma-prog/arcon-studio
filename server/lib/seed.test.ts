import { getDbExec } from "@agent-native/core/db";
import { beforeAll, describe, expect, it } from "vitest";

import { pendingChange } from "../../engine/project/change.ts";
import { getProject, listVersions } from "../../engine/project/store.ts";
import { lastApproval } from "../../engine/project/thread.ts";
import { MIGRATIONS } from "../plugins/db.ts";
import { listFor } from "./changes.js";
import { SAMPLES, seedStudio } from "./seed.js";
import "../db/index.js";

// The sample studio, built on an in-memory Postgres the way real projects are built.

beforeAll(async () => {
  const exec = getDbExec();
  for (const m of MIGRATIONS) for (const stmt of m.sql.split(";").map((s) => s.trim()).filter(Boolean)) await exec.execute(stmt);
});

describe("seedStudio", () => {
  it("builds every sample at its stage, once", async () => {
    const made = (await seedStudio("demo@example.com"))!;
    expect(Object.keys(made)).toHaveLength(SAMPLES.length);
    const status = async (title: string) => (await getProject(made[title]!))!;

    expect((await status("Meera's studio")).status).toBe("interview");
    const plans = await status("Malhotra villa");
    expect(plans.options?.length).toBeGreaterThan(1);
    expect(plans.chosen_option).toBeNull();
    expect(plans.brief).not.toBeNull();

    const priya = await status("Priya's house");
    expect(priya.chosen_option).toBe(0);
    expect((await listVersions(priya.id)).length).toBeGreaterThan(1);
    const proposals = await listFor("demo@example.com", priya.id);
    expect(proposals.some((c) => c.status === "pending" && c.proposedBy === "agent")).toBe(true);

    expect((await status("Kapoor apartment")).status).toBe("review");
    const cafe = await status("Ananya's café");
    expect(cafe.status).toBe("approved");
    expect(await lastApproval(cafe.id)).not.toBeNull();
    expect(await pendingChange(cafe)).toBeNull();

    expect(await seedStudio("demo@example.com")).toBeNull();
  });
});
