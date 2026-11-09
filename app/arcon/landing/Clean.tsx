import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

import { Logo } from "@arcon/Logo";
import { tick, transition } from "@arcon/fx/sfx";
import { PlanSvg } from "@arcon/plan/PlanSvg";
import { planOptionsFor } from "@engine/design/options";
import { buildingShell } from "@engine/layout/footprint";
import { TEMPLATES } from "@engine/layout/templates";
import type { Layout } from "@engine/layout/schema";

// Arcon Studio's front page, kept short and clean: one big line, then the scroll brings the work in around it (a fan
// of real plans, the 3D house and the client's style), then the app itself holds the screen while a project goes
// from interview to approval. The pictures of the house are stills of Studio's own 3D, so nothing heavy runs here.

function useSamplePlans(): Layout[] {
  return useMemo(() => {
    const program = { ...TEMPLATES.house, floors: 1, rooms: TEMPLATES.house.rooms.map((r) => ({ ...r, floor: 0 })) };
    return planOptionsFor(program, buildingShell(program, { width: 16, depth: 10 }), { space_type: "house" });
  }, []);
}

const PALETTE = [
  { name: "Soft white", hex: "#F4F1EA" },
  { name: "Light oak", hex: "#C8A97E" },
  { name: "Sea glass", hex: "#9FC2B8" },
  { name: "Linen", hex: "#E3D7C3" },
  { name: "Charcoal", hex: "#3B3F45" },
];

