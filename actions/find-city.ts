import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";

import { cityLabel, type Place } from "../engine/interview/city.ts";
import { architectOf } from "../server/lib/projects.js";

// What a typed city is on the map, with its country, so "Delih" can't quietly become a village elsewhere.
// OpenStreetMap's geocoder; a few towns and cities at most.
export default defineAction({
  description: "Find a typed city on the map, with its region and country. Returns up to three labels to pick from.",
  schema: z.object({ q: z.string().trim().min(2).max(80).describe("What was typed") }),
  outputSchema: z.object({ places: z.array(z.string()) }),
  errors: defineActionErrors("not_signed_in"),
  http: { method: "GET" },
  readOnly: true,
  run: async ({ q }, ctx) => {
    architectOf(ctx);
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&accept-language=en&featureType=settlement&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { "User-Agent": "ArconStudio/0.1 (arcon-studio.vercel.app)" }, signal: AbortSignal.timeout(6000) }).catch(() => null);
    if (!res?.ok) return { places: [] };
    const hits = (await res.json().catch(() => [])) as Place[];
    return { places: [...new Set(hits.map(cityLabel).filter((l): l is string => !!l))].slice(0, 3) };
  },
});
