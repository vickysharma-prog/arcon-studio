import { fail } from "@agent-native/core/action";
import { resolveSecretDetailed } from "@agent-native/core/server";

// Every call Studio makes to Arcon goes through here: the person's own token, Arcon's answer mapped to a failure
// the UI and the agent can both act on. The token never leaves this function.

const ARCON_URL = (process.env.ARCON_URL ?? "https://arcon-ten.vercel.app").replace(/\/$/, ""); // guard:allow-env-credential — the deploy-level address of Arcon, not a credential

export const ARCON_ERRORS = ["not_connected", "connection_unavailable", "not_found", "stale", "does_not_fit", "no_plan", "done", "approved", "nothing_to_undo", "bad_change", "arcon_unavailable"] as const;
export type ArconError = (typeof ARCON_ERRORS)[number];

/** Arcon's error code for a response, narrowed to the ones Studio knows. Pure, so it is tested without a network. */
export function codeOf(status: number, body: { code?: unknown } | null): ArconError {
  const code = typeof body?.code === "string" ? body.code : "";
  if ((ARCON_ERRORS as readonly string[]).includes(code)) return code as ArconError;
  if (status === 401) return "not_connected";
  if (status === 404) return "not_found";
  if (status === 409) return "stale";
  if (status === 422) return "does_not_fit";
  if (status === 400) return "bad_change";
  return "arcon_unavailable";
}

const MESSAGE: Partial<Record<ArconError, string>> = {
  not_connected: "Studio isn't connected to Arcon. Add your connection token in Settings, under API keys.",
  connection_unavailable: "Couldn't read your Arcon connection just now. Try again in a moment.",
  not_found: "That project isn't one this connection can see.",
  stale: "The design changed since this was worked out, so nothing was saved.",
  arcon_unavailable: "Arcon didn't answer just now. Try again in a moment.",
};

export async function arcon<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const secret = await resolveSecretDetailed("ARCON_STUDIO_TOKEN");
  if (secret.lookupFailed) fail(MESSAGE.connection_unavailable!, { errorCode: "connection_unavailable", statusCode: 503 });
  // A connection acts as one Arcon person, so only that person's own key counts: a key shared with a whole
  // workspace would let everyone in it act as whoever pasted it.
  if (!secret.value || secret.source !== "user") fail(MESSAGE.not_connected!, { errorCode: "not_connected", statusCode: 401 });
  let res: Response;
  try {
    res = await fetch(`${ARCON_URL}/api/studio${path}`, {
      method: init.method ?? "GET",
      headers: { authorization: `Bearer ${secret.value.trim()}`, ...(init.body === undefined ? {} : { "content-type": "application/json" }) },
      body: init.body === undefined ? null : JSON.stringify(init.body),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    fail(MESSAGE.arcon_unavailable!, { errorCode: "arcon_unavailable", statusCode: 502 });
  }
  const body = (await res.json().catch(() => null)) as (Record<string, unknown> & { error?: string; code?: string }) | null;
  if (res.ok && body) return body as T;
  const code = codeOf(res.status, body);
  const message = (code === "stale" ? MESSAGE.stale : body?.error) ?? MESSAGE[code] ?? MESSAGE.arcon_unavailable!;
  const details = code === "stale" && typeof body?.version === "number" ? { version: body.version } : undefined;
  fail(message, { errorCode: code, statusCode: res.status >= 400 && res.status < 600 ? res.status : 502, ...(details ? { details } : {}) });
}

export const arconUrl = ARCON_URL;

/** The signed-in Studio person, whose changes these are. */
export function ownerOf(ctx?: { userEmail?: string }): string {
  const email = ctx?.userEmail;
  if (!email) fail("Sign in to Studio first.", { errorCode: "not_connected", statusCode: 401 });
  return email;
}
