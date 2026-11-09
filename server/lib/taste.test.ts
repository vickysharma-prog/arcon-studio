import { describe, expect, it } from "vitest";

import { signalsOf, slug } from "./taste";

describe("signalsOf", () => {
  it("keeps each pick on its layer with a stable id", () => {
    const s = signalsOf([
      { slot: "place", id: "x", name: "Café Lota" },
      { slot: "brand", id: "y", name: "Good Earth" },
      { slot: "media", id: "z", name: "Interstellar" },
    ]);
    expect(s.map((x) => [x.layer, x.entityId])).toEqual([
      [1, "studio:place:café-lota"],
      [2, "studio:brand:good-earth"],
      [3, "studio:media:interstellar"],
    ]);
  });
  it("counts the same pick once and skips blanks", () => {
    const s = signalsOf([
      { slot: "brand", id: "a", name: "Muji" },
      { slot: "brand", id: "b", name: " muji " },
      { slot: "media", id: "c", name: "  " },
    ]);
    expect(s).toHaveLength(1);
  });
  it("slugs any script", () => expect(slug("दिल्ली Haat!")).toBe("दिल्ली-haat"));
});

describe("profileOf", () => {
  it("styles each client in the look they chose", async () => {
    const { styleOf } = await import("../../engine/three/materials.ts");
    const { profileOf: profile, LOOKS: looks } = await import("./taste");
    for (const look of Object.keys(looks)) expect(styleOf(profile(look, []), "").style).toBe(look);
  });
  it("credits only the choices themselves, and skips unknown ones", async () => {
    const { profileOf: profile, choiceSignals } = await import("./taste");
    const p = profile("boho", ["green", "nonsense"]);
    expect(new Set(p.tags.flatMap((t) => t.sources.map((s) => s.name)))).toEqual(new Set(["Boho look", "Green and natural"]));
    expect(choiceSignals("nope", ["airy"]).map((s) => s.name)).toEqual(["Calm and airy"]);
  });
});
