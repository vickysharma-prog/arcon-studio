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