export function JudgesLink({ big = false }: { big?: boolean }) {
  return (
    <a
      href="/judges"
      onClick={() => transition()}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-brand/40 bg-paper/70 text-brand backdrop-blur transition hover:-translate-y-0.5 hover:bg-brand/10 ${big ? "px-6 py-3.5 text-base" : "h-10 px-4 text-sm"}`}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
      </span>
      For judges
    </a>
  );
}

export function CleanHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? "bg-paper/75 shadow-[0_1px_0_hsl(var(--border))] backdrop-blur-xl" : ""}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-10">
        <a href="#top" aria-label="Arcon Studio, back to the top">
          <Logo size={28} />
        </a>
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <a href="#how" onClick={() => tick()} className="hidden rounded-full px-4 py-2 text-sm text-ink-soft transition hover:text-ink md:block">
            How it works
          </a>
          <a href="/resources" className="hidden rounded-full px-4 py-2 text-sm text-ink-soft transition hover:text-ink md:block">
            Resources
          </a>
          <JudgesLink />
          <Link href="/projects" onClick={() => transition()} className="flex h-10 items-center rounded-full bg-ink px-5 text-sm text-paper shadow-sm transition hover:-translate-y-0.5">
            Open your studio
          </Link>
        </nav>
      </div>
    </header>
  );
}

const WORDS = ["drawn in minutes.", "walked in 3D.", "priced by room.", "ready to build."];

// The cards that fly in around the headline as the page scrolls, and where each settles on the arc.
type Card = { key: string; body: (plans: Layout[]) => ReactNode };
const CARDS: Card[] = [
  { key: "room", body: () => <Photo src="/landing/living-room.webp" label="Living room · 3D" /> },
  { key: "plan-a", body: (p) => <PlanCard layout={p[0]} label="Open great room" /> },
  { key: "style", body: () => <StyleCard /> },
  { key: "house", body: () => <Photo src="/landing/house-above.webp" label="The whole house" /> },
  { key: "budget", body: () => <BudgetCard /> },
  { key: "plan-b", body: (p) => <PlanCard layout={p[1] ?? p[0]} label="Central hall" /> },
  { key: "agent", body: () => <AgentCard /> },
];

export function CleanHero() {
  const still = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const plans = useSamplePlans();
  const [word, setWord] = useState(0);
  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, [still]);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const lift = useTransform(scrollYProgress, [0, 0.6], ["0vh", "-4vh"]);
  const shrink = useTransform(scrollYProgress, [0, 0.6], [1, 0.92]);
  const hint = useTransform(scrollYProgress, [0, 0.12], [1, 0]);
  // the words under the headline step aside as the work fans in; the header keeps the way in
  const aside = useTransform(scrollYProgress, [0.04, 0.22], [1, 0]);
  const asideY = useTransform(scrollYProgress, [0.04, 0.22], [0, -20]);
  const events = useTransform(aside, (v) => (v > 0.5 ? "auto" : "none"));
  return (
    <section id="top" ref={ref} className="relative" style={{ height: "190vh" }}>
      <div className="sticky top-0 flex h-dvh flex-col items-center overflow-hidden">
        <Blobs />
        <motion.div style={{ y: lift, scale: shrink }} className="relative z-10 flex flex-col items-center px-5 pt-[14vh] text-center">
          <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-full border border-line bg-paper/70 px-3.5 py-1 text-xs text-ink-soft backdrop-blur">
            For architects and interior designers
          </motion.p>
          <h1 className="mt-6 font-serif text-[clamp(2.75rem,7.2vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.03em]">
            <span className="block">Your client&apos;s taste,</span>
            <span className="relative block h-[1.08em] overflow-hidden">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={WORDS[word]}
                  className="absolute inset-x-0 top-0 whitespace-nowrap bg-gradient-to-r from-brand via-sky-500 to-leaf bg-clip-text text-transparent"
                  initial={{ y: "100%", opacity: 0, filter: "blur(10px)" }}
                  animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
                  exit={{ y: "-100%", opacity: 0, filter: "blur(10px)" }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                  {WORDS[word]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>
          <motion.div style={{ opacity: aside, y: asideY, pointerEvents: events }} className="flex flex-col items-center">
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Sit with your client. Studio turns what they love into a style, three plans and a 3D home, and an agent refines it with you. Nothing changes until you approve.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/projects" onClick={() => transition()} className="flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-base text-paper shadow-[0_20px_50px_-20px_rgba(15,23,42,0.6)] transition hover:-translate-y-0.5">
              Open your studio
            </Link>
            <JudgesLink big />
          </div>
          </motion.div>
        </motion.div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[40vh]">
          {CARDS.map((c, i) => (
            <FanCard key={c.key} i={i - (CARDS.length - 1) / 2} p={scrollYProgress}>
              {c.body(plans)}
            </FanCard>
          ))}
        </div>
        <motion.p style={{ opacity: hint }} className="absolute bottom-6 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-soft">
          Scroll
        </motion.p>
      </div>
    </section>
  );
}

/** One card of the fan: it flies in from far to the side and settles on an arc under the headline. */
function FanCard({ i, p, children }: { i: number; p: MotionValue<number>; children: ReactNode }) {
  const t = useTransform(p, [0.14 + Math.abs(i) * 0.03, 0.62 + Math.abs(i) * 0.03], [0, 1], { clamp: true });
  const x = useTransform(t, [0, 1], [`${i * 360}%`, `${i * 102}%`]);
  const y = useTransform(t, [0, 1], ["60vh", `${Math.abs(i) * Math.abs(i) * 1.6}vh`]);
  const rotate = useTransform(t, [0, 1], [i * 28, i * 6]);
  const opacity = useTransform(t, [0, 0.3, 1], [0, 1, 1]);
  return (
    <motion.div style={{ x, y, rotate, opacity }} className="absolute -bottom-[6vh] left-1/2 h-[44vh] w-[32vh] -translate-x-1/2">
      <div className="h-full overflow-hidden rounded-[1.4rem] border border-white/70 bg-paper-raised shadow-[0_30px_60px_-30px_rgba(15,23,42,0.45)]">{children}</div>
    </motion.div>
  );
}

// Soft colour behind the headline. Still on purpose: big blurred shapes are costly to move, and the page should scroll smoothly.
function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div className="absolute left-[8%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-brand/20 blur-[90px]" />
      <div className="absolute right-[6%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-sky-300/30 blur-[90px]" />
      <div className="absolute bottom-[8%] left-1/2 h-[22rem] w-[30rem] -translate-x-1/2 rounded-full bg-leaf/15 blur-[100px]" />
    </div>
  );
}

const Tag = ({ children }: { children: ReactNode }) => <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-soft">{children}</p>;

function Photo({ src, label }: { src: string; label: string }) {
  return (
    <div className="relative h-full">
      <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
      <span className="absolute bottom-2 left-2 rounded-full bg-paper/85 px-2.5 py-1 text-[10px] backdrop-blur">{label}</span>
    </div>
  );
}

function PlanCard({ layout, label }: { layout?: Layout; label: string }) {
  return (
    <div className="flex h-full flex-col p-3">
      <Tag>Plan</Tag>
      <p className="mt-0.5 text-xs font-medium">{label}</p>
      <div className="mt-2 flex flex-1 items-center">{layout && <PlanSvg layout={layout} units="metric" className="w-full" />}</div>
    </div>
  );
}

function StyleCard() {
  return (
    <div className="flex h-full flex-col p-3">
      <Tag>Priya&apos;s style</Tag>
      <p className="mt-1 font-serif text-lg leading-tight">Airy Scandinavian</p>
      <div className="mt-3 grid flex-1 grid-cols-5 gap-1">
        {PALETTE.map((c) => (
          <span key={c.name} className="rounded-md" style={{ background: c.hex }} />
        ))}
      </div>
      <p className="mt-2 text-[10px] text-brand">from calm and airy</p>
    </div>
  );
}

function BudgetCard() {
  return (
    <div className="flex h-full flex-col justify-between p-3">
      <div>
        <Tag>Budget · INR</Tag>
        <p className="mt-1 font-serif text-2xl leading-tight">₹53L–₹83L</p>
      </div>
      <div className="space-y-1.5">
        {[
          ["Construction", 88],
          ["Furniture", 34],
          ["Kitchen", 18],
          ["Plants", 6],
        ].map(([k, v]) => (
          <div key={k as string}>
            <p className="flex justify-between text-[10px] text-ink-soft">
              <span>{k}</span>
            </p>
            <span className="mt-0.5 block h-1.5 rounded-full bg-brand/80" style={{ width: `${v}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AgentCard() {
  return (
    <div className="flex h-full flex-col justify-between bg-gradient-to-b from-brand/10 to-transparent p-3">
      <Tag>The agent</Tag>
      <p className="rounded-xl bg-brand px-2.5 py-2 text-[11px] text-white">Make the study big enough for two desks.</p>
      <div className="rounded-xl border border-line bg-paper p-2 text-[11px]">
        <p>Study 12 → 16 m²</p>
        <p className="text-ink-soft">+₹1.2L · version 3</p>
        <span className="mt-1.5 inline-block rounded-full bg-leaf px-2 py-0.5 text-[10px] text-white">✓ Approved</span>
      </div>
    </div>
  );
}

// The app, held on screen while a project runs through it. The words change on the left and the window on the right.
const STEPS = [
  { eyebrow: "01 · Sit with your client", title: "Run the interview together.", body: "Who lives there, how their days go, the budget, a look, a feel and three things they love. Typed or spoken, in their language.", chip: "Typed or spoken · English, हिंदी, Hinglish" },
  { eyebrow: "02 · Their style", title: "Their taste, made visible.", body: "A palette, materials, light and plants, each naming the answer it came from, so the choices are easy to explain.", chip: "From: calm and airy" },
  { eyebrow: "03 · Three plans", title: "Three plans, honest trade-offs.", body: "Drawn for their plot and their people, each clear about what it does best and what it gives up.", chip: "The least floor lost to halls" },
  { eyebrow: "04 · Walk it in 3D", title: "Walk them through it.", body: "The chosen plan as a furnished home, room by room, by day or by night, in the client's style.", chip: "Living room · furnished in their style" },
  { eyebrow: "05 · The agent", title: "It proposes. You approve.", body: "Ask in plain words. The agent draws the change over the plan with its cost, and waits for you.", chip: "+₹1.2L · Approve?" },
  { eyebrow: "06 · Hand it over", title: "Approved, priced and drawn.", body: "The client's answer on record, a budget in their currency, and a drawings pack as PDF and DXF.", chip: "✓ Priya approved version 3" },
];

export function AppStory() {
  const ref = useRef<HTMLElement>(null);
  const plans = useSamplePlans();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [at, setAt] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => setAt(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length)))));
  const s = STEPS[at]!;
  return (
    <section id="how" ref={ref} className="relative scroll-mt-0" style={{ height: `${STEPS.length * 80 + 30}vh` }}>
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-10 px-5 pt-16 sm:px-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="grid">
            <AnimatePresence initial={false}>
              <motion.div
                key={at}
                className="[grid-area:1/1]"
                initial={{ opacity: 0, y: 30, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -30, filter: "blur(8px)" }}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">{s.eyebrow}</p>
                <h2 className="mt-4 font-serif text-[clamp(2.25rem,4.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em]">{s.title}</h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">{s.body}</p>
              </motion.div>
            </AnimatePresence>
            <div className="mt-10 flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === at ? "w-10 bg-brand" : i < at ? "w-3 bg-brand/40" : "w-3 bg-line"}`} />
              ))}
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[calc((100dvh-11rem)*1.6)]">
            <div className="overflow-hidden rounded-[1.6rem] border border-line bg-paper-raised shadow-[0_50px_120px_-50px_rgba(15,23,42,0.45)]">
              <div className="flex items-center gap-2 border-b border-line px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                <span className="ml-3 flex-1 truncate rounded-full bg-paper px-3 py-1 text-center font-mono text-[11px] text-ink-soft">arcon-studio.vercel.app/projects/priyas-house</span>
              </div>
              <div className="relative aspect-[16/10]">
                <AnimatePresence initial={false}>
                  <motion.div key={at} className="absolute inset-0" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                    <Screen at={at} plans={plans} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <AnimatePresence mode="wait">
              <motion.span
                key={at}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 260, damping: 22 }}
                className="absolute -bottom-5 left-6 flex items-center gap-2 rounded-full border border-line bg-paper px-4 py-2 text-sm shadow-[0_15px_40px_-15px_rgba(15,23,42,0.4)]"
              >
                <span className="h-2 w-2 rounded-full bg-brand" />
                {s.chip}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

