import { IconArrowLeft, IconArrowRight, IconSparkles, IconX } from "@tabler/icons-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";

import { askAgent } from "@/lib/ask-agent";

// The judges' demo: a guided run through a full studio, end to end, on the sample projects. It lives in the session,
// so it follows the visitor from page to page, and each step opens the page it talks about.

const KEY = "studio-tour";
type State = { step: number; demo: string };

type Step = { path: (demo: string) => string; title: string; text: string; ask?: string };
export const STEPS: Step[] = [
  { path: () => "/projects", title: "A full studio", text: "Six clients, each at a different stage: an interview to run, plans to choose, a design with the client, an approved café. Each was built the way your projects are." },
  { path: (d) => `/projects/${d}?tab=overview`, title: "Priya's house", text: "The project home: what to do next, and every part of the project in one place." },
  { path: (d) => `/projects/${d}?step=brief`, title: "Her style, from her answers", text: "The look and feel Priya picked became this palette, materials, light and plants. Each one names where it came from." },
  { path: (d) => `/projects/${d}?step=plans`, title: "Three plans", text: "Drawn for her plot and her family. Each says what it does best and what it gives up; the first one is chosen." },
  { path: (d) => `/projects/${d}?step=walkthrough`, title: "Walk it in 3D", text: "Press play to walk room by room with your client, or switch to Look around." },
  { path: (d) => `/projects/${d}/changes`, title: "The agent proposed a change", text: "It wants a bigger study for two desks, drawn over the plan with the cost. Press Approve, and the plan and budget follow." },
  {
    path: (d) => `/projects/${d}?step=workspace`,
    title: "Ask the agent yourself",
    text: "Type a change in the box, or ask the agent in the chat beside you. It proposes; you decide.",
    ask: "Why is Priya's kitchen open to the living room? Then propose one change that would suit how her family lives.",
  },
  { path: (d) => `/projects/${d}?step=budget`, title: "The budget", text: "Cost by room and by trade in rupees, four finish levels, the timeline and the green score." },
  { path: (d) => `/projects/${d}?step=shop`, title: "The shopping list", text: "Every piece in the 3D, priced at her finish level, ready to send to Priya." },
  { path: (d) => `/projects/${d}?tab=thread`, title: "Review with the client", text: "Send the design for review, then record Priya's answer from your meeting. Every version stays on record." },
  { path: (d) => `/projects/${d}?step=drawings`, title: "Hand it over", text: "A drawings pack with dimensioned plans, elevations and schedules, as a PDF and a DXF for CAD." },
  { path: () => "/projects?new=1", title: "Your turn", text: "Add a client of your own and run the interview. Plans appear the moment it ends. Press Finish when you are done." },
];

function read(): State | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as State) : null;
  } catch {
    return null;
  }
}

function write(s: State | null) {
  try {
    if (s) sessionStorage.setItem(KEY, JSON.stringify(s));
    else sessionStorage.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new Event(KEY));
}

export function startTour(demo: string) {
  write({ step: 0, demo });
}

export function Tour() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [state, setState] = useState<State | null>(null);
  const last = useRef(0);
  useEffect(() => {
    const on = () => setState(read());
    on();
    window.addEventListener(KEY, on);
    return () => window.removeEventListener(KEY, on);
  }, []);
  if (!state || pathname === "/demo") return null;
  const step = STEPS[state.step];
  if (!step) return null;
  const go = (i: number) => {
    // one step per press: a press that lands while the page is still changing is not a second press
    if (Date.now() - last.current < 700) return;
    last.current = Date.now();
    if (i >= STEPS.length) {
      write(null);
      navigate("/thanks");
      return;
    }
    const s = { ...state, step: Math.max(0, i) };
    write(s);
    navigate(STEPS[s.step]!.path(s.demo));
  };
  const end = state.step === STEPS.length - 1;
  // A slim strip at the top of the page, in the page's flow, so it never covers what it talks about.
  return (
    <div role="region" aria-label="Guided demo" className="sticky top-0 z-30 border-b border-brand/20 bg-brand/[0.06] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6">
        <span className="shrink-0 rounded-full bg-brand px-2.5 py-0.5 font-mono text-[11px] text-white">
          Demo {state.step + 1}/{STEPS.length}
        </span>
        <motion.p key={state.step} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 flex-1 text-sm">
          <span className="font-semibold">{step.title}.</span> <span className="text-muted-foreground">{step.text}</span>
        </motion.p>
        <div className="flex shrink-0 items-center gap-2">
          {step.ask ? (
            <button type="button" onClick={() => void askAgent(step.ask!, { projectId: state.demo })} className="inline-flex items-center gap-1.5 rounded-full border border-brand/40 px-3 py-1 text-sm text-brand hover:bg-brand/10">
              <IconSparkles className="size-4" />
              Ask the agent
            </button>
          ) : null}
          {state.step > 0 ? (
            <button type="button" onClick={() => go(state.step - 1)} aria-label="Back" className="inline-flex size-8 items-center justify-center rounded-full border border-border hover:bg-muted">
              <IconArrowLeft className="size-4" />
            </button>
          ) : null}
          <button type="button" onClick={() => go(state.step + 1)} className="inline-flex items-center gap-1 rounded-full bg-foreground px-4 py-1 text-sm text-background hover:opacity-90">
            {end ? "Finish" : "Next"}
            {end ? null : <IconArrowRight className="size-4" />}
          </button>
          <button type="button" onClick={() => write(null)} aria-label="End the demo" className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
            <IconX className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
