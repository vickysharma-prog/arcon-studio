import { motion } from "motion/react";
import { Link } from "react-router";

import { AnimatedMark } from "@arcon/AnimatedMark";

export function meta() {
  return [{ title: "Thank you · Arcon Studio" }];
}

const SAW = [
  "A full studio: six clients, from the interview to an approved design",
  "A style read from the client's own answers, every choice with its source",
  "Three plans, the 3D home, the budget and the shopping list",
  "The agent's proposal on the plan, approved by you",
  "The review on record and the drawings pack for the builder",
];

// The end of the judges' demo: what they saw, and the way to start a design of their own.
export default function ThanksRoute() {
  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">
      <AnimatedMark size={96} />
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-8 text-4xl font-semibold tracking-tight sm:text-5xl">
        Thank you for taking the tour.
      </motion.h1>
      <motion.ul initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-8 grid gap-2 text-left">
        {SAW.map((s) => (
          <li key={s} className="flex gap-3 text-muted-foreground">
            <span className="mt-1 text-brand">✓</span>
            {s}
          </li>
        ))}
      </motion.ul>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-10 flex flex-wrap justify-center gap-3">
        <Link to="/projects?new=1" className="rounded-full bg-foreground px-6 py-3 text-background transition hover:opacity-90">
          Try your own design
        </Link>
        <Link to="/projects" className="rounded-full border border-border px-6 py-3 transition hover:bg-muted">
          Back to the studio
        </Link>
      </motion.div>
      <p className="mt-10 max-w-md text-xs text-muted-foreground">
        The design engine comes from Arcon, which I built earlier; Arcon Studio and its agent workspace were built during the hackathon.
      </p>
    </div>
  );
}
