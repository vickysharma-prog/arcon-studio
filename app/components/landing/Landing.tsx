import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { AnimatedMark } from "@arcon/AnimatedMark";
import { Logo } from "@arcon/Logo";
import { Reveal } from "@arcon/fx/Motion";
import { tick, transition } from "@arcon/fx/sfx";

import { Story } from "./Story";

// Arcon Studio's front page: what it is, the story of one project told by scrolling, the agent beside the
// architect, how to start, and a short path for judges. The page scrolls in its own box, so the story can pin itself.
const NAV = [
  ["How it works", "story"],
  ["The agent", "agent"],
  ["Resources", "resources"],
] as const;

export function Landing() {
  const scroller = useRef<HTMLDivElement>(null);
  const go = (id: string) => {
    tick();
    scroller.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div ref={scroller} className="h-dvh overflow-y-auto overflow-x-clip bg-paper text-ink [scroll-behavior:smooth]">
      <Header scroller={scroller} go={go} />
      <main>
        <Hero go={go} />
        <Story scroller={scroller} />
        <Agent />
        <Principles />
        <Resources />
        <Judges />
        <Final />
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink-soft sm:px-8">
          <Logo size={24} />
          <p>Arcon Studio · the architect&apos;s studio, with an agent that knows your client&apos;s taste</p>
        </div>
      </footer>
    </div>
  );
}

