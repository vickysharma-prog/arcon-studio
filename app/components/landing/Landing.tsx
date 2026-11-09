import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { lazy, Suspense, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router";

import { AnimatedMark } from "@arcon/AnimatedMark";
import { Logo } from "@arcon/Logo";
import { PlanSvg } from "@arcon/plan/PlanSvg";
import { tick, transition } from "@arcon/fx/sfx";
import type { Brief } from "@engine/design/brief";
import type { Layout } from "@engine/layout/schema";

import data from "./sample.json";

// Arcon Studio's front page. The first screen is a whole page on its own; each scroll slides the next page up over
// it, and the last page is the first one again, so the story loops. The plans and the 3D house are Arcon's own,
// drawn by its engine for an invented client (scripts/landing-sample.ts).
const sample = data as unknown as { brief: Brief; options: Layout[] };
const HouseScene = lazy(() => import("@arcon/three/HouseScene"));

const PAGES = ["Home", "The client", "Plans", "3D", "The agent", "Actions", "Resources", "For judges"] as const;
const LOOP = PAGES.length; // the copy of the first page that the loop jumps back from
const JUMP: Record<string, number> = { story: 1, agent: 4, resources: 6, judges: 7 };

export function Landing() {
  const box = useRef<HTMLDivElement>(null);
  const [h, setH] = useState(800);
  const { scrollY } = useScroll({ container: box });
  const [at, setAt] = useState(0);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const on = () => setH(el.clientHeight || 800);
    on();
    const ro = new ResizeObserver(on);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useMotionValueEvent(scrollY, "change", (v) => {
    const el = box.current;
    // reaching the copy of the first page: back to the real one, at the same place, so nothing seems to move
    if (el && v >= LOOP * h - 1) {
      el.scrollTop = v - LOOP * h;
      return;
    }
    setAt(Math.min(LOOP - 1, Math.round(v / h)));
  });
  const go = (id: string) => {
    tick();
    box.current?.scrollTo({ top: (JUMP[id] ?? 0) * h, behavior: Math.abs((JUMP[id] ?? 0) - at) > 2 ? "instant" : "smooth" });
  };

  return (
    <div ref={box} className="relative h-dvh overflow-y-auto overflow-x-clip bg-paper text-ink [scrollbar-width:none]">
      <Header go={go} at={at} />
      <Dots at={at} go={(i) => box.current?.scrollTo({ top: i * h, behavior: "smooth" })} />
      <Page i={0} y={scrollY} h={h}>
        <Hero go={go} />
      </Page>
      <Page i={1} y={scrollY} h={h}>
        <Client />
      </Page>
      <Page i={2} y={scrollY} h={h}>
        <Plans />
      </Page>
      <Page i={3} y={scrollY} h={h} dark>
        <House live={at >= 2 && at <= 4} paused={at !== 3} />
      </Page>
      <Page i={4} y={scrollY} h={h}>
        <Agent />
      </Page>
      <Page i={5} y={scrollY} h={h}>
        <Actions />
      </Page>
      <Page i={6} y={scrollY} h={h}>
        <Resources />
      </Page>
      <Page i={7} y={scrollY} h={h}>
        <Judges />
      </Page>
      <Page i={LOOP} y={scrollY} h={h}>
        <Hero go={go} />
      </Page>
    </div>
  );
}

// One page of the stack: it sticks to the top while the next one slides over it, sinking back a little as it goes.
function Page({ i, y, h, dark = false, children }: { i: number; y: MotionValue<number>; h: number; dark?: boolean; children: ReactNode }) {
  const cover = useTransform(y, (v) => Math.min(1, Math.max(0, (v - i * h) / h)));
  const scale = useTransform(cover, [0, 1], [1, 0.9]);
  const shade = useTransform(cover, [0, 1], [0, 0.45]);
  const radius = useTransform(cover, [0, 1], [i === 0 || i === LOOP ? 0 : 32, 32]);
  return (
    <section className="sticky top-0 h-dvh overflow-hidden" aria-label={PAGES[i % LOOP]}>
      <motion.div
        style={{ scale, borderTopLeftRadius: radius, borderTopRightRadius: radius }}
        className={`relative h-full origin-top overflow-hidden ${dark ? "bg-[#0d1117] text-white" : "bg-paper"} ${i > 0 && i !== LOOP ? "shadow-[0_-30px_60px_-30px_rgba(15,23,42,0.35)]" : ""}`}
      >
        {children}
        <motion.div aria-hidden style={{ opacity: shade }} className="pointer-events-none absolute inset-0 bg-[#0b1220]" />
      </motion.div>
    </section>
  );
}

function Header({ go, at }: { go: (id: string) => void; at: number }) {
  const nav = [
    ["How it works", "story", [1, 2, 3]],
    ["The agent", "agent", [4, 5]],
    ["Resources", "resources", [6]],
  ] as const;
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-8 lg:grid lg:grid-cols-[1fr_auto_1fr]">
        <span className={`pointer-events-auto flex items-center gap-2 justify-self-start rounded-full px-2 py-1 transition-colors ${at === 3 ? "bg-white/90" : ""}`}>
          <Logo size={26} />
          <span className="rounded-full border border-line px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-ink-soft">Studio</span>
        </span>
        <nav className="pointer-events-auto hidden items-center gap-1 rounded-full border border-line/70 bg-paper-raised/80 p-1 text-sm shadow-sm backdrop-blur-md lg:flex">
          {nav.map(([label, id, on]) => (
            <button key={id} type="button" onClick={() => go(id)} className="relative whitespace-nowrap rounded-full px-4 py-1.5 text-ink-soft transition-colors hover:text-ink">
              {(on as readonly number[]).includes(at) && <motion.span layoutId="nav-on" className="absolute inset-0 rounded-full bg-brand/10 ring-1 ring-brand/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{label}</span>
            </button>
          ))}
        </nav>
        <div className="pointer-events-auto flex items-center gap-2 justify-self-end">
          <JudgesButton go={go} small />
          <Link to="/projects" onClick={() => transition()} className="glow-btn h-9 whitespace-nowrap px-4 text-sm sm:px-5">
            Open your studio
          </Link>
        </div>
      </div>
    </header>
  );
}

function Dots({ at, go }: { at: number; go: (i: number) => void }) {
  return (
    <ol className="fixed right-4 top-1/2 z-50 hidden -translate-y-1/2 flex-col gap-2.5 md:flex" aria-label="Pages">
      {PAGES.map((p, i) => (
        <li key={p}>
          <button type="button" onClick={() => (tick(), go(i))} aria-label={p} aria-current={i === at ? "step" : undefined} className="group flex items-center justify-end gap-2">
            <span className="text-xs text-ink-soft opacity-0 transition group-hover:opacity-100">{p}</span>
            <span className={`block rounded-full transition-all duration-300 ${i === at ? "h-6 w-2 bg-brand" : "h-2 w-2 bg-ink-soft/40 group-hover:bg-brand"}`} />
          </button>
        </li>
      ))}
    </ol>
  );
}

function JudgesButton({ go, small = false }: { go: (id: string) => void; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={() => go("judges")}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-brand/50 bg-paper/80 text-brand backdrop-blur transition hover:-translate-y-0.5 hover:bg-brand/10 hover:shadow-[0_10px_30px_-12px_hsl(var(--brand))] ${small ? "h-9 px-3 text-sm" : "px-5 py-3.5 text-base"}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      For judges
    </button>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">{children}</p>;
}

// Content that arrives as its page slides in.
function In({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 28, filter: "blur(6px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }} viewport={{ amount: 0.4 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>
      {children}
    </motion.div>
  );
}

function Grid() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage: "linear-gradient(hsl(var(--brand)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand)) 1px, transparent 1px)",
        backgroundSize: "44px 44px",
        maskImage: "radial-gradient(ellipse at 50% 45%, black 25%, transparent 75%)",
      }}
    />
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
  const plan = sample.options[0]!;
  return (
    <div className="relative flex h-full flex-col">
      <Grid />
      <div aria-hidden className="pointer-events-none absolute right-[-10rem] top-[-10rem] h-[36rem] w-[36rem] rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-4 pt-20 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <div>
          <Eyebrow>Arcon Studio · for architects and interior designers</Eyebrow>
          <h1 className="mt-5 font-serif text-5xl leading-[1.04] sm:text-6xl xl:text-7xl">
            Design around
            <span className="relative block h-[1.15em] overflow-hidden text-brand">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={WORDS[word]}
                  className="absolute left-0 top-0 whitespace-nowrap"
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
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Sit with your client, and Arcon turns what they tell you into their style, three plans, a 3D home and a budget. An agent works beside you: it proposes, you approve.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-2.5">
            <Link to="/projects" onClick={() => transition()} className="glow-btn px-6 py-3.5 text-base">
              Open your studio
            </Link>
            <JudgesButton go={go} />
          </div>
        </div>
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden lg:block">
          <div className="rounded-3xl border border-line bg-paper-raised p-5 shadow-[0_40px_90px_-50px_hsl(var(--brand))]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Priya&apos;s house</span>
              <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs text-brand">{plan.concept?.name}</span>
            </div>
            <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} whileInView={{ clipPath: "inset(0 0 0% 0)" }} transition={{ duration: 1.6, ease: [0.65, 0, 0.35, 1], delay: 0.4 }}>
              <PlanSvg layout={plan} units="metric" className="mx-auto mt-3 max-h-[46vh] w-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
      <div className="relative mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pb-6 text-xs text-ink-soft sm:px-8">
        <span>Interview · style · plans · 3D · budget · drawings · client review</span>
        <motion.span animate={still ? undefined : { y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="font-mono uppercase tracking-[0.25em]">
          Scroll ↓
        </motion.span>
      </div>
    </div>
  );
}

