import { useActionQuery } from "@agent-native/core/client/hooks";
import { IconChevronRight, IconLayoutGrid } from "@tabler/icons-react";
import { Link } from "react-router";

import { Skeleton } from "@/components/ui/skeleton";
import { ConnectArcon } from "@/components/studio/ConnectArcon";
import { ago } from "@/lib/plan";

export function meta() {
  return [{ title: "Your projects · Arcon Studio" }];
}

export default function ProjectsRoute() {
  const status = useActionQuery("arcon-status", {});
  const connected = status.data?.connected === true;
  const projects = useActionQuery("list-projects", {}, { enabled: connected });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {status.isLoading ? (
        <Skeleton className="h-40 w-full rounded-2xl" />
      ) : !connected ? (
        <ConnectArcon arconUrl={status.data?.arconUrl ?? "https://arcon-ten.vercel.app"} unavailable={status.data?.reason === "unavailable"} />
      ) : (
        <>
          <p className="text-xs font-medium uppercase tracking-wider text-brand">Arcon Studio</p>
          <h1 className="mt-1 text-2xl font-semibold">{status.data?.name ? `${status.data.name}'s projects` : "Your projects"}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Open one to work on it with your agent. It proposes, you approve.</p>
          {projects.isLoading ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          ) : projects.error ? (
            <p className="mt-6 text-sm text-destructive" role="alert">
              {projects.error.message}
            </p>
          ) : !projects.data?.projects.length ? (
            <p className="mt-6 rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No projects yet. Start one in Arcon, and it shows up here.
            </p>
          ) : (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {projects.data.projects.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/projects/${p.id}`}
                    className="group flex h-full items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-brand/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand" aria-hidden>
                      <IconLayoutGrid className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{p.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[p.location, p.role === "owner" ? "Yours" : `You're the ${p.role}`, p.hasPlan ? null : "No plan chosen yet", ago(p.updatedAt)]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </span>
                    <IconChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
