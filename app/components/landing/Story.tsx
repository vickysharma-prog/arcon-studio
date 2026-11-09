import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState, type RefObject } from "react";

import { tick } from "@arcon/fx/sfx";

// The story of one project, told by scrolling: the screen holds still while the chapters change, and each chapter's
// picture plays forward and back with the scroll, so the visitor drives it.
export const CHAPTERS = [
  { n: "01", title: "Sit with your client", body: "Run Arcon's interview together, in the room or on a call. Who lives there, how they live, the budget, and three things they love." },
  { n: "02", title: "Their taste, made visible", body: "A look and a feel become a palette, materials, light and plants. Every choice says which answer it came from." },
  { n: "03", title: "Three plans, drawn in seconds", body: "Laid out from their brief and their plot, each one clear about what it does best and what it gives up." },
  { n: "04", title: "Walk them through it", body: "The plan rises into a furnished 3D home you can walk through together, by day or by night." },
  { n: "05", title: "The agent proposes. You decide.", body: "Ask for a change in plain words. The agent draws it over the plan with its cost, and nothing changes until you approve." },
  { n: "06", title: "Hand it over", body: "A drawings pack with PDF and DXF, a budget in their currency, a shopping list, and the client's approval on record." },
] as const;

const N = CHAPTERS.length;

