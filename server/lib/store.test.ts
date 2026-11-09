import { getDbExec } from "@agent-native/core/db";
import { beforeAll, describe, expect, it } from "vitest";

import { ENGINE_MIGRATIONS } from "../../engine/db/schema.ts";
import { approvedVersion, pendingChange } from "../../engine/project/change.ts";
import { createProject, getProject, latestVersion, saveInterview, saveVersion, undoVersion, updateProject } from "../../engine/project/store.ts";
import { decide, lastApproval, listMessages, postMessage } from "../../engine/project/thread.ts";
import type { Layout } from "../../engine/layout/schema.ts";
import "../db/index.js";

// The architect's store on a real (in-memory) Postgres: the same functions Arcon's engine calls.

const layout = (w: number) => ({ shell: { width: w, depth: 8 }, floors: [{ level: 0, spaces: [] }] }) as unknown as Layout;

beforeAll(async () => {
  const exec = getDbExec();
  for (const stmt of ENGINE_MIGRATIONS[0]!.sql.split(";").map((s) => s.trim()).filter(Boolean)) await exec.execute(stmt);
});

describe("project store", () => {
  it("creates a project for its architect and reads it back in the engine's shape", async () => {
    const p = await createProject({ owner_id: "ar@example.com", title: "Mehta house", space_type: "house", designed_for: "Priya Mehta" });
    expect(p.owner_id).toBe("ar@example.com");
    expect(p.mode).toBe("pro");
    expect(p.status).toBe("interview");
    expect(p.interview).toEqual({});
    expect((await getProject(p.id)).title).toBe("Mehta house");
  });

  it("refuses a project without an architect", async () => {
    await expect(createProject({ title: "x" })).rejects.toThrow(/architect/);
  });

  it("builds the interview up section by section", async () => {
    const p = await createProject({ owner_id: "ar@example.com" });
    await saveInterview(p.id, "household", { adults: 2 });
    const q = await saveInterview(p.id, "household", { kids: 1 });
    expect(q.interview).toEqual({ household: { adults: 2, kids: 1 } });
  });

  it("numbers versions, steps back one, and won't undo the first", async () => {
    const p = await createProject({ owner_id: "ar@example.com" });
    expect(await saveVersion(p.id, layout(10), "Chose this plan")).toBe(1);
    expect(await saveVersion(p.id, layout(12), "Made the kitchen bigger")).toBe(2);
    expect((await latestVersion(p.id))?.version).toBe(2);
    const back = await undoVersion(p.id);
    expect(back?.version).toBe(1);
    expect(await undoVersion(p.id)).toBeNull();
  });

  it("records the client's approval and shows a later change as waiting", async () => {
    const p = await createProject({ owner_id: "ar@example.com", designed_for: "Priya Mehta", status: "review", chosen_option: 0, options: [layout(10)] });
    await saveVersion(p.id, layout(10), "Chose this plan");
    await decide(await getProject(p.id), { id: "ar@example.com", name: "Asha" }, "approved", "Looks right", "Priya");
    expect(await approvedVersion(p.id)).toBe(1);
    expect((await lastApproval(p.id))?.by).toBe("Priya");
    const approved = await getProject(p.id);
    expect(approved.status).toBe("approved");
    await saveVersion(p.id, layout(11), "Made the study bigger");
    const waiting = await pendingChange(await updateProject(p.id, {}));
    expect(waiting?.from).toBe(1);
    expect(waiting?.to).toBe(2);
    expect(waiting?.notes).toEqual(["Made the study bigger"]);
  });

  it("keeps the thread in order, events and notes together", async () => {
    const p = await createProject({ owner_id: "ar@example.com" });
    await postMessage(p, { name: "Asha" }, { body: "Client wants a bigger study." });
    await postMessage(p, { name: "Asha's agent" }, { body: "Proposed a bigger study.", role: "agent" });
    const thread = await listMessages(p.id);
    expect(thread.map((m) => m.body)).toEqual(["Client wants a bigger study.", "Proposed a bigger study."]);
    expect(thread[1]?.author_role).toBe("agent");
  });
});
