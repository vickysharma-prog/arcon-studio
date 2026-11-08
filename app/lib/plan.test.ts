import { describe, expect, it } from "vitest";
import { ago, areaText, diffPlan, floorsOf, type Space } from "./plan";

const room = (id: string, x: number, w: number, extra: Partial<Space> = {}): Space => ({ id, name: id, kind: "bedroom", floor: 0, area: w * 3, rect: { x, y: 0, w, h: 3 }, zone: "private", ...extra });

describe("diffPlan", () => {
  it("finds added, removed and changed rooms", () => {
    const before = [room("a", 0, 3), room("b", 3, 3), room("c", 6, 3)];
    const after = [room("a", 0, 3), room("b", 3, 4), room("d", 7, 2)];
    const d = diffPlan(before, after);
    expect([...d.added]).toEqual(["d"]);
    expect([...d.removed]).toEqual(["c"]);
    expect([...d.changed]).toEqual(["b"]);
  });
  it("counts a rename and a kitchen opening as changes, and ignores rounding", () => {
    const before = [room("a", 0, 3), room("k", 3, 3, { open: false })];
    const after = [room("a", 0.01, 3, { name: "Den" }), room("k", 3, 3, { open: true })];
    expect([...diffPlan(before, after).changed].sort()).toEqual(["a", "k"]);
    expect(diffPlan(before, before).changed.size).toBe(0);
  });
});

describe("areaText", () => {
  it("speaks the project's units", () => {
    expect(areaText(12.34, "metric")).toBe("12.3 m²");
    expect(areaText(10, "imperial")).toBe("108 sq ft");
  });
});

describe("floorsOf and ago", () => {
  it("lists floors in order", () => expect(floorsOf([room("a", 0, 1, { floor: 1 }), room("b", 0, 1)])).toEqual([0, 1]));
  it("reads Postgres and ISO times", () => {
    const now = Date.parse("2026-11-08T12:00:00Z");
    expect(ago("2026-11-08T11:58:00Z", now)).toBe("2 min ago");
    expect(ago("2026-11-08 09:00:00", now)).toBe("3 h ago");
    expect(ago("2026-11-08 11:59:50+00", now)).toBe("just now");
  });
});
