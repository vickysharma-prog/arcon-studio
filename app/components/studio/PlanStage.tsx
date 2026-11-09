import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconArrowLeft, IconArrowRight, IconCheck, IconPencil, IconSparkles } from "@tabler/icons-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

import { ArconMark } from "@/components/ArconMark";
import { Button } from "@/components/ui/button";
import { areaText, floorName, floorsOf, type Space } from "@/lib/plan";

import { failureText } from "./Changes";
import { PlanView } from "./PlanView";

// A project before its plan is chosen: the interview still to do, or plan options drawn from it to pick from. The
// options come from Arcon's room program at once; the agent can write a better program and redraw them.

type Project = {
  id: string;
  title: string;
  clientName: string | null;
  status: string;
  units: "imperial" | "metric";
  missing: string[];
  options: { index: number; name: string; summary: string | null; why: string[]; spaces: Space[]; shell: { width: number; depth: number }; area: number }[];
};

export function PlanStage({ project: p }: { project: Project }) {
  const draw = useActionMutation("design-project", { onError: (e) => toast.error(failureText(e)) });
  const choose = useActionMutation("choose-plan", {
    onSuccess: (r) => toast.success(`${r.name} is the plan. Now refine it with your client.`),
    onError: (e) => toast.error(failureText(e)),
  });
  const first = p.clientName?.split(" ")[0];

  // Plans are drawn as soon as the page opens after the interview: the architect never waits on a button.
  const asked = useRef(false);
  useEffect(() => {
    if (p.status !== "interview" && !p.options.length && !p.missing.length && !asked.current) {
      asked.current = true;
      draw.mutate({ id: p.id });
    }
  }, [p.id, p.status, p.options.length, p.missing.length, draw]);

  const ask = (message: string) => sendToAgentChat({ message, context: JSON.stringify({ projectId: p.id }), submit: true, openSidebar: true });

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
        <IconArrowLeft className="size-3.5" aria-hidden />
        Your studio
      </Link>
      <h1 className="mt-1 text-2xl font-semibold">{p.title}</h1>
      {p.clientName ? <p className="text-sm text-muted-foreground">For {p.clientName}</p> : null}

      {p.status === "interview" ? (
        <Card>
          <ArconMark growing className="size-12 text-foreground" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">The interview comes first</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Run Arcon&apos;s interview with {p.clientName ?? "your client"}: who lives there, how they use the space, the site, and three things they love.
          </p>
          <Button asChild className="mt-4">
            <Link to={`/projects/${p.id}/interview`}>
              Start the interview
              <IconArrowRight aria-hidden />
            </Link>
          </Button>
        </Card>
      ) : p.missing.length ? (
        <Card>
          <h2 className="text-lg font-semibold">A few answers are missing</h2>
          <p className="mt-1 text-sm text-muted-foreground">Still needed: {p.missing.join(", ")}.</p>
        </Card>
      ) : !p.options.length ? (
        <Card>
          <ArconMark growing className="size-14 text-foreground" aria-hidden />
          <h2 className="mt-3 text-lg font-semibold">{draw.isError ? "The plans didn't draw" : "Drawing plans from the interview"}</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {draw.isError ? draw.error?.message : "Arcon's layout engine is laying out the rooms two or three ways."}
          </p>
          {draw.isError ? (
            <Button className="mt-4" onClick={() => draw.mutate({ id: p.id })}>
              Try again
            </Button>
          ) : null}
        </Card>
      ) : (
        <section aria-labelledby="options-heading" className="mt-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="options-heading" className="text-lg font-semibold">
                Choose a plan{first ? ` for ${first}` : ""}
              </h2>
              <p className="text-sm text-muted-foreground">Each is laid out from the interview. Pick one to start the design; you can change anything after.</p>
            </div>
            <Button
              variant="outline"
              onClick={() =>
                ask("Read this project's interview and write a room program that fits how this client lives better than the drafted one, then redraw the plans with set-program. Tell me what you changed and why.")
              }
            >
              <IconSparkles aria-hidden />
              Have the agent refine the rooms
            </Button>
          </div>
          <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {p.options.map((o) => {
              const floors = floorsOf(o.spaces);
              return (
                <li key={o.index} className="flex flex-col rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="font-semibold">{o.name}</h3>
                    <span className="text-xs text-muted-foreground">{areaText(o.area, p.units)}</span>
                  </div>
                  {o.summary ? <p className="mt-1 text-sm text-muted-foreground">{o.summary}</p> : null}
                  <div className="mt-3 space-y-2">
                    {floors.map((f) => (
                      <div key={f}>
                        {floors.length > 1 ? <p className="mb-1 text-xs text-muted-foreground">{floorName(f)}</p> : null}
                        <PlanView spaces={o.spaces} shell={o.shell} floor={f} units={p.units} label={`${o.name}, ${floorName(f)}`} />
                      </div>
                    ))}
                  </div>
                  {o.why.length ? (
                    <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-muted-foreground">
                      {o.why.slice(0, 3).map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-auto flex flex-wrap gap-2 pt-4">
                    <Button size="sm" disabled={choose.isPending} onClick={() => choose.mutate({ id: p.id, option: o.index })}>
                      <IconCheck aria-hidden />
                      {choose.isPending && choose.variables?.option === o.index ? "Choosing…" : "Choose this plan"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => ask(`Walk me through "${o.name}" for this client: what works for how they live, and what you'd change.`)}>
                      <IconPencil aria-hidden />
                      Talk it through
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto mt-10 flex max-w-xl flex-col items-center rounded-2xl border border-border bg-card p-8 text-center">{children}</div>;
}
