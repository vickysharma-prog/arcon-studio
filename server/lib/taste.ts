import type { TastePick } from "../../engine/interview/script.ts";
import type { TasteSignal } from "../../engine/project/store.ts";
import type { Profile } from "../../engine/qloo/taste.ts";

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

// The look and the feel the client chose in the interview become the taste profile Arcon's engine reads: the style
// family it styles the design in, and the moods that set light and planting. Each is credited to the choice itself,
// never to something the client didn't say.

export const LOOKS = {
  modern: { name: "Modern", words: "modern contemporary sleek" },
  scandi: { name: "Scandinavian", words: "scandinavian minimal airy" },
  midcentury: { name: "Mid-century", words: "mid-century retro" },
  industrial: { name: "Industrial", words: "industrial loft exposed" },
  boho: { name: "Boho", words: "boho eclectic artsy" },
  classic: { name: "Classic", words: "classic elegant traditional" },
} as const;
export type LookId = keyof typeof LOOKS;

export const FEELS = {
  airy: { name: "Calm and airy", words: ["airy", "calm"] },
  cozy: { name: "Warm and cozy", words: ["cozy", "warm"] },
  green: { name: "Green and natural", words: ["botanical", "natural"] },
  lively: { name: "Bold and lively", words: ["lively", "vibrant"] },
} as const;
export type FeelId = keyof typeof FEELS;

const isLook = (v: unknown): v is LookId => typeof v === "string" && v in LOOKS;
const isFeel = (v: unknown): v is FeelId => typeof v === "string" && v in FEELS;

/** The look and feel as taste signals, so a brief may credit them like anything else the client named. */
export function choiceSignals(look: unknown, feel: unknown): TasteSignal[] {
  const out: TasteSignal[] = [];
  if (isLook(look)) out.push({ entityId: `studio:look:${look}`, name: `${LOOKS[look].name} look`, layer: 1 });
  for (const f of Array.isArray(feel) ? feel.filter(isFeel) : []) out.push({ entityId: `studio:feel:${f}`, name: FEELS[f].name, layer: 1 });
  return out;
}

/** The taste profile Arcon's engine reads, from the look and feel the client chose. */
export function profileOf(look: unknown, feel: unknown): Profile {
  const tags: Profile["tags"] = [];
  if (isLook(look)) {
    const source = { entityId: `studio:look:${look}`, name: `${LOOKS[look].name} look`, layer: 1 as const };
    for (const [i, word] of LOOKS[look].words.split(" ").entries()) tags.push({ family: "style", value: word.replace(/-/g, "_"), weight: 6 - i, sources: [source] });
  }
  for (const f of Array.isArray(feel) ? feel.filter(isFeel) : []) {
    const source = { entityId: `studio:feel:${f}`, name: FEELS[f].name, layer: 1 as const };
    for (const word of FEELS[f].words) tags.push({ family: "ambience", value: word, weight: 3, sources: [source] });
  }
  return { tags, brands: [] };
}