export function Story({ scroller }: { scroller: RefObject<HTMLDivElement | null> }) {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ container: scroller, target: section, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(N - 1, Math.max(0, Math.floor(v * N)));
    if (i !== active) setActive(i);
  });
  // how far through the current chapter, 0 to 1, for pictures that play with the scroll
  const local = useTransform(scrollYProgress, (v) => Math.min(1, Math.max(0, v * N - active)));
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  const jump = (i: number) => {
    const s = section.current;
    const c = scroller.current;
    if (!s || !c) return;
    tick();
    const span = s.offsetHeight - c.clientHeight;
    c.scrollTo({ top: s.offsetTop + (span * (i + 0.15)) / N, behavior: "smooth" });
  };

  return (
    <section id="story" ref={section} className="relative" style={{ height: `${N * 100 + 40}vh` }}>
      <div className="sticky top-0 flex h-dvh flex-col overflow-hidden">
        {/* blueprint grid behind the story */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "linear-gradient(hsl(var(--brand)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand)) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse at 60% 50%, black 25%, transparent 75%)",
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl flex-1 grid-cols-1 content-center items-center gap-6 px-4 pt-20 pb-10 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div className="min-h-[13rem] lg:min-h-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">How it works</p>
            <div className="grid">
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                className="[grid-area:1/1]"
                initial={{ opacity: 0, y: 24, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -24, filter: "blur(6px)" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mt-4 font-mono text-5xl text-brand/40 sm:text-6xl">{CHAPTERS[active].n}</p>
                <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl">{CHAPTERS[active].title}</h2>
                <p className="mt-4 max-w-md text-lg leading-relaxed text-ink-soft">{CHAPTERS[active].body}</p>
              </motion.div>
            </AnimatePresence>
            </div>
            <ol className="mt-8 flex gap-2" aria-label="Chapters">
              {CHAPTERS.map((c, i) => (
                <li key={c.n}>
                  <button
                    type="button"
                    onClick={() => jump(i)}
                    aria-label={`${c.n}: ${c.title}`}
                    aria-current={i === active ? "step" : undefined}
                    className={`h-2 rounded-full transition-all duration-500 ${i === active ? "w-10 bg-brand" : i < active ? "w-4 bg-brand/50 hover:bg-brand" : "w-4 bg-line hover:bg-ink-soft"}`}
                  />
                </li>
              ))}
            </ol>
          </div>
          <div className="relative h-[22rem] sm:h-[26rem] lg:h-[30rem]">
            <AnimatePresence initial={false}>
              <motion.div
                key={active}
                className="absolute inset-0"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.03 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                {active === 0 && <Interview t={local} />}
                {active === 1 && <Taste t={local} />}
                {active === 2 && <Plans t={local} />}
                {active === 3 && <Rise t={local} />}
                {active === 4 && <Propose t={local} />}
                {active === 5 && <Handover t={local} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <div className="relative h-0.5 w-full bg-line/50">
          <motion.div className="h-full bg-brand" style={{ width: bar }} />
        </div>
      </div>
    </section>
  );
}

/** A step, 0 to `count`, that follows the scroll through a chapter. */
function useSteps(t: MotionValue<number>, count: number) {
  const [n, setN] = useState(() => Math.round(t.get() * count));
  useMotionValueEvent(t, "change", (v) => setN(Math.min(count, Math.round(v * count + 0.35))));
  return n;
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`h-full rounded-3xl border border-line bg-paper-raised/80 p-5 shadow-[0_30px_80px_-40px_hsl(var(--brand)/0.5)] backdrop-blur sm:p-7 ${className}`}>{children}</div>;
}

const TALK = [
  { who: "arcon", text: "Who will live here, and how do your days go?" },
  { who: "client", text: "Me, my husband and our two kids. We cook together most evenings." },
  { who: "arcon", text: "Now three things you love. A place, a brand, a film, anything." },
  { who: "client", text: "A beach café in Goa, handloom linen, old Bollywood songs." },
  { who: "arcon", text: "Lovely. I have what I need to design Priya's home." },
] as const;

function Interview({ t }: { t: MotionValue<number> }) {
  const n = useSteps(t, TALK.length);
  return (
    <Panel className="flex flex-col">
      <div className="flex items-center justify-between border-b border-line pb-3 text-sm">
        <span className="font-medium">Priya&apos;s interview</span>
        <span className="font-mono text-xs text-ink-soft">{Math.min(n, TALK.length)}/{TALK.length}</span>
      </div>
      <div className="mt-4 flex flex-1 flex-col justify-end gap-3 overflow-hidden">
        <AnimatePresence initial={false}>
          {TALK.slice(0, Math.max(1, n)).map((m) => (
            <motion.p
              key={m.text}
              initial={{ opacity: 0, y: 14, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm sm:text-base ${m.who === "client" ? "self-end bg-brand text-white" : "self-start border border-line bg-paper"}`}
            >
              {m.text}
            </motion.p>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-4 text-xs text-ink-soft">Typed or spoken, with the client beside you.</p>
    </Panel>
  );
}

const PALETTE = [
  { name: "Soft white", hex: "#F4F1EA" },
  { name: "Light oak", hex: "#C8A97E" },
  { name: "Sea glass", hex: "#9FC2B8" },
  { name: "Linen", hex: "#E3D7C3" },
  { name: "Charcoal", hex: "#3B3F45" },
];

function Taste({ t }: { t: MotionValue<number> }) {
  const n = useSteps(t, 4);
  return (
    <Panel className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {["Scandinavian look", "Calm and airy", "Green and natural"].map((c, i) => (
          <motion.span
            key={c}
            animate={{ opacity: n > i ? 1 : 0.25, y: n > i ? 0 : 6 }}
            className="rounded-full border border-brand/50 bg-brand/10 px-3 py-1 text-sm text-brand"
          >
            {c}
          </motion.span>
        ))}
      </div>
      <motion.p animate={{ opacity: n >= 3 ? 1 : 0.2 }} className="font-serif text-4xl sm:text-5xl">
        Airy Scandinavian
      </motion.p>
      <div className="grid flex-1 grid-cols-5 gap-2">
        {PALETTE.map((c, i) => (
          <motion.div
            key={c.name}
            animate={{ scaleY: n >= 3 ? 1 : 0.1, opacity: n >= 3 ? 1 : 0.3 }}
            transition={{ delay: n >= 3 ? i * 0.06 : 0, type: "spring", stiffness: 160, damping: 20 }}
            style={{ background: c.hex, originY: 1 }}
            className="flex items-end rounded-2xl p-2"
          >
            <span className={`text-[10px] sm:text-xs ${i === 4 ? "text-white/80" : "text-black/60"}`}>{c.name}</span>
          </motion.div>
        ))}
      </div>
      <motion.p animate={{ opacity: n >= 4 ? 1 : 0 }} className="text-sm text-ink-soft">
        Light oak floors <span className="text-brand">from the Scandinavian look</span> · sea glass accents <span className="text-brand">from calm and airy</span>
      </motion.p>
    </Panel>
  );
}

// One small home, in plan units (a 12 by 9 grid), for the plan, the 3D and the agent's change.
type R = { id: string; name: string; x: number; y: number; w: number; h: number; tone: string };
const ROOMS: R[] = [
  { id: "living", name: "Living", x: 0, y: 0, w: 6, h: 4, tone: "#C8A97E" },
  { id: "kitchen", name: "Kitchen", x: 6, y: 0, w: 3, h: 4, tone: "#9FC2B8" },
  { id: "dining", name: "Dining", x: 9, y: 0, w: 3, h: 4, tone: "#E3D7C3" },
  { id: "hall", name: "Hall", x: 0, y: 4, w: 12, h: 1, tone: "#8a8f98" },
  { id: "study", name: "Study", x: 0, y: 5, w: 3, h: 4, tone: "#7FA7D9" },
  { id: "bed1", name: "Bedroom", x: 3, y: 5, w: 4, h: 4, tone: "#D9B8A0" },
  { id: "bath", name: "Bath", x: 7, y: 5, w: 2, h: 4, tone: "#A9C9D6" },
  { id: "bed2", name: "Bedroom 2", x: 9, y: 5, w: 3, h: 4, tone: "#D9C8A0" },
];
const U = 30;

const OPTIONS = [
  { name: "Open great room", why: "You cook together, so kitchen, dining and living are one room." },
  { name: "Garden first", why: "Living rooms open onto the back; bedrooms sit quietly at the front." },
  { name: "Central hall", why: "Every room opens off one hall, so the house is easy to read." },
];

function Plans({ t }: { t: MotionValue<number> }) {
  const draw = useTransform(t, [0, 0.55], [0, 1]);
  const n = useSteps(t, 3);
  const pick = Math.min(2, Math.max(0, n - 1));
  return (
    <Panel className="flex flex-col">
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        {OPTIONS.map((o, i) => (
          <span key={o.name} className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition sm:text-sm ${i === pick ? "bg-brand text-white" : "border border-line text-ink-soft"}`}>
            {o.name}
          </span>
        ))}
      </div>
      <div className="flex flex-1 items-center justify-center py-3">
        <svg viewBox={`-6 -6 ${12 * U + 12} ${9 * U + 12}`} className="h-full max-h-[17rem] w-full" role="img" aria-label="A floor plan drawing itself">
          {ROOMS.map((r) => (
            <g key={r.id}>
              <motion.rect
                x={r.x * U}
                y={r.y * U}
                width={r.w * U}
                height={r.h * U}
                fill="hsl(var(--brand) / 0.06)"
                stroke="currentColor"
                strokeWidth={2.5}
                style={{ pathLength: draw }}
                className="text-ink"
              />
              {r.id !== "hall" && (
                <motion.text x={r.x * U + (r.w * U) / 2} y={r.y * U + (r.h * U) / 2} textAnchor="middle" dominantBaseline="middle" className="fill-ink-soft text-[11px]" style={{ opacity: draw }}>
                  {r.name}
                </motion.text>
              )}
            </g>
          ))}
        </svg>
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={pick} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-ink-soft">
          <span className="text-leaf">✓</span> {OPTIONS[pick].why}
        </motion.p>
      </AnimatePresence>
    </Panel>
  );
}

function Rise({ t }: { t: MotionValue<number> }) {
  const tiltX = useTransform(t, [0, 0.6], [0, 58]);
  const tiltZ = useTransform(t, [0, 0.6], [0, -38]);
  const lift = useTransform(t, [0.15, 0.75], [0, 1]);
  const layers = [1, 2, 3, 4, 5, 6, 7];
  return (
    <Panel className="flex items-center justify-center overflow-hidden [perspective:1100px]">
      <motion.div style={{ rotateX: tiltX, rotateZ: tiltZ, width: 12 * 26, height: 9 * 26 }} className="relative [transform-style:preserve-3d]">
        {ROOMS.map((r) => (
          <div key={r.id} className="absolute [transform-style:preserve-3d]" style={{ left: r.x * 26, top: r.y * 26, width: r.w * 26, height: r.h * 26 }}>
            <div className="absolute inset-0 border border-ink/40" style={{ background: `${r.tone}55` }} />
            {r.id !== "hall" &&
              layers.map((l) => <Wall key={l} level={l} lift={lift} />)}
          </div>
        ))}
      </motion.div>
      <motion.p style={{ opacity: lift }} className="absolute bottom-5 left-6 rounded-full bg-paper/80 px-3 py-1 font-mono text-xs backdrop-blur">
        ● Walking through · Living room
      </motion.p>
    </Panel>
  );
}

function Wall({ level, lift }: { level: number; lift: MotionValue<number> }) {
  const z = useTransform(lift, (v) => v * level * 5);
  return <motion.div className="absolute inset-0 border-[1.5px] border-ink/50" style={{ translateZ: z, opacity: lift }} />;
}

function Propose({ t }: { t: MotionValue<number> }) {
  const n = useSteps(t, 4);
  const grown = n >= 2;
  const applied = n >= 4;
  const rooms = ROOMS.map((r) => (!grown ? r : r.id === "study" ? { ...r, w: 4 } : r.id === "bed1" ? { ...r, x: 4, w: 3 } : r));
  return (
    <Panel className="grid grid-rows-[auto_minmax(0,1fr)] gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:grid-rows-1">
      <div className="flex flex-col gap-2.5 text-sm">
        <p className="self-end rounded-2xl bg-brand px-3.5 py-2 text-white">Make the study big enough for two desks.</p>
        <motion.div animate={{ opacity: n >= 1 ? 1 : 0, y: n >= 1 ? 0 : 8 }} className="rounded-2xl border border-line bg-paper p-3">
          <p className="font-mono text-[10px] uppercase tracking-widest text-brand">Agent · proposal</p>
          <p className="mt-1">Study 12 → 16 m², the bedroom gives 4 m².</p>
          <p className="mt-1 text-ink-soft">Cost +₹1.2L · version 3</p>
          <div className="mt-3 flex gap-2">
            <span className={`rounded-full px-3 py-1 text-xs transition ${n >= 3 ? "bg-leaf text-white" : "bg-btn text-btn-ink"}`}>{applied ? "✓ Approved" : "Approve"}</span>
            <span className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft">Reject</span>
          </div>
        </motion.div>
        <motion.p animate={{ opacity: applied ? 1 : 0 }} className="text-xs text-leaf">
          Applied by you. The budget is up to date.
        </motion.p>
      </div>
      <svg viewBox={`-4 -4 ${12 * U + 8} ${9 * U + 8}`} className="h-full w-full" role="img" aria-label="The plan with the proposed change">
        {rooms.map((r) => {
          const changed = grown && (r.id === "study" || r.id === "bed1");
          return (
            <motion.rect
              key={r.id}
              initial={false}
              animate={{ x: r.x * U, y: r.y * U, width: r.w * U, height: r.h * U }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              fill={changed ? (applied ? "hsl(var(--leaf) / 0.25)" : "hsl(var(--brand) / 0.28)") : "hsl(var(--brand) / 0.05)"}
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray={changed && !applied ? "6 4" : undefined}
              className="text-ink"
            />
          );
        })}
      </svg>
    </Panel>
  );
}

function Handover({ t }: { t: MotionValue<number> }) {
  const n = useSteps(t, 3);
  const cards = [
    { k: "Drawings pack", v: "PDF + DXF", s: "Plans, four elevations, door and window schedules" },
    { k: "Budget", v: "₹53L – ₹83L", s: "By room and by trade, in the client's currency" },
    { k: "Client review", v: "✓ Approved", s: "Priya approved version 3, in your meeting" },
  ];
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.k}
          animate={{ opacity: n > i ? 1 : 0.15, x: n > i ? 0 : 30 }}
          transition={{ type: "spring", stiffness: 140, damping: 20 }}
          className="flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper-raised/80 p-5 backdrop-blur"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-soft">{c.k}</p>
            <p className="mt-1 text-sm text-ink-soft">{c.s}</p>
          </div>
          <p className={`whitespace-nowrap font-serif text-2xl sm:text-3xl ${i === 2 ? "text-leaf" : ""}`}>{c.v}</p>
        </motion.div>
      ))}
    </div>
  );
}
