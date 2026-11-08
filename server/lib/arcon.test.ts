import { describe, expect, it } from "vitest";
import { codeOf } from "./arcon.js";

describe("codeOf", () => {
  it("keeps a code Arcon gave when Studio knows it", () => {
    expect(codeOf(409, { code: "stale" })).toBe("stale");
    expect(codeOf(400, { code: "no_plan" })).toBe("no_plan");
    expect(codeOf(409, { code: "done" })).toBe("done");
  });
  it("falls back on the status when the code is missing or unknown", () => {
    expect(codeOf(401, null)).toBe("not_connected");
    expect(codeOf(404, { code: "weird" })).toBe("not_found");
    expect(codeOf(409, {})).toBe("stale");
    expect(codeOf(422, null)).toBe("does_not_fit");
    expect(codeOf(400, null)).toBe("bad_change");
    expect(codeOf(500, null)).toBe("arcon_unavailable");
  });
});
