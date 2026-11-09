// Draws the sample home on the front page with Arcon's own engine: an invented client, three plans and a brief.
// Run: node scripts/landing-sample.ts  (writes app/components/landing/sample.json; synthetic data only)
import { writeFileSync } from "node:fs";

import { draftPlans } from "../server/lib/plans.ts";
import { briefOf } from "../server/lib/brief.ts";

const project = {
  id: "sample",
  title: "Priya's house",
  space_type: "house",
  status: "ready",
  site: { width: 13, depth: 17, floors: 1, location: "Pune, India", units: "metric" },
  interview: { household: { adults: 2, kids: 2 }, style: { look: "scandi", feel: ["airy", "green"] } },
  designed_for: "Priya",
  brief: null,
  options: null,
  chosen_option: null,
  taste: null,
  taste_signals: [],
} as never;

const out = draftPlans(project);
if ("error" in out) throw new Error(out.error);
const brief = briefOf("scandi", ["airy", "green"], "Priya");
writeFileSync("app/components/landing/sample.json", JSON.stringify({ brief, options: out.options }));
console.log(out.options.map((o) => o.concept?.name), JSON.stringify(out.options).length);