function Header({ scroller, go }: { scroller: React.RefObject<HTMLDivElement | null>; go: (id: string) => void }) {
  const { scrollY } = useScroll({ container: scroller });
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-colors duration-300 ${scrolled ? "border-b border-line/60 bg-paper/80 backdrop-blur-md" : "border-b border-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <button type="button" onClick={() => scroller.current?.scrollTo({ top: 0, behavior: "smooth" })} className="justify-self-start" aria-label="Arcon Studio, back to the top">
          <span className="flex items-center gap-2">
            <Logo size={26} />
            <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Studio</span>
          </span>
        </button>
        <nav onMouseLeave={() => setHover(null)} className="hidden items-center gap-1 rounded-full border border-line/70 bg-paper-raised/60 p-1 text-sm backdrop-blur-md lg:flex">
          {NAV.map(([label, id]) => (
            <button key={id} type="button" onClick={() => go(id)} onMouseEnter={() => setHover(id)} className="relative whitespace-nowrap rounded-full px-4 py-1.5 text-ink-soft transition-colors hover:text-ink">
              {hover === id && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-brand/10 ring-1 ring-brand/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </nav>
        <div className="flex items-center gap-2 justify-self-end">
          <JudgesButton go={go} small />
          <Link to="/projects" onClick={() => transition()} className="glow-btn h-9 whitespace-nowrap px-4 text-sm sm:px-5">
            Open your studio
          </Link>
        </div>
      </div>
    </header>
  );
}

function JudgesButton({ go, small = false }: { go: (id: string) => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => go("judges")}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-brand/50 bg-brand/5 text-brand transition hover:-translate-y-0.5 hover:bg-brand/10 hover:shadow-[0_10px_30px_-12px_hsl(var(--brand))] ${small ? "h-9 px-3 text-sm" : "px-5 py-3.5 text-base"}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      For judges
    </button>
  );
}

const WORDS = ["who they are", "what they love", "how they live", "how they work"];

function Hero({ go }: { go: (id: string) => void }) {
  const still = useReducedMotion();
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, [still]);
  return (
    <section className="relative flex min-h-dvh items-center overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/3 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-4 pt-24 pb-16 text-center sm:px-8">
        <AnimatedMark size={110} />
        <motion.p initial={still ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 font-mono text-[11px] uppercase tracking-[0.3em] text-brand sm:text-xs">
          Arcon Studio · for architects and interior designers
        </motion.p>
        <h1 className="mt-5 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
          Design around
          <span className="relative block h-[1.15em] overflow-hidden text-brand">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={WORDS[word]}
                className="absolute inset-x-0 top-0 whitespace-nowrap"
                initial={{ y: "100%", opacity: 0, filter: "blur(8px)" }}
                animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                exit={{ y: "-100%", opacity: 0, filter: "blur(8px)" }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                {WORDS[word]}.
              </motion.span>
            </AnimatePresence>
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
          Sit with your client, and Arcon turns what they tell you into their style, three plans, a 3D walkthrough and a budget. An agent works beside you: it proposes, you approve.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
          <Link to="/projects" onClick={() => transition()} className="glow-btn px-6 py-3.5 text-base">
            Open your studio
          </Link>
          <JudgesButton go={go} />
          <button type="button" onClick={() => go("story")} className="rounded-full border border-line bg-paper-raised/70 px-5 py-3.5 text-base backdrop-blur transition hover:-translate-y-0.5 hover:border-brand hover:text-brand">
            See how it works ↓
          </button>
        </div>
        <motion.p animate={still ? undefined : { y: [0, 6, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mt-14 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Scroll to follow one project
        </motion.p>
      </div>
    </section>
  );
}

function Heading({ eyebrow, title, sub }: { eyebrow: string; title: ReactNode; sub?: string }) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{title}</h2>
      {sub && <p className="mt-4 text-lg text-ink-soft">{sub}</p>}
    </Reveal>
  );
}

// The same actions behind every button and every agent tool: pick one and see it from both sides.
const ACTIONS = [
  { id: "design-project", you: "Click “Design my space”", agent: "“Draw Priya three plans”", out: "Three plans from her interview, each with its reasons." },
  { id: "set-program", you: "Change the rooms she needs", agent: "“She works from home, add a study”", out: "New plans with a study, laid out three ways." },
  { id: "propose-change", you: "Type “make the study bigger”", agent: "“Give the study room for two desks”", out: "The change drawn over the plan, with its cost." },
  { id: "apply-change", you: "Press Approve", agent: "Asks you first, every time", out: "Version 3, re-priced. Nothing changes until you say so." },
  { id: "get-budget", you: "Open Budget & shopping", agent: "“What will the kitchen cost?”", out: "Cost by room and by trade, in the client's currency." },
  { id: "review-design", you: "Send for review", agent: "“Send it to Priya”", out: "The design goes to review; you record her answer." },
] as const;

function Agent() {
  const [on, setOn] = useState(0);
  const [side, setSide] = useState<"you" | "agent">("agent");
  const a = ACTIONS[on];
  return (
    <section id="agent" className="relative scroll-mt-20 border-y border-line bg-paper-raised/40 py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Heading eyebrow="The agent" title="One set of actions. You press them, or the agent does." sub="Studio is built on Agent-Native: every button you use is a tool the agent can call, on the same project, at the same time." />
        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <ul className="grid gap-2">
            {ACTIONS.map((x, i) => (
              <li key={x.id}>
                <button
                  type="button"
                  onClick={() => (tick(), setOn(i))}
                  aria-pressed={on === i}
                  className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left font-mono text-sm transition ${on === i ? "border-brand bg-brand/10 text-ink" : "border-line text-ink-soft hover:border-brand/50 hover:text-ink"}`}
                >
                  {x.id}
                  {x.id === "apply-change" && <span className="rounded-full bg-leaf/15 px-2 py-0.5 font-sans text-[11px] text-leaf">needs your approval</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className="rounded-3xl border border-line bg-paper p-6 sm:p-8">
            <div role="tablist" aria-label="Who presses it" className="inline-flex rounded-full border border-line p-1 text-sm">
              {(["you", "agent"] as const).map((s) => (
                <button key={s} role="tab" type="button" aria-selected={side === s} onClick={() => (tick(), setSide(s))} className="relative rounded-full px-4 py-1.5">
                  {side === s && <motion.span layoutId="side" className="absolute inset-0 rounded-full bg-btn" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                  <span className={`relative ${side === s ? "text-btn-ink" : "text-ink-soft"}`}>{s === "you" ? "You" : "The agent"}</span>
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait">
              <motion.div key={`${on}-${side}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="mt-8">
                <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">{side === "you" ? "In the project screen" : "In the chat beside it"}</p>
                <p className="mt-2 font-serif text-3xl sm:text-4xl">{side === "you" ? a.you : a.agent}</p>
                <div className="my-6 flex items-center gap-3 font-mono text-xs text-brand">
                  <span className="h-px flex-1 bg-gradient-to-r from-transparent to-brand/60" />
                  {a.id}
                  <span className="h-px flex-1 bg-gradient-to-l from-transparent to-brand/60" />
                </div>
                <p className="text-lg">{a.out}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  { k: "You lead", v: "You run every meeting and make every call. Studio does the drawing, pricing and paperwork fast." },
  { k: "Nothing changes until you approve", v: "The agent proposes; a change lands only when you press Approve." },
  { k: "Every choice says why", v: "Colours, materials and plans each name the client answer they came from." },
];

function Principles() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-24 sm:px-8">
      <Heading eyebrow="Built for architects" title="Faster work, with you in charge." />
      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.k} delay={i * 0.1}>
            <div className="h-full rounded-3xl border border-line bg-paper-raised p-6 transition hover:-translate-y-1 hover:border-brand">
              <p className="font-serif text-2xl">{p.k}</p>
              <p className="mt-2 text-ink-soft">{p.v}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const START = [
  { t: "Sign in", b: "With Google or email. Your studio is yours alone: your clients, your projects." },
  { t: "Add a client", b: "Their name and the project. Start the interview with them there." },
  { t: "Choose a plan", b: "Three plans appear as soon as the interview ends. Pick one, walk it in 3D." },
  { t: "Work with the agent", b: "Open the chat and ask for changes. Approve what you like." },
];

const FAQ = [
  { q: "Does my client need an account?", a: "No. You run the interview with them, in person or on a call, and record their answer when you review the design together." },
  { q: "What does the agent change on its own?", a: "Nothing. It reads, drafts and proposes. Applying a change and recording a client's answer always ask you first." },
  { q: "Where does the style come from?", a: "From the client's own answers: the look and feel they pick and the things they love. Each colour and material names its source." },
  { q: "What can I hand to a builder?", a: "A drawings pack: dimensioned plans, four elevations, door and window schedules, as a PDF and a DXF for CAD, plus the budget." },
  { q: "Which kinds of projects?", a: "Homes, apartments, cafés, offices, shops and studios, new builds or fit-outs, priced in the client's currency." },
  { q: "Can I use it from other agents?", a: "Yes. Studio's actions are open to other agents over MCP and A2A, the same tools the built-in agent uses." },
];

function Resources() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="resources" className="scroll-mt-20 border-t border-line py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-8">
        <Heading eyebrow="Resources" title="Start in four steps." />
        <ol className="mt-12 grid gap-4 md:grid-cols-4">
          {START.map((s, i) => (
            <Reveal key={s.t} delay={i * 0.08}>
              <li className="h-full rounded-3xl border border-line bg-paper-raised p-6">
                <p className="font-mono text-sm text-brand">0{i + 1}</p>
                <p className="mt-3 font-serif text-2xl">{s.t}</p>
                <p className="mt-2 text-sm text-ink-soft">{s.b}</p>
              </li>
            </Reveal>
          ))}
        </ol>
        <h3 className="mt-20 text-center font-serif text-3xl">Questions</h3>
        <div className="mx-auto mt-8 max-w-3xl divide-y divide-line rounded-3xl border border-line">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button type="button" onClick={() => (tick(), setOpen(open === i ? null : i))} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-lg">
                {f.q}
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-2xl text-brand">
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-6 text-ink-soft">
                    <span className="block pb-5">{f.a}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TRY = [
  "Open your studio and sign in with Google.",
  "Add a client, then answer the interview as them: pick a look, a feel and three things they love.",
  "Three plans appear. Choose one and walk through it in 3D.",
  "In the chat, ask: “Make the study big enough for two desks.” See it drawn over the plan, then approve it.",
  "Open Budget & shopping, then send the design for review and record the client's answer.",
];

function Judges() {
  return (
    <section id="judges" className="scroll-mt-20 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-brand/40 bg-paper-raised p-7 sm:p-10">
            <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">For judges</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Try it in five minutes.</h2>
            <ol className="mt-8 grid gap-4">
              {TRY.map((s, i) => (
                <li key={s} className="flex gap-4">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-brand/50 font-mono text-xs text-brand">{i + 1}</span>
                  <span className="pt-1">{s}</span>
                </li>
              ))}
            </ol>
            <p className="mt-8 rounded-2xl border border-line bg-paper p-4 text-sm text-ink-soft">
              The design engine comes from Arcon, which I built earlier; Arcon Studio and its agent workspace were built during the hackathon.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              <Link to="/projects" onClick={() => transition()} className="glow-btn px-6 py-3.5 text-base">
                Open the studio
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Final() {
  return (
    <section className="relative overflow-hidden border-t border-line py-28 text-center">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/10 blur-3xl" />
      <Reveal className="relative mx-auto max-w-2xl px-4">
        <AnimatedMark size={70} growing={false} />
        <h2 className="mt-6 font-serif text-4xl sm:text-5xl">Your next client meeting, with Studio beside you.</h2>
        <Link to="/projects" onClick={() => transition()} className="glow-btn mt-8 px-8 py-3.5 text-lg">
          Open your studio
        </Link>
      </Reveal>
    </section>
  );
}
