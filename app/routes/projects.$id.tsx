import { sendToAgentChat } from "@agent-native/core/client/agent-chat";
import { useActionMutation, useActionQuery } from "@agent-native/core/client/hooks";
import { useSetPageTitle } from "@agent-native/toolkit/app-shell/header-actions";
import { IconArrowBackUp, IconArrowLeft, IconCube, IconSparkles } from "@tabler/icons-react";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

import { BudgetCard } from "@/components/studio/BudgetCard";
import { failureText, Feed, Proposals } from "@/components/studio/Changes";
import { ConnectArcon } from "@/components/studio/ConnectArcon";
import { PlanView } from "@/components/studio/PlanView";
import { RoomControls } from "@/components/studio/RoomControls";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { diffPlan, floorName, floorsOf } from "@/lib/plan";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "Project · Arcon Studio" }];
}

const codeOf = (e: unknown) => (e as { errorCode?: string } | null)?.errorCode;

export default function ProjectRoute() {
  const { id = "" } = useParams();
  const design = useActionQuery("get-design", { id });
  const budget = useActionQuery("get-budget", { id }, { enabled: design.isSuccess });
  const changes = useActionQuery("list-changes", { id });
  const [floor, setFloor] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [shown, setShown] = useState<string | null>(null);
  useSetPageTitle(design.data?.title ?? null);

  const undo = useActionMutation("undo-change", {
    onSuccess: (r) => toast.success(r.message),
    onError: (e) => toast.error(failureText(e)),
  });

  const rows = changes.data?.changes ?? [];
  const pending = rows.filter((r) => r.status === "pending");
  const proposal = pending.find((p) => p.id === shown && p.after) ?? null;
  const d = design.data;
  const diff = useMemo(() => (d && proposal?.after ? diffPlan(d.spaces, proposal.after) : null), [d, proposal]);

  if (design.isLoading) return <Loading />;
  if (design.error || !d) {
    const code = codeOf(design.error);
    if (code === "not_connected" || code === "connection_unavailable")
      return (
        <div className="px-4 py-8">
          <ConnectArcon arconUrl="https://arcon-ten.vercel.app" unavailable={code === "connection_unavailable"} />
        </div>
      );
    return (
      <div className="mx-auto max-w-lg px-4 py-12 text-center">
        <p className="text-lg font-semibold">{code === "no_plan" ? "This project has no plan chosen yet" : "Couldn't open this project"}</p>
        <p className="mt-2 text-sm text-muted-foreground">{design.error?.message}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/projects">
            <IconArrowLeft aria-hidden />
            Your projects
          </Link>
        </Button>
      </div>
    );
  }

  const floors = floorsOf(d.spaces);
  const level = floors.includes(floor) ? floor : (floors[0] ?? 0);
  const spaces = proposal?.after ?? d.spaces;
  const lastWasMine = rows.find((r) => r.status === "applied")?.resultVersion === d.version;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link to="/projects" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <IconArrowLeft className="size-3.5" aria-hidden />
            Projects
          </Link>
          <h1 className="mt-1 truncate text-2xl font-semibold">{d.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {[d.concept?.name, d.location, `version ${d.version}`, d.locked ? "approved design, changes go to the owner" : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {d.canEdit ? (
            <Button
              variant="outline"
              size="sm"
              disabled={undo.isPending || d.version === 0 || !lastWasMine}
              title={lastWasMine ? "Undo the last change made here" : "Undo works on the last change made in Studio"}
              onClick={() => undo.mutate({ id: d.id, baseVersion: d.version })}
            >
              <IconArrowBackUp aria-hidden />
              Undo
            </Button>
          ) : null}
          <Button variant="outline" size="sm" asChild>
            <a href={d.url} target="_blank" rel="noreferrer">
              <IconCube aria-hidden />
              Open in 3D
            </a>
          </Button>
          <Button
            size="sm"
            onClick={() =>
              sendToAgentChat({
                message: "Look at this design with me. What would you change first, given how I want to live? Propose the best one.",
                context: JSON.stringify({ projectId: d.id, version: d.version }),
                submit: true,
                openSidebar: true,
              })
            }
          >
            <IconSparkles aria-hidden />
            Ask the agent
          </Button>
        </div>
      </header>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section aria-label="Plan" className="min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            {floors.length > 1 ? (
              <div role="tablist" aria-label="Floor" className="inline-flex rounded-md border border-border p-0.5">
                {floors.map((f) => (
                  <button
                    key={f}
                    role="tab"
                    type="button"
                    aria-selected={f === level}
                    onClick={() => setFloor(f)}
                    className={cn("rounded px-2.5 py-1 text-xs", f === level ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
                  >
                    {floorName(f)}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{floorName(level)}</p>
            )}
            {proposal ? (
              <p className="flex flex-wrap items-center gap-3 text-xs" aria-live="polite">
                <span className="font-medium text-brand">Showing the proposal</span>
                <Legend className="bg-leaf/40" label="new" />
                <Legend className="bg-brand/40" label="changed" />
                <Legend className="border border-dashed border-destructive" label="removed" />
                <button type="button" className="underline underline-offset-2" onClick={() => setShown(null)}>
                  Back to now
                </button>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                {d.shell.width} × {d.shell.depth} m
              </p>
            )}
          </div>
          <PlanView
            spaces={spaces}
            shell={d.shell}
            floor={level}
            units={d.units}
            selected={proposal ? null : selected}
            onSelect={proposal ? undefined : (r) => setSelected((s) => (s === r ? null : r))}
            diff={diff}
            ghosts={d.spaces}
            label={`${d.title}, ${floorName(level)}${proposal ? ", with the proposed change" : ""}`}
          />
          {d.concept?.why.length ? (
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-muted-foreground">Why the plan is like this</summary>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                {d.concept.why.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <aside className="space-y-5">
          <Proposals pending={pending} version={d.version} canEdit={d.canEdit} shown={shown} onShow={setShown} />
          <RoomControls design={d} selected={selected} onSelect={setSelected} />
          {budget.data ? <BudgetCard budget={budget.data} /> : budget.isLoading ? <Skeleton className="h-40 rounded-xl" /> : null}
          <Feed rows={rows} />
        </aside>
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground">
      <span className={cn("inline-block size-2.5 rounded-sm", className)} aria-hidden />
      {label}
    </span>
  );
}

function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6" aria-busy="true">
      <Skeleton className="h-8 w-64" />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Skeleton className="aspect-[4/3] rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
