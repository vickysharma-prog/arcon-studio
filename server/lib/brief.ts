import type { Brief } from "../../engine/design/brief.ts";
import { FEELS, LOOKS, type FeelId, type LookId } from "./taste.ts";

// A design brief from the look and feel the client chose, ready the moment the interview ends, so "Your style" and the
// 3D are the client's own without waiting on a model. The agent can write a richer one with set-brief. Every colour,
// material and light credits the choice it came from, and nothing else.

type Swatch = Brief["palette"][number];
type Base = { summary: string; palette: Omit<Swatch, "from">[]; materials: { name: string; where: string }[]; lighting: { mood: string; fixtures: string[] }; plants: { name: string; where: string; why: string }[] };

const BASES: Record<LookId, Base> = {
  modern: {
    summary: "Clean lines, a quiet palette and a few strong pieces.",
    palette: [
      { name: "Soft white", hex: "#f3f2ef", role: "base" },
      { name: "Graphite", hex: "#3d4148", role: "accent" },
      { name: "Light oak", hex: "#c8a97e", role: "wood" },
      { name: "Brushed steel", hex: "#9aa0a6", role: "metal" },
      { name: "Stone grey", hex: "#b8b4ad", role: "textile" },
    ],
    materials: [
      { name: "Light oak", where: "floors and joinery" },
      { name: "Matte lacquer", where: "kitchen fronts" },
      { name: "Honed stone", where: "counters and bath vanity" },
    ],
    lighting: { mood: "Even and bright by day, warm pools at night", fixtures: ["recessed downlights", "linear pendant over the dining table"] },
    plants: [
      { name: "Fiddle leaf fig", where: "living room corner", why: "one sculptural plant suits a spare room" },
      { name: "Snake plant", where: "bedroom", why: "upright and easy, it keeps the lines clean" },
    ],
  },
  scandi: {
    summary: "Light, calm rooms in pale wood and soft textiles.",
    palette: [
      { name: "Chalk white", hex: "#f5f3ee", role: "base" },
      { name: "Fjord blue", hex: "#6f8ca3", role: "accent" },
      { name: "Pale ash", hex: "#d9c3a0", role: "wood" },
      { name: "Linen", hex: "#e3dbcd", role: "textile" },
      { name: "Sage", hex: "#8fa58a", role: "green" },
    ],
    materials: [
      { name: "Pale ash", where: "floors and furniture" },
      { name: "Wool and linen", where: "throws, rugs and curtains" },
      { name: "White ceramic tile", where: "kitchen and bath walls" },
    ],
    lighting: { mood: "Soft and diffused, like daylight through linen", fixtures: ["paper pendant", "wall-mounted reading lights"] },
    plants: [
      { name: "Pothos", where: "open shelves", why: "trailing green softens pale wood" },
      { name: "Peace lily", where: "bedroom", why: "calm white flowers and an easy temper" },
    ],
  },
  midcentury: {
    summary: "Warm wood, low furniture and a little retro colour.",
    palette: [
      { name: "Warm cream", hex: "#efe6d6", role: "base" },
      { name: "Mustard", hex: "#c99a2e", role: "accent" },
      { name: "Walnut", hex: "#7a5236", role: "wood" },
      { name: "Brass", hex: "#b08d57", role: "metal" },
      { name: "Teal", hex: "#2f6f6a", role: "textile" },
    ],
    materials: [
      { name: "Walnut", where: "sideboards, doors and the dining table" },
      { name: "Terrazzo", where: "kitchen floor" },
      { name: "Woven cane", where: "chairs and cabinet fronts" },
    ],
    lighting: { mood: "Warm and low, with a glow from every corner", fixtures: ["globe pendants", "tripod floor lamp"] },
    plants: [
      { name: "Monstera", where: "beside the sofa", why: "big leaves were the era's signature" },
      { name: "Rubber plant", where: "study", why: "glossy and upright beside dark wood" },
    ],
  },
  industrial: {
    summary: "Raw materials, honest structure and an urban edge.",
    palette: [
      { name: "Concrete grey", hex: "#b5b2ad", role: "base" },
      { name: "Rust", hex: "#a4552f", role: "accent" },
      { name: "Reclaimed timber", hex: "#8a6a4b", role: "wood" },
      { name: "Black steel", hex: "#2e3033", role: "metal" },
      { name: "Leather tan", hex: "#a8774f", role: "textile" },
    ],
    materials: [
      { name: "Polished concrete", where: "floors" },
      { name: "Exposed brick", where: "a living room wall" },
      { name: "Black steel", where: "shelving, frames and the stair rail" },
    ],
    lighting: { mood: "Focused light on a darker shell", fixtures: ["metal dome pendants", "exposed-bulb track lights"] },
    plants: [
      { name: "ZZ plant", where: "by the entrance", why: "tough and glossy against raw finishes" },
      { name: "Bird of paradise", where: "next to a large window", why: "a big green shape in a loft-like room" },
    ],
  },
  boho: {
    summary: "Layered textiles, warm colour and things collected over time.",
    palette: [
      { name: "Clay white", hex: "#efe4d6", role: "base" },
      { name: "Terracotta", hex: "#c0643e", role: "accent" },
      { name: "Mango wood", hex: "#9b6b43", role: "wood" },
      { name: "Saffron", hex: "#d79b3a", role: "textile" },
      { name: "Olive", hex: "#6f7b3f", role: "green" },
    ],
    materials: [
      { name: "Rattan and jute", where: "seating, lamps and rugs" },
      { name: "Patterned tile", where: "kitchen backsplash and bath floor" },
      { name: "Block-printed cotton", where: "cushions and curtains" },
    ],
    lighting: { mood: "Warm and layered, lamps over overhead light", fixtures: ["woven pendant", "lanterns on low tables"] },
    plants: [
      { name: "Boston fern", where: "hanging by the window", why: "a soft, full plant for layered rooms" },
      { name: "Monstera", where: "living room", why: "big leaves against warm colour" },
    ],
  },
  classic: {
    summary: "Elegant proportions, rich materials and quiet symmetry.",
    palette: [
      { name: "Ivory", hex: "#f2ece0", role: "base" },
      { name: "Deep navy", hex: "#283a5c", role: "accent" },
      { name: "Teak", hex: "#7d5534", role: "wood" },
      { name: "Antique brass", hex: "#a5864f", role: "metal" },
      { name: "Velvet green", hex: "#3f5c4a", role: "textile" },
    ],
    materials: [
      { name: "Teak", where: "doors, panelling and furniture" },
      { name: "Marble", where: "bath and kitchen counters" },
      { name: "Velvet and silk", where: "upholstery and curtains" },
    ],
    lighting: { mood: "Warm and formal, with a centrepiece in each room", fixtures: ["chandelier over the dining table", "pleated table lamps"] },
    plants: [
      { name: "Kentia palm", where: "living room", why: "an elegant palm suits formal rooms" },
      { name: "Peace lily", where: "dining room", why: "white flowers echo the ivory walls" },
    ],
  },
};

