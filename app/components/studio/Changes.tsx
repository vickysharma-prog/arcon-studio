import { useActionMutation } from "@agent-native/core/client/hooks";
import { IconArrowBackUp, IconCheck, IconEye, IconRobot, IconUser, IconX } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ago } from "@/lib/plan";
import { cn } from "@/lib/utils";

import type { ChangeRow } from "./types";

// The agent's proposals waiting for the person, and the feed of everything that happened to the design in Studio.

export function failureText(e: unknown): string {
  return e instanceof Error && e.message ? e.message : "That didn't work. Please try again.";
}

export function Proposals({
  pending,
  version,
  canEdit,
  shown,
  onShow,
}: {
  pending: ChangeRow[];
  version: number;
  canEdit: boolean;
  shown: string | null;
  onShow: (id: string | null) => void;
}) {
  const apply = useActionMutation("apply-change", {
    onSuccess: (r) => {
      onShow(null);
      toast.success(r.message);
    },
    onError: (e) => toast.error(failureText(e)),
  });
  const reject = useActionMutation("reject-change", {
    onSuccess: () => onShow(null),
    onError: (e) => toast.error(failureText(e)),
  });
  if (pending.length === 0) return null;

  return (
    <section aria-labelledby="proposals-heading" className="space-y-2">
      <h2 id="proposals-heading" className="flex items-center gap-2 text-sm font-semibold">
        <span className="relative flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-brand opacity-60 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-brand" />
        </span>
        Waiting for you ({pending.length})
      </h2>
      {pending.map((p) => {
        const outOfDate = p.baseVersion !== version;
        const busy = (apply.isPending && apply.variables?.changeId === p.id) || (reject.isPending && reject.variables?.changeId === p.id);
        return (
          <article
            key={p.id}
            className={cn("rounded-xl border bg-card p-3 shadow-xs transition-colors", shown === p.id ? "border-brand ring-1 ring-brand/40" : "border-border")}
          >
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <IconRobot className="size-3.5" aria-hidden />
              Your agent proposes · {ago(p.createdAt)}
            </p>
            <p className="mt-1 text-sm font-medium">{p.summary}</p>
            {p.reason ? <p className="mt-1 text-sm text-muted-foreground">{p.reason}</p> : null}
            {p.cost ? <p className="mt-2 inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-medium tabular-nums">{p.cost}</p> : null}
            {outOfDate ? (
              <p className="mt-2 text-xs text-muted-foreground">The design changed since this was worked out. Ask the agent to propose it again.</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {p.after ? (
                <Button size="sm" variant="ghost" onClick={() => onShow(shown === p.id ? null : p.id)} aria-pressed={shown === p.id}>
                  <IconEye aria-hidden />
                  {shown === p.id ? "Hide on plan" : "See on plan"}
                </Button>
              ) : null}
              {canEdit ? (
                <>
                  <Button size="sm" disabled={busy || outOfDate} onClick={() => apply.mutate({ changeId: p.id })}>
                    <IconCheck aria-hidden />
                    {apply.isPending && apply.variables?.changeId === p.id ? "Applying…" : "Approve"}
                  </Button>
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => reject.mutate({ changeId: p.id })}>
                    <IconX aria-hidden />
                    Reject
                  </Button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Only people who can edit this design can approve.</p>
              )}
            </div>
          </article>
        );
      })}
    </section>
  );
}

const STATUS: Record<ChangeRow["status"], string> = {
  pending: "Waiting",
  applying: "Applying",
  applied: "Applied",
  rejected: "Rejected",
  stale: "Out of date",
  failed: "Didn't apply",
};

export function Feed({ rows }: { rows: ChangeRow[] }) {
  const done = rows.filter((r) => r.status !== "pending");
  return (
    <section aria-labelledby="feed-heading">
      <h2 id="feed-heading" className="text-sm font-semibold">
        What happened
      </h2>
      {done.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">Nothing yet. Changes you make here, and the agent&apos;s proposals, show up in order.</p>
      ) : (
        <ol className="mt-2 space-y-3">
          {done.slice(0, 20).map((r) => {
            const Icon = r.kind === "undo" ? IconArrowBackUp : r.proposedBy === "agent" ? IconRobot : IconUser;
            return (
              <li key={r.id} className="flex gap-2.5 text-sm">
                <span
                  className={cn(
                    "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full",
                    r.proposedBy === "agent" ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground",
                  )}
                  aria-hidden
                >
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0">
                  <p className={cn(r.status !== "applied" && "text-muted-foreground")}>{r.status === "applied" ? (r.note ?? r.summary) : r.summary}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.proposedBy === "agent"
                      ? r.status === "applied"
                        ? "Agent proposed, you approved"
                        : r.status === "rejected"
                          ? "Agent proposed, you said no"
                          : "Agent proposed"
                      : r.kind === "undo"
                        ? "You undid a change"
                        : "You changed it"}
                    {r.status !== "applied" ? ` · ${STATUS[r.status]}` : ""} · {ago(r.updatedAt)}
                    {r.resultVersion !== null ? ` · v${r.resultVersion}` : ""}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
