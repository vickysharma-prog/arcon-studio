import { agentNativePath } from "@agent-native/core/client/api-path";
import { IconExternalLink } from "@tabler/icons-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Shown until Studio has the person's Arcon connection token. One field, for Arcon only. The token goes to the
// framework's own secrets store as the person's key (never to the agent, never into the page after saving).

const TOKEN = /^arc_st_[A-Za-z0-9_-]{43}$/;

export function ConnectArcon({ arconUrl, unavailable, onConnected }: { arconUrl: string; unavailable?: boolean; onConnected?: () => void }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const token = value.trim();
    if (!TOKEN.test(token)) return setError("That doesn't look like an Arcon connection token. It starts with arc_st_.");
    setBusy(true);
    setError(null);
    const res = await fetch(agentNativePath("/_agent-native/secrets/ARCON_STUDIO_TOKEN"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: token }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const body = (await res?.json().catch(() => null)) as { error?: string } | null;
      return setError(body?.error ?? "Couldn't save it just now. Please try again.");
    }
    setValue("");
    onConnected?.();
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-6">
      <p className="text-xs font-medium uppercase tracking-wider text-brand">Arcon Studio</p>
      <h1 className="mt-1 text-xl font-semibold">{unavailable ? "Arcon isn't answering right now" : "Connect your Arcon account"}</h1>
      {unavailable ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">Your connection is saved. Try again in a moment.</p>
          {onConnected ? (
            <Button variant="outline" className="mt-4" onClick={onConnected}>
              Try again
            </Button>
          ) : null}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            Studio works on the designs Arcon made for you. Your agent proposes changes, you see the new plan and what it does to the cost, and nothing
            changes until you approve.
          </p>
          <ol className="mt-4 space-y-3 text-sm">
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">1</span>
              <span>
                On your Arcon account page, under Arcon Studio, press <strong>Connect Arcon Studio</strong> and copy the token.{" "}
                <a href={`${arconUrl}/account`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-brand underline-offset-2 hover:underline">
                  Open Arcon
                  <IconExternalLink className="size-3.5" aria-hidden />
                </a>
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">2</span>
              <span>Paste it here. It is kept for you alone and never shown to the agent.</span>
            </li>
          </ol>
          <form className="mt-5 flex flex-col gap-2 sm:flex-row" onSubmit={save}>
            <label htmlFor="arcon-token" className="sr-only">
              Arcon connection token
            </label>
            <Input
              id="arcon-token"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="arc_st_…"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "arcon-token-error" : undefined}
            />
            <Button type="submit" disabled={busy || !value.trim()}>
              {busy ? "Connecting…" : "Connect"}
            </Button>
          </form>
          {error ? (
            <p id="arcon-token-error" className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
