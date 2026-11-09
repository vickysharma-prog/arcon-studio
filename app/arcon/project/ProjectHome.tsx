"use client";

import { apiFetch } from "@arcon/api";
import { TourNext } from "@arcon/demo/TourBar";
import { DeleteProject } from "./DeleteProject";
import { useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { STEPS, type StepId } from "./steps";
import { ThreadView, type Room } from "./ThreadView";
import { SiteView } from "./SiteView";
import type { Layout } from "@engine/layout/schema";
import { ROLE_NAME, can, type ProjectRole } from "@engine/project/access";
import { nextLine, STAGES, stageOf, tabsFor, unlockPrice, type Tab } from "@engine/project/stage";
import { chime, ok, tick } from "@arcon/fx/sfx";

type Home = {
  id: string;
  title: string | null;
  space_type: string | null;
  status: Parameters<typeof stageOf>[0]["status"];
  chosen_option: number | null;
  unlocked?: boolean;
  unread?: number;
  pros?: string[];
  mode?: "owner" | "pro";
  studio?: { id: string; name: string; logo_url: string | null } | null;
  options?: Layout[] | null;
  /** a pro's own project: what kind of pro owns it (a builder's design-and-build needs no other builder) */
  ownerKind?: string | null;
  /** a pro who's been asked to join: the request to answer here */
  request?: { id: number; role: "architect" | "builder"; from: string; message: string | null } | null;
  site: { location?: string; units?: "imperial" | "metric" };
};

// A project once its guided steps are done: whose it is, where it is in its life, and tabs for this person.
// The tabs show the same step screens as the guided tour, so every button inside them keeps working.
export function ProjectHome({
  p,
  role,
  whose,
  step,
  pane,
  setStep,
  showPane,
  discuss,
  onStatus,
  body,
  onUnlocked,
  onTour,
}: {
  p: Home;
  role: ProjectRole;
  whose: string | null;
  step: StepId;
  pane: "overview" | "thread" | "site" | null;
  setStep: (s: StepId) => void;
  showPane: (pane: "overview" | "thread" | "site") => void;
  discuss: Room | null;
  onStatus: (status: string) => void;
  body: (s: StepId) => ReactNode;
  onUnlocked: () => void;
  onTour: () => void;
}) {
  const unlocked = !!p.unlocked;
  // Studio: the architect's tabs; the building site is the builder's.
  const tabs = tabsFor(role, unlocked).filter((t) => t.id !== "site");
  const active: Tab = pane ? (tabs.find((t) => t.id === pane) ?? tabs[0]) : (tabs.find((t) => t.steps.includes(step)) ?? tabs[0]);
  const stage = stageOf(p);
  const label = (s: string) => (s === "brief" ? (whose ? `${whose}'s style` : "Style") : s === "walkthrough" ? "3D" : (STEPS.find((x) => x.id === s)?.label ?? s));

  return (
    <div className="flex flex-1 flex-col">
      {p.request && <AskedToJoin request={p.request} title={p.title} />}
      <header className="mx-auto w-full max-w-6xl px-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm text-ink-soft">
              {whose ? `${whose}'s design` : "Your design"}
              {role !== "owner" && <span className="ml-2 rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand">You&apos;re the {ROLE_NAME[role].toLowerCase()}</span>}
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl">{p.title ?? "Your project"}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <TourNext />
            {/* The studio behind the design, shown to its clients (the pros themselves don't need their own logo back). */}
            {p.studio && (role === "client" || role === "viewer" || (role === "owner" && p.mode !== "pro")) && (
              <span className="flex items-center gap-2 rounded-full border border-line bg-paper-raised py-1 pl-1 pr-3 text-xs">
                {p.studio.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.studio.logo_url} alt="" className="h-6 w-6 rounded-full object-contain" />
                ) : (
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-btn text-[10px] text-btn-ink">{p.studio.name[0]}</span>
                )}
                Designed with {p.studio.name}
              </span>
            )}
            {!unlocked && <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">Preview</span>}
          </div>
        </div>
        {/* Where the project is in its life */}
        <ol className="mt-5 grid grid-cols-4 gap-1.5" aria-label="Project progress">
          {/* Studio: the architect's part of a project, from knowing the client to their approval. */}
          {STAGES.slice(0, 4).map((s, i) => (
            <li key={s.id} aria-current={i === stage ? "step" : undefined}>
              <span className={`block h-1.5 rounded-full ${i < stage ? "bg-leaf" : i === stage ? "bg-brand" : "bg-line"}`} />
              <span className={`mt-1.5 block truncate text-[11px] sm:text-xs ${i === stage ? "font-medium text-ink" : "text-ink-soft"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
        <nav aria-label="Project" className="mt-6 flex gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => (t.id === "overview" || t.id === "thread" || t.id === "site" ? (tick(), showPane(t.id)) : setStep(t.steps[0] as StepId))}
              aria-current={active.id === t.id ? "page" : undefined}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition ${active.id === t.id ? "border-brand text-ink" : "border-transparent text-ink-soft hover:text-ink"}`}
            >
              {t.label}
              {t.locked && <span aria-label="locked"> 🔒</span>}
              {t.id === "thread" && !!p.unread && pane !== "thread" && <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[11px] text-white">{p.unread}</span>}
            </button>
          ))}
        </nav>
        {!active.locked && active.steps.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {active.steps.map((s) => (
              <button
                key={s}
                onClick={() => setStep(s as StepId)}
                aria-pressed={step === s}
                className={`rounded-full px-3.5 py-1.5 text-sm transition ${step === s ? "bg-btn text-btn-ink" : "border border-line text-ink-soft hover:text-ink"}`}
              >
                {label(s)}
                {s === "workspace" && !unlocked && " 🔒"}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* No exit animation: the 3D's room labels are separate React roots and break if kept alive while leaving. */}
      <motion.div key={pane ?? step} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 pt-4">
          {active.id === "site" ? (
            <SiteView projectId={p.id} onStatus={onStatus} onPlans={() => setStep("plans")}  />
          ) : active.id === "thread" ? (
            <ThreadView
              key={discuss?.id ?? "thread"}
              projectId={p.id}
              layout={p.chosen_option !== null ? (p.options?.[p.chosen_option] ?? null) : null}
              units={p.site.units ?? (p.site.location && /\b(US|USA|TX|CA|NY|FL)\b/.test(p.site.location) ? "imperial" : "metric")}
              room={discuss}
              onStatus={onStatus}
            />
          ) : active.id === "overview" ? (
            <Overview p={p} role={role} whose={whose} unlocked={unlocked} go={(s) => setStep(s)} onSite={() => showPane("site")} onThread={() => showPane("thread")} onUnlocked={onUnlocked} onTour={onTour} />
          ) : active.locked || (step === "workspace" && !unlocked) ? (
            <div className="mx-auto max-w-6xl px-4 py-8">
              <Unlock p={p} role={role} onUnlocked={onUnlocked} />
            </div>
          ) : (
            body(step)
          )}
      </motion.div>
    </div>
  );
}

function Overview({ p, role, whose, unlocked, go, onSite, onThread, onUnlocked, onTour }: { p: Home; role: ProjectRole; whose: string | null; unlocked: boolean; go: (s: StepId) => void; onSite: () => void; onThread: () => void; onUnlocked: () => void; onTour: () => void }) {
  const plan = p.chosen_option !== null ? p.options?.[p.chosen_option]?.concept?.name : null;
  const router = useRouter();
  const cards: { title: string; text: string; to?: StepId; action?: () => void; locked?: boolean }[] = [
    { title: "Design", text: plan ? `${plan}: style, plans and 3D` : "Style, plans and 3D", to: "brief" },
    ...(role !== "viewer" ? [{ title: "Budget & shopping", text: "Cost by room and the shopping list", to: "budget" as StepId, locked: !unlocked }] : []),
    // Studio: the agent's proposals, drawn over the plan for the architect to apply or reject.
    ...(p.chosen_option !== null ? [{ title: "With the agent", text: "What the agent proposes, drawn over the plan, for you to apply or reject", action: () => router.push(`/projects/${p.id}/changes`) }] : []),
    { title: "Thread", text: p.unread ? `${p.unread} new message${p.unread === 1 ? "" : "s"}` : "Notes on the design, and the client's reviews", action: onThread },
    ...(role !== "viewer" ? [{ title: "Files", text: "PDF, CAD drawing, sketches, video", to: "drawings" as StepId, locked: !unlocked }] : []),
  ];
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-16">
      <p className="rounded-2xl border border-brand/30 bg-brand/5 px-5 py-4">
        <span className="text-xs uppercase tracking-widest text-brand">Next</span>
        <span className="mt-1 block text-lg">{nextLine(p, role)}</span>
      </p>
      {!unlocked && (
        <div className="mt-4">
          <Unlock p={p} role={role} onUnlocked={onUnlocked} />
        </div>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((c) => (
          <button
            key={c.title}
            onClick={() => (c.action ? c.action() : c.to && go(c.to))}
            className="group rounded-2xl border border-line bg-paper-raised p-5 text-left transition hover:-translate-y-0.5 hover:border-brand"
          >
            <p className="font-serif text-2xl group-hover:text-brand">
              {c.title}
              {c.locked && <span className="ml-2 text-sm">🔒</span>}
            </p>
            <p className="mt-1 text-sm text-ink-soft">{c.text}</p>
          </button>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        {can(role, "edit") && (
          <button onClick={onTour} className="text-sm text-ink-soft hover:text-brand">
            ↻ Take the guided tour again
          </button>
        )}
        {role === "owner" && <DeleteProject id={p.id} name={p.title ?? "this project"} variant="link" />}
      </div>
    </main>
  );
}

// The unlock card. ponytail: unlocking is free until PayPal checkout lands (R5); the button says so plainly.
// `lead`: what the step behind it opens, when it stands in for one step of the guided tour.
export function Unlock({ p, role, onUnlocked, lead }: { p: Pick<Home, "id" | "space_type">; role: ProjectRole; onUnlocked: () => void; lead?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const price = unlockPrice(p.space_type);
  async function unlock() {
    setBusy(true);
    setError(null);
    const res = await apiFetch(`/api/projects/${p.id}/unlock`, { method: "POST" });
    setBusy(false);
    if (res.status === 401) {
      // a guest signs in (their project comes with them), then lands back here to unlock
      window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't unlock. Please try again.");
    chime();
    // a moment to see it worked, then the project opens up
    setDone(true);
    setTimeout(onUnlocked, 1600);
  }
  if (done)
    return (
      <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl border border-leaf/40 bg-leaf/5 p-5" role="status">
        <p className="font-serif text-2xl text-leaf">✓ Unlocked</p>
        <p className="mt-1 text-sm text-ink-soft">Everything is open: the walk inside, the budget, the shopping list, Make changes, every download and your team.</p>
      </motion.section>
    );
  return (
    <section className="rounded-2xl border border-line bg-paper-raised p-5">
      <p className="font-serif text-2xl">Unlock this project</p>
      {lead && <p className="mt-1 font-medium">{lead}</p>}
      <p className="mt-1 text-sm text-ink-soft">
        You&apos;re seeing the preview: your style, the three plans and the 3D from outside. Unlocking opens the walk inside, the budget, the shopping list, Make
        changes, every download and inviting your architect or builder. One payment of ${price} for this project.
      </p>
      {role === "owner" ? (
        <button onClick={unlock} disabled={busy} className="glow-btn mt-4 rounded-full px-6 py-2.5 text-sm disabled:opacity-60">
          {busy ? "Unlocking…" : `Unlock for $${price} · free during the preview`}
        </button>
      ) : (
        <p className="mt-4 text-sm">Ask the project&apos;s owner to unlock it.</p>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}


// A pro asked to join looks at the design here, then answers right on it.
function AskedToJoin({ request, title }: { request: NonNullable<Home["request"]>; title: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function answer(accept: boolean) {
    tick();
    setBusy(true);
    setError(null);
    const res = await apiFetch(`/api/pros/requests/${request.id}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accept }) });
    setBusy(false);
    if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "That didn't go through.");
    ok();
    window.location.assign(accept ? window.location.pathname : "/home?view=requests");
  }
  return (
    <section className="mx-auto mb-4 w-full max-w-6xl px-4">
      <div className="rounded-2xl border border-brand/40 bg-brand/5 p-4">
        <p className="font-medium">
          {request.from} asked you to join {title ?? "this project"} as the {request.role}
        </p>
        {request.message && <p className="mt-1 text-sm text-ink-soft">&ldquo;{request.message}&rdquo;</p>}
        <p className="mt-1 text-xs text-ink-soft">Look around the design first; you join only if you say yes.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => answer(true)} disabled={busy} className="glow-btn rounded-full px-5 py-2 text-sm disabled:opacity-60">
            Accept
          </button>
          <button onClick={() => answer(false)} disabled={busy} className="rounded-full border border-line px-5 py-2 text-sm transition hover:border-brand disabled:opacity-60">
            Decline
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