const TALK = [
  { who: "a", text: "Who will live here, and how do your days go?" },
  { who: "c", text: "Me, my husband and our two kids. We cook together most evenings." },
  { who: "a", text: "Pick a look, and how it should feel." },
  { who: "c", text: "Scandinavian. Calm and airy, with lots of green." },
  { who: "a", text: "Lovely. Here is Priya's style." },
] as const;

/** A count that runs up while its page is on screen and starts over, so the scene plays in a loop. */
function useLoop(count: number, ms: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [n, setN] = useState(0);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSeen(!!e?.isIntersecting && e.intersectionRatio > 0.5), { threshold: [0, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    if (!seen) return;
    const t = setInterval(() => setN((v) => (v + 1) % (count + 2)), ms);
    return () => clearInterval(t);
  }, [seen, count, ms]);
  return [ref, Math.min(n, count)] as const;
}

function Client() {
  const [ref, n] = useLoop(TALK.length, 1300);
  const b = sample.brief;
  return (
    <div ref={ref} className="relative mx-auto grid h-full max-w-6xl items-center gap-8 px-4 pt-16 sm:px-8 lg:grid-cols-2">
      <div>
        <In>
          <Eyebrow>01 · Sit with your client</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Their answers become their style.</h2>
          <p className="mt-4 max-w-md text-lg text-ink-soft">Run Arcon&apos;s interview together, in the room or on a call. Every colour and material says which answer it came from.</p>
        </In>
        <div className="mt-6 flex min-h-[15rem] flex-col justify-end gap-2.5">
          <AnimatePresence>
            {TALK.slice(0, n).map((m) => (
              <motion.p
                key={m.text}
                layout
                initial={{ opacity: 0, y: 14, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.who === "c" ? "self-end bg-brand text-white" : "self-start border border-line bg-paper-raised"}`}
              >
                {m.text}
              </motion.p>
            ))}
          </AnimatePresence>
        </div>
      </div>
      <In delay={0.15}>
        <div className="rounded-3xl border border-line bg-paper-raised p-6 shadow-[0_40px_90px_-50px_hsl(var(--brand))]">
          <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">Priya&apos;s style</p>
          <p className="mt-2 font-serif text-4xl">{b.name}</p>
          <p className="mt-2 text-sm text-ink-soft">{b.summary}</p>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {b.palette.slice(0, 5).map((c, i) => (
              <motion.div
                key={c.name}
                animate={{ scaleY: n >= 4 ? 1 : 0.15, opacity: n >= 4 ? 1 : 0.35 }}
                transition={{ delay: n >= 4 ? i * 0.07 : 0, type: "spring", stiffness: 150, damping: 18 }}
                style={{ background: c.hex, originY: 1 }}
                className="flex h-28 items-end rounded-2xl p-2"
              >
                <span className="text-[10px] mix-blend-difference text-white/80">{c.name}</span>
              </motion.div>
            ))}
          </div>
          <ul className="mt-5 grid gap-1.5 text-sm">
            {b.materials.slice(0, 3).map((m) => (
              <li key={m.name}>
                <span className="font-medium">{m.name}</span> <span className="text-ink-soft">· {m.where}</span> <span className="text-brand">· from {m.from.join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
      </In>
    </div>
  );
}

function Plans() {
  const [ref, n] = useLoop(3, 2200);
  const on = n % 3;
  return (
    <div ref={ref} className="relative flex h-full flex-col justify-center px-4 pt-16 sm:px-8">
      <Grid />
      <In className="relative mx-auto max-w-2xl text-center">
        <Eyebrow>02 · Three plans</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Drawn in seconds, from her brief.</h2>
      </In>
      <div className="relative mx-auto mt-8 grid w-full max-w-6xl grid-cols-3 gap-3 sm:gap-5">
        {sample.options.map((o, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 * i, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`rounded-3xl border bg-paper-raised p-3 transition-all duration-500 sm:p-4 ${on === i ? "-translate-y-2 border-brand shadow-[0_30px_70px_-40px_hsl(var(--brand))]" : "border-line"}`}
          >
            <p className="truncate text-xs font-medium sm:text-sm">{o.concept?.name}</p>
            <motion.div initial={{ clipPath: "inset(0 0 100% 0)" }} whileInView={{ clipPath: "inset(0 0 0% 0)" }} transition={{ duration: 1.4, delay: 0.3 + 0.2 * i, ease: [0.65, 0, 0.35, 1] }}>
              <PlanSvg layout={o} units="metric" className="mx-auto mt-2 max-h-[42vh] w-full" />
            </motion.div>
            <p className="mt-2 hidden text-xs text-ink-soft sm:line-clamp-2">{o.concept?.summary}</p>
            <p className={`mt-2 text-center text-xs transition ${on === i ? "text-brand" : "text-transparent"}`}>{on === i ? "✓ Chosen" : "·"}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function House({ live, paused }: { live: boolean; paused: boolean }) {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return (
    <div className="relative h-full">
      {ready && live ? (
        <Suspense fallback={<Building />}>
          <div className="absolute inset-0">
            <HouseScene layout={sample.options[0]!} brief={sample.brief as never} mode="orbit" playing={false} paused={paused} autoRotate cutaway />
          </div>
        </Suspense>
      ) : (
        <Building />
      )}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/70 to-transparent px-4 pb-10 pt-32 sm:px-8">
        <div className="mx-auto max-w-6xl">
          <In>
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-sky-300">03 · Walk them through it</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight text-white sm:text-5xl">The plan, as a furnished home in 3D.</h2>
            <p className="mt-3 max-w-xl text-white/70">Arcon&apos;s real model, in Priya&apos;s style. Look around it, or walk room by room with your client, by day or by night.</p>
          </In>
        </div>
      </div>
    </div>
  );
}

function Building() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-white/60">
      <AnimatedMark size={64} growing={false} />
      Building the model
    </div>
  );
}

function Agent() {
  const [ref, n] = useLoop(4, 1500);
  const plan = sample.options[0]!;
  const study = plan.floors[0]!.spaces.find((s) => s.name === "Study")?.rect ?? { x: 0, y: 0, w: 4, h: 3 };
  const grown = n >= 2;
  const applied = n >= 4;
  const r = grown ? { ...study, y: study.y - 1.5, h: study.h + 1.5 } : study;
  return (
    <div ref={ref} className="relative mx-auto grid h-full max-w-6xl items-center gap-8 px-4 pt-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div>
        <In>
          <Eyebrow>04 · The agent proposes. You decide.</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Ask in plain words. Approve what you like.</h2>
          <p className="mt-4 max-w-md text-lg text-ink-soft">The agent draws its change over the plan with the cost. Nothing changes until you press Approve.</p>
        </In>
        <div className="mt-6 flex min-h-[15rem] flex-col gap-2.5 text-sm">
          <p className="self-end rounded-2xl bg-brand px-4 py-2.5 text-white">Make the study big enough for two desks.</p>
          <motion.div animate={{ opacity: n >= 1 ? 1 : 0, y: n >= 1 ? 0 : 10 }} className="rounded-2xl border border-line bg-paper-raised p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Agent · proposal</p>
            <p className="mt-1">Study {study.w.toFixed(1)} × {study.h.toFixed(1)} m → {study.w.toFixed(1)} × {(study.h + 1.5).toFixed(1)} m, the bath moves up.</p>
            <p className="mt-1 text-ink-soft">Cost +₹1.2L · becomes version 3</p>
            <div className="mt-3 flex gap-2">
              <motion.span animate={{ scale: n === 3 ? [1, 0.92, 1] : 1 }} className={`rounded-full px-3.5 py-1.5 text-xs transition-colors ${n >= 3 ? "bg-leaf text-white" : "bg-btn text-btn-ink"}`}>
                {n >= 3 ? "✓ Approved" : "Approve"}
              </motion.span>
              <span className="rounded-full border border-line px-3.5 py-1.5 text-xs text-ink-soft">Reject</span>
            </div>
          </motion.div>
          <motion.p animate={{ opacity: applied ? 1 : 0 }} className="text-xs text-leaf">
            Applied by you. The plan, the 3D and the budget are up to date.
          </motion.p>
        </div>
      </div>
      <In delay={0.15}>
        <div className="rounded-3xl border border-line bg-paper-raised p-5 shadow-[0_40px_90px_-50px_hsl(var(--brand))]">
          <PlanSvg layout={plan} units="metric" className="mx-auto max-h-[60vh] w-full">
            <motion.rect
              initial={false}
              animate={{ x: r.x, y: r.y, width: r.w, height: r.h, opacity: n >= 1 ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 110, damping: 18 }}
              fill={applied ? "hsl(var(--leaf) / 0.3)" : "hsl(var(--brand) / 0.25)"}
              stroke={applied ? "hsl(var(--leaf))" : "hsl(var(--brand))"}
              strokeWidth={0.08}
              strokeDasharray={applied ? undefined : "0.3 0.2"}
            />
          </PlanSvg>
        </div>
      </In>
    </div>
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

function Actions() {
  const [on, setOn] = useState(2);
  const [side, setSide] = useState<"you" | "agent">("agent");
  const a = ACTIONS[on];
  return (
    <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-4 pt-16 sm:px-8">
      <In className="mx-auto max-w-2xl text-center">
        <Eyebrow>Built on Agent-Native</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">One set of actions. You press them, or the agent does.</h2>
      </In>
      <In delay={0.1} className="mt-8 grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {ACTIONS.map((x, i) => (
            <li key={x.id}>
              <button
                type="button"
                onClick={() => (tick(), setOn(i))}
                aria-pressed={on === i}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl border px-4 py-2.5 text-left font-mono text-xs transition sm:text-sm ${on === i ? "border-brand bg-brand/10 text-ink" : "border-line text-ink-soft hover:border-brand/50 hover:text-ink"}`}
              >
                {x.id}
                {x.id === "apply-change" && <span className="hidden rounded-full bg-leaf/15 px-2 py-0.5 font-sans text-[11px] text-leaf sm:inline">needs your approval</span>}
              </button>
            </li>
          ))}
        </ul>
        <div className="rounded-3xl border border-line bg-paper-raised p-6 sm:p-8">
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
              <p className="mt-2 font-serif text-3xl">{side === "you" ? a.you : a.agent}</p>
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
      </In>
    </div>
  );
}

