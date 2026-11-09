

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Logo } from "@arcon/Logo";
import { tick, transition } from "@arcon/fx/sfx";
import { HomeLink } from "./Intro";
import { Showcase } from "./Showcase";

// The header for the landing page: the logo on its own at the left, the sections in a floating glass bar in the
// middle, and the way in at the right. A highlight slides under whichever link the pointer is on.
const LINKS = [
  ["How it works", "#how"],
  ["Taste", "#taste"],
  ["Plans", "#plans"],
  ["The agent", "#agent"],
  ["Resources", "#faq"],
];

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled ? "border-b border-line/60 bg-paper/85 backdrop-blur-md" : "border-b border-transparent"}`}>
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-8 xl:grid xl:grid-cols-[1fr_auto_1fr]">
        <HomeLink className="justify-self-start">
          <Logo size={28} />
        </HomeLink>
        <nav
          onMouseLeave={() => setHover(null)}
          className={`hidden items-center gap-1 rounded-full border p-1 text-sm backdrop-blur-md transition-all duration-300 xl:flex ${scrolled ? "border-line bg-paper-raised/80 shadow-[0_10px_40px_-20px_hsl(var(--brand))]" : "border-line/70 bg-paper-raised/50"}`}
        >
          {LINKS.map(([label, href]) => (
            <a key={href} href={href} onMouseEnter={() => setHover(href)} onClick={() => tick()} className="relative whitespace-nowrap rounded-full px-4 py-1.5 text-ink-soft transition-colors hover:text-ink">
              {hover === href && <motion.span layoutId="nav-hover" className="absolute inset-0 rounded-full bg-brand/10 ring-1 ring-brand/30" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
              <span className="relative">{label}</span>
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 justify-self-end sm:gap-2.5">
          {/* the judges' path: what to try, in order */}
          <a href="#judges" onClick={() => tick()} className="flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-brand/50 bg-brand/5 px-3 text-sm text-brand transition hover:-translate-y-0.5 hover:bg-brand/10 hover:shadow-[0_10px_30px_-12px_hsl(var(--brand))]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
            </span>
            For judges
          </a>
          <Link href="/projects" onClick={() => transition()} className="glow-btn flex h-9 items-center whitespace-nowrap rounded-full px-4 text-sm sm:px-5">
            Open your studio
          </Link>
        </div>
      </div>
    </header>
  );
}

const WORDS = ["who they are", "what they love", "how they live", "how they work"];

// The first screen: what Arcon does in one line, the way in, and a plan that designs itself from taste.
export function Hero() {
  const still = useReducedMotion();
  const [word, setWord] = useState(0);

  useEffect(() => {
    if (still) return;
    const t = setInterval(() => setWord((w) => (w + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, [still]);

  return (
    <section className="relative overflow-hidden">
      {/* blueprint grid, fading out toward the edges */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--brand)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--brand)) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />
      <div className="relative mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] items-center gap-12 px-4 pb-20 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:pt-16">
        <div>
          <motion.p
            initial={still ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-brand sm:text-xs sm:tracking-[0.3em]"
          >
            Arcon Studio · for architects and interior designers
          </motion.p>
          <h1 className="mt-6 font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
            Spaces designed around
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
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Sit with your client and run Arcon&apos;s interview together. Their taste becomes a style, three floor plans, a 3D walkthrough, a budget and a drawings pack, and an agent works beside you: it proposes, you approve.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-2.5">
            <a href="#judges" onClick={() => tick()} className="group flex items-center gap-2.5 rounded-full border border-brand/50 bg-brand/5 px-5 py-3.5 text-base text-brand backdrop-blur transition hover:-translate-y-0.5 hover:bg-brand/10 hover:shadow-[0_12px_36px_-14px_hsl(var(--brand))]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:hidden" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
              For judges
            </a>
            <Link
              href="/projects"
              onClick={() => transition()}
              className="glow-btn group px-6 py-3.5 text-base"
            >
              Open your studio
            </Link>
            <a href="#how" onClick={() => tick()} className="rounded-full border border-line bg-paper-raised/70 px-5 py-3.5 text-base backdrop-blur transition hover:-translate-y-0.5 hover:border-brand hover:text-brand hover:shadow-[0_12px_36px_-14px_hsl(var(--brand))]">
              See how it works
            </a>
          </div>
          <p className="mt-5 text-sm text-ink-soft">
            Typed or spoken, with your client beside you · nothing changes until you approve
          </p>

        </div>

        <motion.div initial={still ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}>
          <Showcase />
        </motion.div>
      </div>
    </section>
  );
}
