import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { LEFT_OUT, ROUTES } from "./api";

// Every /api/... route Arcon's screens call is either answered by a Studio action or deliberately left out, so a
// screen never reaches for a route nobody answers.

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.tsx?$/.test(f) && !/\.test\./.test(f) ? [p] : [];
  });

const calls = files(path.join(__dirname)).flatMap((f) => {
  const s = readFileSync(f, "utf8");
  return [...s.matchAll(/apiFetch\(\s*[`"'](\/api\/[^`"']*)[`"']\s*(?:,\s*\{\s*method:\s*"(\w+)")?/g)].map((m) => ({
    file: path.basename(f),
    // a ${...} right after a word is a query string built in place (shopping${tier ? ...}); one after a slash is an id
    path: m[1]!.replace(/([^/])\$\{.*$/, "$1").replace(/\$\{[^}]*\}/g, "x").split("?")[0]!,
    method: (m[2] ?? "GET").toUpperCase(),
  }));
});

describe("Arcon's routes in Studio", () => {
  it("finds the screens' calls", () => expect(calls.length).toBeGreaterThan(20));
  it.each(calls)("$method $path ($file) is answered or left out on purpose", ({ path: p, method }) => {
    const routed = ROUTES.some((r) => r.method === method && r.pattern.test(p));
    const left = LEFT_OUT.some((r) => r.test(p));
    expect(routed || left).toBe(true);
  });
});
