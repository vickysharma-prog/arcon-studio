import { callAction } from "@agent-native/core/client/hooks";

// Studio's screens talk to /api/... routes. In Studio every one of those is an Agent-Native action, so the same
// screens run unchanged on Studio's own engine and data, and the agent reads and writes through the same actions.
// apiFetch answers like fetch (a Response with Studio's JSON and status) for each route Studio keeps; the routes
// Studio leaves out (the builder's site, team invites, payments to unlock, outside taste services) answer 404.

type Call = { action: string; method?: "GET" | "POST"; args: Record<string, unknown>; then?: (out: unknown, args: Record<string, unknown>) => Promise<unknown> };
type Route = { method: string; pattern: RegExp; to: (m: RegExpMatchArray, body: Record<string, unknown>, query: URLSearchParams) => Call };

const view = async (_: unknown, args: Record<string, unknown>) => callAction("project-view", { id: String(args.id) }, { method: "GET" });

export const ROUTES: Route[] = [
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)$/, to: (m) => ({ action: "project-view", method: "GET", args: { id: m[1] } }) },
  { method: "DELETE", pattern: /^\/api\/projects\/([^/]+)$/, to: (m) => ({ action: "delete-project", args: { id: m[1] } }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/design$/, to: (m) => ({ action: "design-project", args: { id: m[1] }, then: view }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/choose$/, to: (m, b) => ({ action: "choose-plan", args: { id: m[1], option: b.option }, then: view }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/tour$/, to: (m) => ({ action: "finish-tour", args: { id: m[1] } }) },
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)\/budget$/, to: (m) => ({ action: "budget-tier", method: "GET", args: { id: m[1] } }) },
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)\/shopping$/, to: (m, _b, q) => ({ action: "shopping-list", method: "GET", args: { id: m[1], ...(q.get("tier") ? { tier: q.get("tier") } : {}) } }) },
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)\/moodboard$/, to: (m) => ({ action: "moodboard", method: "GET", args: { id: m[1] } }) },
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)\/green$/, to: (m) => ({ action: "green-read", method: "GET", args: { id: m[1] } }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/green$/, to: (m, b) => ({ action: "green-save", args: { id: m[1], ticked: b.ticked } }) },
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)\/edit$/, to: (m) => ({ action: "list-versions", method: "GET", args: { id: m[1] } }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/edit$/, to: (m, b) => ({ action: "edit-design", args: { id: m[1], ...b } }) },
  { method: "GET", pattern: /^\/api\/projects\/([^/]+)\/thread$/, to: (m) => ({ action: "thread-read", method: "GET", args: { id: m[1] } }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/thread$/, to: (m, b) => ({ action: "post-message", args: { id: m[1], body: b.body, room: b.room ?? null } }) },
  { method: "POST", pattern: /^\/api\/projects\/([^/]+)\/review$/, to: (m, b) => ({ action: "review-design", args: { id: m[1], action: b.action, ...(b.note ? { note: b.note } : {}) } }) },
];

/** Routes Studio's screens may call that Studio deliberately doesn't have. */
export const LEFT_OUT = [
  /\/api\/projects\/[^/]+\/(art|neighbourhood|unlock|team|fees|import|quote|site|movein|handover)(\/|$|\?)/,
  /\/api\/projects\/[^/]+\/thread\/files/,
  /\/api\/(pros|taste|quiz|city|shell)(\/|$|\?)/,
];

const json = (body: unknown, status: number) => new Response(JSON.stringify(body ?? null), { status, headers: { "content-type": "application/json" } });

export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = new URL(input, "http://studio.local");
  const method = (init.method ?? "GET").toUpperCase();
  const route = ROUTES.find((r) => r.method === method && r.pattern.test(url.pathname));
  if (!route) {
    if (LEFT_OUT.some((p) => p.test(url.pathname + url.search))) return json({ error: "Not in Studio." }, 404);
    throw new Error(`Arcon Studio route not mapped in Studio: ${method} ${url.pathname}`);
  }
  let body: Record<string, unknown> = {};
  if (typeof init.body === "string" && init.body) body = JSON.parse(init.body) as Record<string, unknown>;
  const call = route.to(url.pathname.match(route.pattern)!, body, url.searchParams);
  try {
    let out: unknown = await callAction(call.action as never, call.args as never, call.method ? { method: call.method } : undefined);
    if (call.then) out = await call.then(out, call.args);
    // An action that answers with Studio's own outcome ({ status, body }) keeps that status.
    if (out && typeof out === "object" && "status" in out && "body" in out && typeof (out as { status: unknown }).status === "number") {
      const o = out as { status: number; body: unknown };
      return json(o.body, o.status);
    }
    return json(out, method === "POST" && call.action === "post-message" ? 201 : 200);
  } catch (e) {
    const err = e as { status?: number; actionMessage?: string; message?: string; errorCode?: string };
    return json({ error: err.actionMessage ?? err.message ?? "That didn't work.", code: err.errorCode }, err.status ?? 500);
  }
}
