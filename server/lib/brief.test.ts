import { describe, expect, it } from "vitest";

import { allowedSources, Brief, keepHonest } from "../../engine/design/brief";
import { briefOf } from "./brief";
import { choiceSignals, LOOKS } from "./taste";

describe("briefOf", () => {
  it("writes a valid brief for every look", () => {
    for (const look of Object.keys(LOOKS)) {
      const b = briefOf(look, ["cozy"], "Priya Mehta");
      expect(Brief.safeParse(b).success, look).toBe(true);
    }
  });
  it("credits only the client's own choices, so keepHonest drops nothing", () => {
    const b = briefOf("scandi", ["airy", "green"], "Priya")!;
    const p = { taste_signals: choiceSignals("scandi", ["airy", "green"]), taste: null } as unknown as Parameters<typeof allowedSources>[0];
    expect(keepHonest(b, allowedSources(p))).toEqual({ ...b, palette: b.palette.map((c) => ({ ...c, hex: c.hex.toLowerCase() })) });
    expect(b.summary).toMatch(/Priya chose a scandinavian look, calm and airy and green and natural/);
    expect(b.plants.some((x) => x.name === "Areca palm")).toBe(true);
  });
  it("is null without a look", () => expect(briefOf(undefined, ["cozy"], null)).toBeNull());
});
