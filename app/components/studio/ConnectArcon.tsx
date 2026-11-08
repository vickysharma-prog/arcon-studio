import { SecretsSection } from "@agent-native/toolkit/app/settings";
import { IconExternalLink } from "@tabler/icons-react";

import { Button } from "@/components/ui/button";

// Shown until Studio has the person's Arcon connection token. Two steps, both the person's own.
export function ConnectArcon({ arconUrl, unavailable, onConnected }: { arconUrl: string; unavailable?: boolean; onConnected?: () => void }) {
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
                On your Arcon account page, under Arcon Studio, press <strong>Connect Arcon Studio</strong> and copy the token.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-semibold text-brand">2</span>
              <span>
                Paste it below as <strong>Arcon connection</strong>. It is kept for you alone, never shown to the agent.
              </span>
            </li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button asChild>
              <a href={`${arconUrl}/account`} target="_blank" rel="noreferrer">
                <IconExternalLink aria-hidden />
                Open my Arcon account
              </a>
            </Button>
          </div>
          <div className="mt-6 border-t border-border pt-4">
            <SecretsSection focusKey="ARCON_STUDIO_TOKEN" />
          </div>
          {onConnected ? (
            <Button variant="outline" className="mt-4 w-full" onClick={onConnected}>
              I&apos;ve saved it, show my projects
            </Button>
          ) : null}
        </>
      )}
    </div>
  );
}