const TALK = [
  { c: false, t: "Who will live here, and how do your days go?" },
  { c: true, t: "Me, my husband and our two kids. We cook together most evenings." },
  { c: false, t: "Pick a look, and how it should feel." },
  { c: true, t: "Scandinavian. Calm and airy, with lots of green." },
  { c: false, t: "Now three things you love." },
];

function Screen({ at, plans }: { at: number; plans: Layout[] }) {
  if (at === 0)
    return (
      <div className="flex h-full flex-col justify-end gap-2.5 p-6">
        {TALK.map((m, i) => (
          <motion.p
            key={m.t}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.35 }}
            className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${m.c ? "self-end bg-brand text-white" : "self-start border border-line bg-paper"}`}
          >
            {m.t}
          </motion.p>
        ))}
      </div>
    );
  if (at === 1)
    return (
      <div className="flex h-full flex-col p-6">
        <Tag>Priya&apos;s style</Tag>
        <p className="mt-2 font-serif text-4xl">Airy Scandinavian</p>
        <p className="mt-2 max-w-lg text-sm text-ink-soft">Light, calm rooms in pale wood and soft textiles. Priya chose a Scandinavian look, calm and airy and green.</p>
        <div className="mt-5 grid flex-1 grid-cols-5 gap-2">
          {PALETTE.map((c, i) => (
            <motion.div
              key={c.name}
              initial={{ scaleY: 0.2, opacity: 0 }}
              animate={{ scaleY: 1, opacity: 1 }}
              transition={{ delay: 0.1 + i * 0.07, type: "spring", stiffness: 140, damping: 18 }}
              style={{ background: c.hex, originY: 1 }}
              className="flex items-end rounded-2xl p-2"
            >
              <span className={`text-[11px] ${i === 4 ? "text-white/80" : "text-black/55"}`}>{c.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    );
  if (at === 2)
    return (
      <div className="grid h-full grid-cols-3 gap-3 p-5">
        {plans.slice(0, 3).map((l, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.12 }}
            className={`flex flex-col rounded-2xl border p-3 ${i === 0 ? "border-brand shadow-[0_20px_40px_-25px_hsl(var(--brand))]" : "border-line"}`}
          >
            <p className="truncate text-xs font-medium">{l.concept?.name ?? `Plan ${i + 1}`}</p>
            <div className="flex flex-1 items-center">
              <PlanSvg layout={l} units="metric" className="w-full" />
            </div>
            <p className={`text-center text-[11px] ${i === 0 ? "text-brand" : "text-ink-soft"}`}>{i === 0 ? "✓ Chosen" : "Choose"}</p>
          </motion.div>
        ))}
      </div>
    );
  if (at === 3)
    return (
      <div className="relative h-full">
        <motion.img src="/landing/living-room.webp" alt="The living room in 3D" className="h-full w-full object-cover" initial={{ scale: 1.08 }} animate={{ scale: 1 }} transition={{ duration: 2.4, ease: "easeOut" }} />
        <span className="absolute left-4 top-4 rounded-full bg-paper/85 px-3 py-1 font-mono text-xs backdrop-blur">● Living room</span>
        <img src="/landing/house-above.webp" alt="" className="absolute bottom-4 right-4 w-1/3 rounded-xl border border-white/70 shadow-lg" />
      </div>
    );
  if (at === 4) return <Proposal plan={plans[0]} />;
  return (
    <div className="flex h-full flex-col justify-center gap-3 p-6">
      {[
        { k: "Client review", v: "✓ Approved", s: "Priya approved version 3, in your meeting", c: "text-leaf" },
        { k: "Budget", v: "₹53L – ₹83L", s: "By room and by trade, in INR", c: "" },
        { k: "Drawings pack", v: "PDF + DXF", s: "Plans, four elevations, door and window schedules", c: "" },
      ].map((r, i) => (
        <motion.div key={r.k} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.15, type: "spring", stiffness: 140, damping: 20 }} className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4">
          <div>
            <Tag>{r.k}</Tag>
            <p className="mt-1 text-sm text-ink-soft">{r.s}</p>
          </div>
          <p className={`whitespace-nowrap font-serif text-2xl ${r.c}`}>{r.v}</p>
        </motion.div>
      ))}
    </div>
  );
}

function Proposal({ plan }: { plan?: Layout }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setN((v) => (v + 1) % 5), 1100);
    return () => clearInterval(t);
  }, []);
  const study = plan?.floors[0]?.spaces.find((s) => /study/i.test(s.name))?.rect ?? plan?.floors[0]?.spaces[0]?.rect;
  const grown = n >= 2;
  const ok = n >= 3;
  const r = study ? (grown ? { ...study, w: study.w + 1 } : study) : null;
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 p-5">
      <div className="flex flex-col justify-center gap-2.5 text-sm">
        <p className="self-end rounded-2xl bg-brand px-3.5 py-2 text-white">Make the study big enough for two desks.</p>
        <motion.div animate={{ opacity: n >= 1 ? 1 : 0.2 }} className="rounded-2xl border border-line bg-paper p-3">
          <Tag>Agent · proposal</Tag>
          <p className="mt-1">The study grows by a metre.</p>
          <p className="text-ink-soft">+₹1.2L · version 3</p>
          <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs transition-colors ${ok ? "bg-leaf text-white" : "bg-ink text-paper"}`}>{ok ? "✓ Approved" : "Approve"}</span>
        </motion.div>
      </div>
      <div className="flex items-center">
        {plan && (
          <PlanSvg layout={plan} units="metric" className="w-full">
            {r && (
              <motion.rect
                initial={false}
                animate={{ x: r.x, y: r.y, width: r.w, height: r.h, opacity: n >= 1 ? 1 : 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 18 }}
                fill={ok ? "hsl(var(--leaf) / 0.3)" : "hsl(var(--brand) / 0.25)"}
                stroke={ok ? "hsl(var(--leaf))" : "hsl(var(--brand))"}
                strokeWidth={0.08}
                strokeDasharray={ok ? undefined : "0.3 0.2"}
              />
            )}
          </PlanSvg>
        )}
      </div>
    </div>
  );
}

