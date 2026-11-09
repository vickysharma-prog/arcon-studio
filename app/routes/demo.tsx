import { callAction } from "@agent-native/core/client/hooks";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";

import { AnimatedMark } from "@arcon/AnimatedMark";
import { startTour, STEPS } from "@/components/studio/Tour";

export function meta() {
  return [{ title: "Demo · Arcon Studio" }];
}

// The judges' way in: a full sample studio in the signed-in account, then the guided run through it, end to end.
export default function DemoRoute() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    callAction("seed-studio", {})
      .then((r) => {
        if (!r.demo) return setError("The sample project couldn't be found.");
        startTour(r.demo);
        navigate(STEPS[0]!.path(r.demo), { replace: true });
      })
      .catch((e: { actionMessage?: string; message?: string }) => setError(e.actionMessage ?? e.message ?? "That didn't work."));
  }, [navigate]);
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <AnimatedMark size={84} />
      <p className="text-lg font-semibold">{error ? "The demo couldn't start" : "Setting up a full studio for you"}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{error ?? "Six sample clients, each at a different stage. It takes a few seconds."}</p>
    </div>
  );
}
