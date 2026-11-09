import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Reveal } from "@arcon/fx/Motion";
import { tick, transition } from "@arcon/fx/sfx";
import { buildingShell } from "@engine/layout/footprint";
import { place } from "@engine/layout/place";
import { DEFAULT_SHELLS, TEMPLATES } from "@engine/layout/templates";

// The sections only Studio has: the house as a film you scroll through, the agent beside the architect, and the
// judges' path. They sit between Arcon's own landing sections.

const HouseScene = dynamic(() => import("@arcon/three/HouseScene"), { ssr: false, loading: () => null });

const BRIEF = {
  name: "Pale Scandinavian",
  summary: "Pale timber, linen and soft light",
  palette: [
    { role: "base", hex: "#f4f7fb" },
    { role: "wood", hex: "#cdb497" },
    { role: "accent", hex: "#2f6fed" },
    { role: "dark", hex: "#55657d" },
  ],
  materials: [
    { name: "Pale timber floors", where: "living and bedrooms" },
    { name: "White paint", where: "walls" },
  ],
};

// What the scroll shows, in order: the drawing, the same floor furnished, the floor above, and the house at night.
const SCENES = [
  { sketch: true, level: 0, night: false, eyebrow: "Drawn", line: "First, the plan as a drawing." },
  { sketch: false, level: 0, night: false, eyebrow: "Furnished", line: "Then furnished, in your client's style." },
  { sketch: false, level: 1, night: false, eyebrow: "Every floor", line: "Every floor, every room, to scale." },
  { sketch: false, level: 1, night: true, eyebrow: "Day and night", line: "By day, or with every lamp lit." },
] as const;