// Everything a project gets, in one card with tabs.
const TABS = [
  { id: "Style", title: "A style your client recognises as theirs.", points: ["A palette, materials, light and plants", "Each choice names the answer it came from", "Built from a look, a feel and three loves", "Edit it, or ask the agent to"] },
  { id: "Plans", title: "Three plans for their plot, drawn in seconds.", points: ["Fitted to the household and the budget", "What each does best, and what it gives up", "Rooms resized, added or removed in a click", "Every change saved as a version"] },
  { id: "3D", title: "A furnished home to walk through together.", points: ["Room by room, by day or by night", "Furnished in the client's style", "Look around from above, or walk inside", "A walkthrough video to send"] },
  { id: "Budget", title: "A budget in their currency, room by room.", points: ["Cost by room and by trade", "Four finish levels to compare", "A timeline from design to handover", "A shopping list and a green score"] },
  { id: "Drawings", title: "A drawings pack for the builder.", points: ["Dimensioned plans", "All four elevations", "Door and window schedules", "As a PDF and a DXF for CAD"] },
  { id: "Review", title: "The client's answer, on record.", points: ["Send a version for review", "Record their answer from the meeting", "Changes after approval kept apart, with the cost", "Every version and every note kept"] },
];

export function Everything() {
  const [on, setOn] = useState(0);
  const t = TABS[on]!;
  return (
    <section className="relative px-5 py-28 sm:px-10">
      <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mx-auto max-w-3xl text-center font-serif text-[clamp(2.25rem,4.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.02em]">
        Everything for the project, <span className="text-ink-soft">from one meeting.</span>
      </motion.h2>
      <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="mx-auto mt-12 max-w-5xl rounded-[2rem] border border-line bg-paper-raised/80 p-3 shadow-[0_40px_100px_-60px_rgba(15,23,42,0.4)] backdrop-blur sm:p-4">
        <div className="flex gap-1 overflow-x-auto [scrollbar-width:none]">
          {TABS.map((x, i) => (
            <button key={x.id} type="button" onClick={() => (tick(), setOn(i))} className="relative whitespace-nowrap rounded-full px-5 py-2.5 text-sm">
              {on === i && <motion.span layoutId="tab-on" className="absolute inset-0 rounded-full bg-ink" transition={{ type: "spring", stiffness: 400, damping: 34 }} />}
              <span className={`relative ${on === i ? "text-paper" : "text-ink-soft hover:text-ink"}`}>{x.id}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={on} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }} className="px-5 pb-8 pt-8 sm:px-10">
            <h3 className="font-serif text-3xl font-semibold tracking-[-0.01em] sm:text-4xl">{t.title}</h3>
            <ul className="mt-6 grid gap-x-10 gap-y-3 sm:grid-cols-2">
              {t.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-ink-soft">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}

export function CleanFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-10 text-sm text-ink-soft sm:px-10">
      <Logo size={22} />
      <nav className="flex flex-wrap gap-x-5 gap-y-2">
        <a href="#how" className="hover:text-ink">
          How it works
        </a>
        <a href="/resources" className="hover:text-ink">
          Resources
        </a>
        <a href="/judges" className="hover:text-ink">
          For judges
        </a>
        <Link href="/projects" className="hover:text-ink">
          Open your studio
        </Link>
      </nav>
    </footer>
  );
}