const START = [
  { t: "Sign in", b: "With Google or email. Your studio is yours alone." },
  { t: "Add a client", b: "Their name and the project, then the interview with them." },
  { t: "Choose a plan", b: "Three plans appear when the interview ends. Walk one in 3D." },
  { t: "Work with the agent", b: "Ask for changes in the chat. Approve what you like." },
];

const FAQ = [
  { q: "Does my client need an account?", a: "No. You run the interview with them, in person or on a call, and record their answer when you review the design together." },
  { q: "What does the agent change on its own?", a: "Nothing. It reads, drafts and proposes. Applying a change and recording a client's answer always ask you first." },
  { q: "What can I hand to a builder?", a: "A drawings pack: dimensioned plans, four elevations, door and window schedules, as a PDF and a DXF for CAD, plus the budget." },
  { q: "Which kinds of projects?", a: "Homes, apartments, cafés, offices, shops and studios, new builds or fit-outs, priced in the client's currency." },
  { q: "Can other agents use it?", a: "Yes. Studio's actions are open to other agents over MCP and A2A, the same tools the built-in agent uses." },
];

function Resources() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="relative mx-auto grid h-full max-w-6xl items-center gap-8 px-4 pt-16 sm:px-8 lg:grid-cols-2">
      <In>
        <Eyebrow>Resources</Eyebrow>
        <h2 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">Start in four steps.</h2>
        <ol className="mt-6 grid gap-3">
          {START.map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl border border-line bg-paper-raised p-4">
              <span className="font-mono text-sm text-brand">0{i + 1}</span>
              <span>
                <span className="block font-medium">{s.t}</span>
                <span className="text-sm text-ink-soft">{s.b}</span>
              </span>
            </li>
          ))}
        </ol>
      </In>
      <In delay={0.1}>
        <div className="divide-y divide-line rounded-3xl border border-line bg-paper-raised">
          {FAQ.map((f, i) => (
            <div key={f.q}>
              <button type="button" onClick={() => (tick(), setOpen(open === i ? null : i))} aria-expanded={open === i} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                {f.q}
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-xl text-brand">
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-5 text-sm text-ink-soft">
                    <span className="block pb-4">{f.a}</span>
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </In>
    </div>
  );
}

const TRY = [
  "Open your studio and sign in with Google.",
  "Add a client, then answer the interview as them: a look, a feel and three things they love.",
  "Three plans appear. Choose one and walk through it in 3D.",
  "In the chat, ask: “Make the study big enough for two desks.” See it over the plan, then approve it.",
  "Open Budget & shopping, then send the design for review and record the client's answer.",
];

function Judges() {
  return (
    <div className="relative flex h-full items-center px-4 pt-16 sm:px-8">
      <Grid />
      <In className="relative mx-auto w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-brand/40 bg-paper-raised p-7 shadow-[0_50px_100px_-60px_hsl(var(--brand))] sm:p-10">
          <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <Eyebrow>For judges</Eyebrow>
          <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Try it in five minutes.</h2>
          <ol className="mt-6 grid gap-3">
            {TRY.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-brand/50 font-mono text-xs text-brand">{i + 1}</span>
                <span className="pt-0.5">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 rounded-2xl border border-line bg-paper p-4 text-sm text-ink-soft">
            The design engine comes from Arcon, which I built earlier; Arcon Studio and its agent workspace were built during the hackathon.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link to="/projects" onClick={() => transition()} className="glow-btn px-6 py-3.5 text-base">
              Open the studio
            </Link>
            <span className="text-sm text-ink-soft">Keep scrolling to start over ↓</span>
          </div>
        </div>
      </In>
    </div>
  );
}

