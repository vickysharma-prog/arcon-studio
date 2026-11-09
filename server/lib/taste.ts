import type { TastePick } from "../../engine/interview/script.ts";
import type { TasteSignal } from "../../engine/project/store.ts";

// What the client loves, kept as they named it: a place, a brand, a film or music. Each pick becomes a taste signal
// on its own layer (places shape the rooms most, then brands, then culture), with an id made from its name so the
// same pick named twice counts once.

const LAYER = { place: 1, brand: 2, media: 3 } as const;
const TYPE = { place: "urn:entity:place", brand: "urn:entity:brand", media: "urn:entity:movie" } as const;

export const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "");

export function signalsOf(picks: TastePick[]): TasteSignal[] {
  const seen = new Set<string>();
  const out: TasteSignal[] = [];
  for (const p of picks) {
    const name = p.name.trim();
    if (!name) continue;
    const entityId = `studio:${p.slot}:${slug(name)}`;
    if (seen.has(entityId)) continue;
    seen.add(entityId);
    out.push({ entityId, name, layer: LAYER[p.slot as keyof typeof LAYER] ?? 3, type: TYPE[p.slot as keyof typeof TYPE] });
  }
  return out;
}
