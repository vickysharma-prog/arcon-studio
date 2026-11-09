import { randomUUID } from "node:crypto";

import { and, eq } from "drizzle-orm";

import { clients } from "../../engine/db/schema.ts";
import { chooseOption } from "../../engine/design/run.ts";
import { next, picksOf, problems, toProject, type Answers } from "../../engine/interview/script.ts";
import { createProject, getProject, updateProject, type Project } from "../../engine/project/store.ts";
import { decide, inPersonClient, postEvent, postMessage, sendForReview } from "../../engine/project/thread.ts";
import { designView } from "../../engine/studio/view.ts";
import { chosenOf, editDesign, previewChange, versionOf } from "../../engine/workspace/apply.ts";
import { understand } from "../../engine/workspace/understand.ts";
import { getDb } from "../db/index.js";
import { briefOf } from "./brief.js";
import { record } from "./changes.js";
import { draftPlans } from "./plans.js";
import { choiceSignals, profileOf, signalsOf } from "./taste.js";

// A studio that looks lived in: invented clients at every stage, each built the way a real project is (interview
// answers, plans, a chosen plan, changes, a review), so every screen and every agent tool has something real to show.
// The clients are marked as samples in their notes; seeding twice does nothing.

export const SAMPLE_NOTE = "Sample client, added by Arcon Studio so you can see a full studio.";

type Stage = "interview" | "plans" | "designing" | "proposal" | "review" | "approved";
type Sample = {
  client: string;
  title: string;
  type: string;
  city: string;
  look: string;
  feel: string[];
  loves: [string, string, string];
  over?: Answers;
  stage: Stage;
  edits?: string[];
  note?: string;
  propose?: { words: string; reason: string };
  answer?: string;
};

export const SAMPLES: Sample[] = [
  {
    client: "Priya Mehta",
    title: "Priya's house",
    type: "house",
    city: "Pune, India",
    look: "scandi",
    feel: ["airy", "green"],
    loves: ["A beach café in Goa", "Handloom cotton linen", "Old Bollywood songs"],
    over: {
      build: "new",
      floors: "1",
      who: ["me", "partner", "kids"],
      kids: ["8", "15"],
      wfh: "yes",
      bedrooms: "3",
      extras: ["office", "guest"],
      kitchen: "open",
      entertaining: "often",
      bedroomsPlace: "apart",
      outlook: "garden",
      dislikes: "Our kitchen is dark and closed off, so I can't see the kids while I cook",
      budget: "premium",
    },
    stage: "proposal",
    edits: ["make the living room bigger"],
    note: "Priya wants the study to fit two desks; she and her husband both work from home on Fridays.",
    propose: { words: "make the study bigger", reason: "Priya and her husband both work from home, so the study needs room for two desks." },
  },
  {
    client: "Rohan Kapoor",
    title: "Kapoor apartment",
    type: "apartment",
    city: "Mumbai, India",
    look: "modern",
    feel: ["cozy"],
    loves: ["The Taj Mahal Palace", "Good Earth", "Old Hindi film music"],
    stage: "review",
    edits: ["make the living room bigger"],
    note: "Sent for review after Thursday's meeting. Rohan will show Isha the 3D tonight.",
  },
  {
    client: "Ananya Rao",
    title: "Ananya's café",
    type: "cafe",
    city: "Bengaluru, India",
    look: "industrial",
    feel: ["lively", "green"],
    loves: ["Third Wave Coffee", "Nicobar", "Lo-fi beats"],
    stage: "approved",
    answer: "Loves the long counter and the plants by the window. Go ahead.",
  },
  {
    client: "Kabir Sethi",
    title: "Sethi & Co office",
    type: "office",
    city: "Gurugram, India",
    look: "midcentury",
    feel: ["airy"],
    loves: ["Blue Tokai", "Herman Miller", "The Office"],
    stage: "designing",
    edits: ["add a meeting room"],
  },
  {
    client: "Dev Malhotra",
    title: "Malhotra villa",
    type: "house",
    city: "New Delhi, India",
    look: "classic",
    feel: ["cozy", "green"],
    loves: ["The Oberoi Udaivilas", "Jaypore", "Ghazals"],
    over: { floors: "2" },
    stage: "plans",
  },
  {
    client: "Meera Iyer",
    title: "Meera's studio",
    type: "studio",
    city: "Goa, India",
    look: "boho",
    feel: ["lively"],
    loves: [],
    stage: "interview",
  } as unknown as Sample,
];

