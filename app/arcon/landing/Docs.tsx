import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";

import { Decode } from "@arcon/fx/Decode";
import { tick } from "@arcon/fx/sfx";

import { FAQ } from "./faq";

// Resources: everything to understand Arcon Studio, in one page with a contents list that follows the reading.
// Getting started, working with clients, working with the agent, how a design is made, questions, and developers.

type Section = { id: string; group: string; title: string; body: ReactNode };

const Steps = ({ items }: { items: string[] }) => (
  <ol className="mt-4 space-y-2">
    {items.map((s, i) => (
      <li key={i} className="flex gap-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-brand/40 font-mono text-[11px] text-brand">{i + 1}</span>
        <span>{s}</span>
      </li>
    ))}
  </ol>
);

const Code = ({ children }: { children: string }) => (
  <pre className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper p-4 font-mono text-[13px] leading-relaxed">
    <code>{children}</code>
  </pre>
);

const Table = ({ rows }: { rows: [string, string][] }) => (
  <div className="mt-3 overflow-x-auto">
    <table className="w-full text-left text-sm">
      <tbody className="divide-y divide-line">
        {rows.map(([r, d]) => (
          <tr key={r}>
            <td className="whitespace-nowrap py-2 pr-4 align-top font-mono text-[13px] text-brand">{r}</td>
            <td className="py-2 text-ink-soft">{d}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const SECTIONS: Section[] = [
  {
    id: "start",
    group: "Get started",
    title: "Arcon Studio in two minutes",
    body: (
      <>
        <p>
          Arcon Studio is the architect&apos;s own studio. You sit with your client and run Studio&apos;s interview together; Arcon Studio turns their answers into their style, three floor plans, a furnished 3D home, a budget in their currency and a drawings pack. An agent works beside you the whole time: it reads the project, drafts, and proposes changes, and nothing changes until you approve.
        </p>
        <Steps
          items={[
            "Sign in with Google or email. Your studio, your clients and your projects are yours alone.",
            "Add a client and their project, then run the interview with them: the space, who lives there, the budget, a look, a feel and three things they love.",
            "Three plans appear as soon as the interview ends, each with what it does best and what it gives up. Choose one.",
            "Walk through it in 3D together, make changes yourself or ask the agent, and watch the budget follow.",
            "Send it for review, record your client's answer, and hand over the drawings pack.",
          ]}
        />
        <p className="mt-4">
          <Link href="/projects" className="text-brand hover:underline">
            Open your studio
          </Link>
        </p>
      </>
    ),
  },
  {
    id: "studio",
    group: "Get started",
    title: "Your studio",
    body: (
      <>
        <p>Your studio opens on your projects and your clients. Each project card shows where it stands: with the client, plans to choose, being designed, in review or approved.</p>
        <p className="mt-3">Inside a project, the tabs follow the work:</p>
        <Table
          rows={[
            ["Overview", "what to do next, and a card for each part of the project"],
            ["Design", "the client's style, the three plans, the 3D walkthrough, and Make changes"],
            ["Thread", "notes on the design, sending it for review, and the client's answer on record"],
            ["Budget & shopping", "cost by room and by trade, the timeline, the green score and the shopping list"],
            ["Files", "the drawings pack as PDF and DXF, sketches and the walkthrough video"],
            ["With the agent", "the agent's proposals drawn over the plan, to apply or reject, and every change made"],
          ]}
        />
      </>
    ),
  },
  {
    id: "interview",
    group: "Working with clients",
    title: "Running the interview",
    body: (
      <>
        <p>The interview asks one thing at a time, in English, हिंदी or Hinglish, typed or spoken, with tap answers for the quick ones. Run it with your client beside you, or on a call while you type.</p>
        <Steps
          items={[
            "The space: what it is, where it is, the plot or floor size, new build or fit-out.",
            "The people: who lives or works there, and how their days go.",
            "The budget, as a finish level and a figure.",
            "Their look and feel: one look, and how it should feel (airy, cozy, green, lively).",
            "Three things they love: a place, a brand, a film, anything. These shape the details.",
          ]}
        />
      </>
    ),
  },
  {
    id: "review",
    group: "Working with clients",
    title: "Reviews and approvals",
    body: (
      <>
        <p>When a design is ready, send it for review from the Thread. Your client looks at it with you; you record their answer from the meeting: approved, or changes wanted, with their words.</p>
        <p className="mt-3">After approval, any change is kept apart from the approved version until the client agrees to it, with the cost difference shown. Every version is kept, so you can always see who asked for what.</p>
      </>
    ),
  },
  {
    id: "agent",
    group: "The agent",
    title: "Working with the agent",
    body: (
      <>
        <p>Open the chat beside any project and ask in plain words. The agent knows the project you are looking at: the client, their style, the chosen plan and its budget.</p>
        <Steps
          items={[
            "“Draw Priya three plans” or “She works from home, add a study.”",
            "“Make the study big enough for two desks.” The agent proposes it; you see it drawn over the plan with the cost.",
            "Press Approve to apply it, or Reject. The agent asks before it applies anything.",
            "“Why is the kitchen open?” The agent explains each choice from the client's answers.",
          ]}
        />
      </>
    ),
  },
  {
    id: "actions",
    group: "The agent",
    title: "What the agent can do",
    body: (
      <>
        <p>Every button in Studio and every tool the agent uses is the same action, so the agent and you always work on the same project.</p>
        <Table
          rows={[
            ["list-projects, list-clients", "your projects and clients"],
            ["get-project, get-design", "a project, its chosen plan, rooms and sizes"],
            ["design-project", "three plans from the interview"],
            ["set-program", "the rooms a client needs, laid out again three ways"],
            ["set-brief", "the client's style: palette, materials, light and plants"],
            ["get-budget", "the cost by room and by trade, in the client's currency"],
            ["get-reasons", "why each choice was made, from the client's answers"],
            ["propose-change", "a change drawn over the plan, with its cost, for you to decide"],
            ["apply-change", "applies a proposal, only with your approval"],
            ["reject-change, list-changes", "turn a proposal down; see every change made"],
          ]}
        />
      </>
    ),
  },
  {
    id: "how",
    group: "How it works",
    title: "From taste to a design",
    body: (
      <>
        <p>Studio&apos;s design engine reads the client&apos;s look and feel into a style: a palette, materials, light and plants, each naming the answer it came from. The room program comes from the kind of space and the household, fitted to the plot, and the layout engine draws it in three different ways.</p>
        <p className="mt-3">The 3D is built from the same plan, furnished in the client&apos;s style. The budget prices every room at the client&apos;s finish level with researched rates for their market, and the drawings pack draws the same plan with dimensions, elevations and schedules.</p>
      </>
    ),
  },
  {
    id: "faq",
    group: "Questions",
    title: "Questions",
    body: (
      <div className="space-y-5">
        {FAQ.map((f) => (
          <div key={f.q}>
            <p className="font-medium">{f.q}</p>
            <p className="mt-1 text-ink-soft">{f.a}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "developers",
    group: "Developers",
    title: "Developer guide",
    body: (
      <>
        <p>Arcon Studio is built on Agent-Native (React Router, Nitro, Drizzle and Postgres). Every action in actions/ is a button in the app, a tool for the built-in agent, and an endpoint for other agents over MCP and A2A. Studio&apos;s design engine lives in engine/, with its tests beside each part.</p>
        <Code>{`actions/   every action: the app's buttons and the agent's tools
app/       routes and screens; app/arcon holds Studio's screens
engine/    Studio's design engine: layout, style, 3D, budget, drawings
server/    the database, the agent's instructions and plugins`}</Code>
        <p className="mt-6 font-medium">Run it</p>
        <Code>{`pnpm install
cp .env.example .env    # database URL and auth secret
pnpm dev                # http://localhost:8080
pnpm test               # unit tests`}</Code>
      </>
    ),
  },
  {
    id: "privacy",
    group: "Developers",
    title: "Data and privacy",
    body: <p>Your clients, projects and designs are stored in your account and seen only by you. Deleting a project deletes its versions and its thread.</p>,
  },
];

export function Docs() {
  const [active, setActive] = useState(SECTIONS[0]!.id);

  // the contents list follows the section being read
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (seen) setActive(seen.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  const groups = [...new Set(SECTIONS.map((s) => s.group))];
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-10 sm:px-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-brand">&gt; resources</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-6xl">
        <Decode text="Understand Arcon Studio" />
      </h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">How to start, how to work with your clients and the agent, how a design is made, answers to common questions, and a guide for developers.</p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Contents" className="lg:sticky lg:top-24 lg:self-start">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 lg:mx-0 lg:block lg:space-y-6 lg:overflow-visible lg:px-0">
            {groups.map((g) => (
              <div key={g} className="contents lg:block">
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.25em] text-ink-soft lg:block">{g}</p>
                <ul className="contents lg:mt-2 lg:block lg:space-y-0.5 lg:border-l lg:border-line">
                  {SECTIONS.filter((s) => s.group === g).map((s) => (
                    <li key={s.id} className="relative shrink-0">
                      <a
                        href={`#${s.id}`}
                        onClick={() => tick()}
                        className={`block whitespace-nowrap rounded-full border px-3 py-1.5 text-sm transition lg:rounded-none lg:border-0 lg:py-1 lg:pl-4 ${active === s.id ? "border-brand text-brand" : "border-line text-ink-soft hover:text-ink"}`}
                      >
                        {active === s.id && <motion.span layoutId="docs-mark" className="absolute -left-px top-0 hidden h-full w-0.5 bg-brand lg:block" />}
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-16">
          {SECTIONS.map((s) => (
            <motion.section
              key={s.id}
              id={s.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5 }}
              className="scroll-mt-24"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-brand">{s.group}</p>
              <h2 className="mt-1 font-serif text-3xl sm:text-4xl">{s.title}</h2>
              <div className="mt-4 leading-relaxed">{s.body}</div>
            </motion.section>
          ))}
        </div>
      </div>
    </main>
  );
}
