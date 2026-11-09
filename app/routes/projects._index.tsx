import { callAction, useActionQuery } from "@agent-native/core/client/hooks";
import { IconChevronRight, IconPlayerPlay, IconPlus, IconUser } from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

import { ArconMark } from "@/components/ArconMark";
import { NewProject } from "@/components/studio/NewProject";
import { startTour, STEPS } from "@/components/studio/Tour";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ago } from "@/lib/plan";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "Your studio · Arcon Studio" }];
}

/** Where a project stands, in the architect's words, and what to do next. */
export const STAGE: Record<string, { label: string; tone: string }> = {
  interview: { label: "Interview to do", tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  designing: { label: "Plans to choose", tone: "bg-brand/15 text-brand" },
  ready: { label: "Designing", tone: "bg-brand/15 text-brand" },
  review: { label: "With the client", tone: "bg-violet-500/15 text-violet-700 dark:text-violet-300" },
  approved: { label: "Approved", tone: "bg-leaf/20 text-leaf" },
  building: { label: "Building", tone: "bg-leaf/20 text-leaf" },
  done: { label: "Done", tone: "bg-muted text-muted-foreground" },
};

const hrefOf = (p: { id: string; status: string }) => (p.status === "interview" ? `/projects/${p.id}/interview` : `/projects/${p.id}`);

export default function StudioHome() {
  const projects = useActionQuery("list-projects", {});
  const clients = useActionQuery("list-clients", {});
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [adding, setAdding] = useState<{ id: string; name: string } | null | undefined>(search.get("new") ? null : undefined);
  useEffect(() => {
    if (search.get("new")) setAdding(null);
  }, [search]);

  const list = projects.data?.projects ?? [];
  const people = clients.data?.clients ?? [];
  const empty = projects.isSuccess && clients.isSuccess && !list.length && !people.length;

  // A first visit opens on a full studio: the sample clients, at every stage, so every screen has something to show.
  const seeding = useRef(false);
  useEffect(() => {
    if (!empty || seeding.current) return;
    seeding.current = true;
    void callAction("seed-studio", {}).then(() => Promise.all([projects.refetch(), clients.refetch()]));
  }, [empty, projects, clients]);
  const tour = async () => {
    const r = await callAction("seed-studio", {});
    if (!r.demo) return;
    startTour(r.demo);
    navigate(STEPS[0]!.path(r.demo));
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Arcon Studio</p>
          <h1 className="mt-1 text-3xl font-semibold">Your studio</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your clients and their designs. The agent works beside you; nothing changes until you approve.</p>
        </div>
        {adding === undefined && !empty ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void tour()}>
              <IconPlayerPlay aria-hidden />
              Take the tour
            </Button>
            <Button onClick={() => setAdding(null)}>
              <IconPlus aria-hidden />
              New client
            </Button>
          </div>
        ) : null}
      </header>

      {adding !== undefined || empty ? (
        <div className="mt-6">
          {empty && adding === undefined ? (
            <div className="mb-4 flex items-center gap-3 rounded-2xl border border-dashed border-border p-4">
              <ArconMark growing className="size-10 shrink-0 text-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Start with your first client. You&apos;ll run Arcon&apos;s interview with them, then pick from plans drawn from what they said.
              </p>
            </div>
          ) : null}
          <NewProject client={adding ?? null} onClose={() => setAdding(undefined)} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section aria-labelledby="projects-heading">
          <h2 id="projects-heading" className="text-sm font-semibold">
            Projects
          </h2>
          {projects.isLoading ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : projects.error ? (
            <p className="mt-3 text-sm text-destructive" role="alert">
              {projects.error.message}
            </p>
          ) : !list.length ? (
            <p className="mt-3 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">No projects yet.</p>
          ) : (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {list.map((p) => {
                const stage = STAGE[p.status] ?? { label: p.status, tone: "bg-muted text-muted-foreground" };
                return (
                  <li key={p.id}>
                    <Link
                      to={hrefOf(p)}
                      className="group flex h-full flex-col gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{p.title}</span>
                          <span className="block truncate text-xs text-muted-foreground">{[p.clientName, p.location].filter(Boolean).join(" · ")}</span>
                        </span>
                        <IconChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </span>
                      <span className="flex items-center justify-between gap-2 text-xs">
                        <span className={cn("rounded-full px-2 py-0.5 font-medium", stage.tone)}>{stage.label}</span>
                        <span className="text-muted-foreground">{ago(p.updatedAt)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside aria-labelledby="clients-heading">
          <h2 id="clients-heading" className="text-sm font-semibold">
            Clients
          </h2>
          {clients.isLoading ? (
            <Skeleton className="mt-3 h-32 rounded-xl" />
          ) : !people.length ? (
            <p className="mt-3 text-sm text-muted-foreground">Clients you add show here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
              {people.map((c) => (
                <li key={c.id} className="flex items-center gap-3 px-3 py-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand" aria-hidden>
                    <IconUser className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {c.name}
                      {c.notes?.startsWith("Sample client") ? <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">Sample</span> : null}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.projects} project{c.projects === 1 ? "" : "s"}
                      {c.contactEmail ? ` · ${c.contactEmail}` : ""}
                    </span>
                  </span>
                  <Button size="xs" variant="ghost" onClick={() => setAdding({ id: c.id, name: c.name })} aria-label={`New project for ${c.name}`}>
                    <IconPlus aria-hidden />
                    Project
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}
