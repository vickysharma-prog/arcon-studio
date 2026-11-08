// Pure helpers for drawing an Arcon plan in Studio. Geometry is in metres, as Arcon keeps it.

export type Space = { id: string; name: string; kind: string; floor: number; area: number; rect: { x: number; y: number; w: number; h: number }; zone: string; open?: boolean | undefined };

export const ADDABLE = [
  { kind: "office", name: "Study" },
  { kind: "guest-room", name: "Guest room" },
  { kind: "bedroom", name: "Bedroom" },
  { kind: "bath", name: "Bathroom" },
  { kind: "prayer", name: "Prayer room" },
  { kind: "gym", name: "Gym" },
  { kind: "media", name: "Media room" },
  { kind: "storage", name: "Store room" },
  { kind: "laundry", name: "Laundry" },
  { kind: "meeting", name: "Meeting room" },
] as const;

/** Arcon's own step sizes for bigger and smaller. */
export const BIGGER = 1.25;
export const SMALLER = 0.8;

const SQFT_PER_M2 = 10.7639;

export function areaText(m2: number, units: "imperial" | "metric"): string {
  return units === "imperial" ? `${Math.round(m2 * SQFT_PER_M2)} sq ft` : `${Math.round(m2 * 10) / 10} m²`;
}

export type Diff = { added: Set<string>; removed: Set<string>; changed: Set<string> };

/**
 * What a proposal does to the plan, room by room: new rooms, rooms gone, and rooms that grew, shrank, were renamed or
 * opened up. Arcon reflows the plan around a change, so a room that only shifted is not counted, nor a size change
 * under 3% (rounding as the plan settles).
 */
export function diffPlan(before: Space[], after: Space[]): Diff {
  const was = new Map(before.map((s) => [s.id, s]));
  const now = new Map(after.map((s) => [s.id, s]));
  const added = new Set([...now.keys()].filter((id) => !was.has(id)));
  const removed = new Set([...was.keys()].filter((id) => !now.has(id)));
  const changed = new Set(
    [...now.values()]
      .filter((s) => {
        const b = was.get(s.id);
        if (!b) return false;
        const resized = Math.abs(s.area - b.area) > Math.max(0.3, b.area * 0.03);
        return resized || b.name !== s.name || (b.open !== false) !== (s.open !== false);
      })
      .map((s) => s.id),
  );
  return { added, removed, changed };
}

/** The floors a plan has, lowest first. */
export function floorsOf(spaces: Space[]): number[] {
  return [...new Set(spaces.map((s) => s.floor))].sort((a, b) => a - b);
}

export function floorName(level: number): string {
  return level === 0 ? "Ground floor" : level === 1 ? "First floor" : `Floor ${level}`;
}

/** Postgres writes `2026-11-08 11:59:50.1+00`; Date.parse wants ISO. */
function stamp(iso: string): string {
  const s = iso.trim().replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00");
  return /(Z|[+-]\d\d:\d\d)$/.test(s) ? s : `${s}Z`;
}

export function ago(iso: string, now = Date.now()): string {
  const t = Date.parse(stamp(iso));
  if (!Number.isFinite(t)) return "";
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(t).toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

/** The drawing area: the shell, or more if a proposal grows the plan past it. */
export function extentOf(spaces: Space[], shell: { width: number; depth: number }): { width: number; depth: number } {
  return spaces.reduce(
    (e, s) => ({ width: Math.max(e.width, s.rect.x + s.rect.w), depth: Math.max(e.depth, s.rect.y + s.rect.h) }),
    { width: shell.width, depth: shell.depth },
  );
}