/** The house holds the screen while the scroll turns it from a drawing into a lit home. */
export function HouseFilm() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [at, setAt] = useState(0);
  const [near, setNear] = useState(false);
  useMotionValueEvent(scrollYProgress, "change", (v) => setAt(Math.min(SCENES.length - 1, Math.max(0, Math.floor(v * SCENES.length)))));
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.82, 1, 1.12]);
  const lift = useTransform(scrollYProgress, [0, 1], ["4%", "-4%"]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const layout = useMemo(() => place(TEMPLATES.house, buildingShell(TEMPLATES.house, DEFAULT_SHELLS.house)), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setNear(!!e?.isIntersecting), { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const s = SCENES[at];
  return (
    <section ref={ref} aria-label="The house, scene by scene" className="relative" style={{ height: `${SCENES.length * 90 + 40}vh` }}>
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden bg-paper">
        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 pt-24 text-center sm:px-8">
          <AnimatePresence mode="wait">
            <motion.div key={at} initial={{ opacity: 0, y: 18, filter: "blur(8px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} exit={{ opacity: 0, y: -18, filter: "blur(8px)" }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}>
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">{s.eyebrow}</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-6xl">{s.line}</h2>
            </motion.div>
          </AnimatePresence>
        </div>
        <motion.div style={{ scale, y: lift }} className="relative min-h-0 flex-1">
          {near && <HouseScene layout={layout} brief={BRIEF as never} newBuild mode="showcase" sketch={s.sketch} night={s.night} cutaway upTo={s.level} playing={false} paused={!near} />}
        </motion.div>
        <div className="relative mx-auto mb-8 h-0.5 w-48 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full bg-brand" style={{ width: bar }} />
        </div>
      </div>
    </section>
  );
}

const ACTIONS = [
  { id: "design-project", you: "Click “Design my space”", agent: "“Draw Priya three plans”", out: "Three plans from her interview, each with its reasons." },
  { id: "set-program", you: "Change the rooms she needs", agent: "“She works from home, add a study”", out: "New plans with a study, laid out three ways." },
  { id: "propose-change", you: "Type “make the study bigger”", agent: "“Give the study room for two desks”", out: "The change drawn over the plan, with its cost." },
  { id: "apply-change", you: "Press Approve", agent: "Asks you first, every time", out: "A new version, re-priced. Nothing changes until you say so." },
  { id: "get-budget", you: "Open Budget & shopping", agent: "“What will the kitchen cost?”", out: "Cost by room and by trade, in the client's currency." },
  { id: "review-design", you: "Send for review", agent: "“Send it to Priya”", out: "The design goes to review; you record her answer." },
] as const;

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-ink-soft">{sub}</p>}
    </Reveal>
  );
}

/** One set of actions behind every button and every agent tool: pick one and see it from both sides. */
export function AgentSide() {
  const [on, setOn] = useState(2);
  const [side, setSide] = useState<"you" | "agent">("agent");
  const a = ACTIONS[on];
  return (
    <section id="agent" className="relative scroll-mt-24 border-y border-line bg-paper-raised/50 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Heading eyebrow="The agent beside you" title="One set of actions. You press them, or the agent does." sub="Studio is built on Agent-Native: every button you use is a tool the agent can call, on the same project, at the same time. It proposes; you approve." />
        <Reveal className="mt-12 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {ACTIONS.map((x, i) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => (tick(), setOn(i))}
                  aria-pressed={on === i}
                  className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-3 text-left font-mono text-xs transition sm:text-sm ${on === i ? "border-brand bg-brand/10 text-ink" : "border-line text-ink-soft hover:border-brand/50 hover:text-ink"}`}
                >
                  {x.id}
                  {x.id === "apply-change" && <span className="hidden rounded-full bg-leaf/15 px-2 py-0.5 font-sans text-[11px] text-leaf sm:inline">needs your approval</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-3xl border border-line bg-paper p-6 shadow-[0_30px_80px_-50px_hsl(var(--brand))] sm:p-8">
            <div role="tablist" aria-label="Who presses it" className="inline-flex rounded-full border border-line p-1 text-sm">
              {(["you", "agent"] as const).map((s) => (
                <button key={s} role="tab" type="button" aria-selected={side === s} onClick={() => (tick(), setSide(s))} className="relative rounded-full px-4 py-1.5">
                  {side === s && <motion.span layoutId="side" className="absolute inset-0 rounded-full bg-btn" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <span className={`relative ${side === s ? "text-btn-ink" : "text-ink-soft"}`}>{s === "you" ? "You" : "The agent"}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={`${on}-${side}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.22 }} className="mt-6">
                <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{side === "you" ? "In the project screen" : "In the chat beside it"}</p>
                <p className="mt-2 font-serif text-3xl sm:text-4xl">{side === "you" ? a.you : a.agent}</p>
                <div className="my-5 flex items-center gap-3 font-mono text-xs text-brand">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand/60" />
                  {a.id}
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand/60" />
                </div>
                <p className="text-lg">{a.out}</p>
              </motion.div>
            </AnimatePresence>
            <p className="mt-6 border-t border-line pt-4 text-sm text-ink-soft">You lead every meeting and make every call. Studio does the drawing, pricing and paperwork fast.</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const TRY = [
  "Open your studio and sign in with Google.",
  "Add a client, then answer the interview as them: a look, a feel and three things they love.",
  "Three plans appear. Choose one and walk through it in 3D.",
  "In the chat, ask: “Make the study big enough for two desks.” See it over the plan, then approve it.",
  "Open Budget & shopping, then send the design for review and record the client's answer.",
];

export function Judges() {
  return (
    <section id="judges" className="scroll-mt-24 px-4 py-24 sm:px-8">
      <Reveal className="mx-auto max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-brand/40 bg-paper-raised p-7 shadow-[0_50px_100px_-60px_hsl(var(--brand))] sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">For judges</p>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Try it in five minutes.</h2>
          <ol className="mt-6 grid gap-3">
            {TRY.map((t, i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand/50 font-mono text-xs text-brand">{i + 1}</span>
                <span className="pt-0.5">{t}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-2xl border border-line bg-paper p-4 text-sm text-ink-soft">
            The design engine comes from Arcon, which I built earlier; Arcon Studio and its agent workspace were built during the hackathon.
          </p>
          <Link href="/projects" onClick={() => transition()} className="glow-btn mt-6 px-6 py-3.5 text-base">
            Open the studio
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
