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

/** What a proposal does to the plan, room by room: new rooms, rooms gone, and rooms that moved, grew or were renamed. */
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
        const moved = (["x", "y", "w", "h"] as const).some((k) => Math.abs(b.rect[k] - s.rect[k]) > 0.05);
        return moved || b.name !== s.name || b.open !== s.open;
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