const FEEL_PLANTS: Partial<Record<FeelId, { name: string; where: string; why: string }>> = {
  green: { name: "Areca palm", where: "near the garden doors", why: "the client asked for a green, natural home" },
};

/** The brief for a client's look and feel. Null when they chose no look. */
export function briefOf(look: unknown, feel: unknown, client: string | null): Brief | null {
  if (typeof look !== "string" || !(look in LOOKS)) return null;
  const id = look as LookId;
  const feels = (Array.isArray(feel) ? feel : []).filter((f): f is FeelId => typeof f === "string" && f in FEELS);
  const lookCredit = `${LOOKS[id].name} look`;
  const credits = [lookCredit, ...feels.map((f) => FEELS[f].name)];
  const base = BASES[id];
  const feelText = feels.length ? `, ${feels.map((f) => FEELS[f].name.toLowerCase()).join(" and ")}` : "";
  const plants = [...base.plants, ...feels.flatMap((f) => (FEEL_PLANTS[f] ? [FEEL_PLANTS[f]!] : []))].slice(0, 6);
  return {
    name: feels.includes("cozy") ? `Warm ${LOOKS[id].name}` : feels.includes("airy") ? `Airy ${LOOKS[id].name}` : `${LOOKS[id].name} Home`,
    summary: `${base.summary} ${client ? `${client.split(/\s+/)[0]} chose` : "Chosen as"} a ${LOOKS[id].name.toLowerCase()} look${feelText}.`,
    palette: base.palette.map((c) => ({ ...c, from: c.role === "accent" || c.role === "base" ? credits : [lookCredit] })),
    materials: base.materials.map((m) => ({ ...m, from: [lookCredit] })),
    lighting: { ...base.lighting, from: credits },
    plants,
  };
}