/** Answers the interview the way the client would: the sample's own choices, and the first choice everywhere else. */
export function answersFor(s: Sample): Answers {
  const a: Answers = { type: s.type, city: s.city, look: s.look, feel: s.feel, ...(s.over ?? {}) };
  const loves = { place: s.loves[0], brand: s.loves[1], media: s.loves[2] } as Record<string, string | undefined>;
  for (let q = next(a); q; q = next(a)) {
    if (q.kind === "choice") a[q.id] = q.choices![0]!.value;
    else if (q.kind === "multi") a[q.id] = [q.choices![0]!.value];
    else if (q.kind === "size") a[q.id] = { width: 42, depth: 56, unit: "ft" };
    else if (q.kind === "text") a[q.id] = q.optional ? "" : s.city;
    else a[q.id] = { slot: q.slot!, id: `sample-${q.slot}-${s.client.split(" ")[0]!.toLowerCase()}`, name: loves[q.slot!] ?? `A ${q.slot}` };
  }
  return a;
}

const actorOf = (architect: string) => ({ id: architect, name: architect.split("@")[0] ?? architect });

async function build(s: Sample, architect: string): Promise<string> {
  const clientId = randomUUID();
  await getDb().insert(clients).values({ id: clientId, ownerEmail: architect, name: s.client, contactEmail: null, phone: null, notes: SAMPLE_NOTE });
  let p: Project = await createProject({ owner_id: architect, client_id: clientId, title: s.title, designed_for: s.client, space_type: s.type as never, site: { location: s.city } } as never);
  if (s.stage === "interview") return p.id;

  // the interview, as finish-interview saves it
  const answers = answersFor(s);
  const wrong = problems(answers);
  if (wrong.length) throw new Error(`Sample ${s.title}: ${wrong.join("; ")}`);
  const fields = toProject(answers, "en");
  p = await updateProject(p.id, {
    ...fields,
    title: s.title,
    status: "designing",
    taste_signals: [...choiceSignals(s.look, s.feel), ...signalsOf(picksOf(answers))],
    taste: profileOf(s.look, s.feel),
  });
  await postEvent(p, { id: architect, name: s.client }, { type: "answered" }).catch(() => {});

  // three plans and the brief, as design-project draws them
  const out = draftPlans(p);
  if ("error" in out) throw new Error(`Sample ${s.title}: ${out.error}`);
  p = await updateProject(p.id, { program: out.program, options: out.options, brief: briefOf(s.look, s.feel, s.client) });
  if (s.stage === "plans") return p.id;

  // a plan chosen, then the architect's own changes
  p = await chooseOption(p.id, 0);
  const actor = actorOf(architect);
  await postEvent(p, actor, { type: "chose", plan: p.options?.[0]?.concept?.name ?? "Plan 1" }).catch(() => {});
  for (const words of s.edits ?? []) {
    const now = (await getProject(p.id))!;
    const at = chosenOf(now);
    if ("status" in at) break;
    const change = understand(words, at.current);
    if (change) await editDesign({ project: now, role: "owner" }, { change }, actor);
  }
  p = (await getProject(p.id))!;
  if (s.note) await postMessage(p, { id: architect, name: actor.name }, { body: s.note, room: null, role: "architect" });

  // the agent's proposal, waiting for the architect
  if (s.propose) {
    const at = chosenOf(p);
    const change = "status" in at ? null : understand(s.propose.words, at.current);
    if (change && !("status" in at)) {
      const prev = previewChange(p, at.current, change);
      if (!("error" in prev)) {
        const after = designView(p, prev.layout, "owner", false, 0, false, "");
        await record({
          id: randomUUID(),
          ownerEmail: architect,
          projectId: p.id,
          kind: "change",
          change,
          baseVersion: await versionOf(p.id),
          summary: prev.note,
          cost: prev.cost.text,
          reason: s.propose.reason,
          proposedBy: "agent",
          status: "pending",
          resultVersion: null,
          note: null,
          after: after.spaces,
        });
      }
    }
  }
  if (s.stage === "designing" || s.stage === "proposal") return p.id;

  await sendForReview(p, actor);
  if (s.stage === "review") return p.id;
  p = (await getProject(p.id))!;
  await decide(p, actor, "approved", s.answer ?? null, await inPersonClient(p, "owner"));
  return p.id;
}

/** Fills an architect's studio with the samples, once. Returns the projects by title, or nothing if already there. */
export async function seedStudio(architect: string): Promise<Record<string, string> | null> {
  const [had] = await getDb()
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.ownerEmail, architect), eq(clients.notes, SAMPLE_NOTE)))
    .limit(1);
  if (had) return null;
  const made: Record<string, string> = {};
  // oldest first, so the studio lists the most worked-on project at the top
  for (const s of [...SAMPLES].reverse()) made[s.title] = await build(s, architect);
  return made;
}
