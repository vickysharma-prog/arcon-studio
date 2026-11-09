import type { Project } from "../../engine/project/store.ts";

// The project as Studio's own screens read it (the shape its /api/projects/:id returned), for the screens ported into
// Studio. The architect is always the owner here, every step is open, and the client is the person it's designed for.
export function projectView(p: Project) {
  const { owner_id: _o, guest_id: _g, ...rest } = p;
  return {
    ...rest,
    mode: "pro" as const,
    role: "owner" as const,
    unlocked: true,
    whose: p.designed_for ?? null,
    unread: 0,
    pros: ["architect"],
    studio: null,
    ownerKind: "architect",
    request: null,
  };
}
