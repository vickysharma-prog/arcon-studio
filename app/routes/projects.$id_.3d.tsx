import { useActionQuery } from "@agent-native/core/client/hooks";
import { IconArrowLeft } from "@tabler/icons-react";
import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import { Link, useParams } from "react-router";

import { ArconMark } from "@/components/ArconMark";
import { cn } from "@/lib/utils";

export function meta() {
  return [{ title: "3D · Arcon Studio" }];
}

// Studio's 3D model of the design, drawn in the browser only (WebGL has no server side).
const HouseScene = lazy(() => import("@arcon/three/HouseScene"));
type SceneProps = ComponentProps<typeof HouseScene>;

const MODES = [
  { id: "orbit", label: "Look around" },
  { id: "walk", label: "Walk through" },
] as const;

export default function SceneRoute() {
  const { id = "" } = useParams();
  const scene = useActionQuery("get-scene", { id });
  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<(typeof MODES)[number]["id"]>("orbit");
  const [room, setRoom] = useState<string | null>(null);
  useEffect(() => setMounted(true), []);

  const d = scene.data;
  return (
    <div className="flex h-full min-h-[70vh] flex-col bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <Link to={`/projects/${id}`} className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-ink">
            <IconArrowLeft className="size-3.5" aria-hidden />
            Back to the design
          </Link>
          <h1 className="truncate text-lg font-semibold">{d?.title ?? "3D"}</h1>
        </div>
        <div role="radiogroup" aria-label="View" className="flex gap-1 rounded-full border border-line bg-paper-raised p-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              role="radio"
              aria-checked={mode === m.id}
              onClick={() => setMode(m.id)}
              className={cn("rounded-full px-3 py-1 text-sm transition-colors", mode === m.id ? "bg-btn text-btn-ink" : "text-ink-soft hover:text-ink")}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1">
        {mode === "walk" && room ? (
          <p className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 rounded-full bg-paper-raised/90 px-4 py-1.5 text-sm shadow" aria-live="polite">
            {room}
          </p>
        ) : null}
        {scene.error ? (
          <p className="p-6 text-sm text-destructive" role="alert">
            {scene.error.message}
          </p>
        ) : !d || !mounted ? (
          <Loading />
        ) : (
          <Suspense fallback={<Loading />}>
            <div className="absolute inset-0">
              <HouseScene
                key={`${d.version}-${mode}`}
                layout={d.layout as SceneProps["layout"]}
                brief={(d.brief ?? undefined) as SceneProps["brief"]}
                taste={(d.taste ?? undefined) as SceneProps["taste"]}
                newBuild={d.newBuild}
                mode={mode}
                playing={mode === "walk"}
                cutaway={mode === "orbit"}
                autoRotate={mode === "orbit"}
                wheelZoom
                onRoom={setRoom}
              />
            </div>
          </Suspense>
        )}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-sm text-ink-soft">
      <ArconMark growing className="size-14 text-ink" aria-hidden />
      Building the model
    </div>
  );
}
