import { defineAction, defineActionErrors } from "@agent-native/core/action";
import { z } from "zod";
import { arcon, arconUrl } from "../server/lib/arcon.js";

// Whether Studio is connected to Arcon, and as whom. Never fails for a missing connection: the UI shows the way to connect.
export default defineAction({
  description: "Check whether Studio is connected to the person's Arcon account. Returns { connected, name }.",
  schema: z.object({}),
  outputSchema: z.object({ connected: z.boolean(), name: z.string().nullable(), reason: z.enum(["ok", "not_connected", "unavailable"]), arconUrl: z.string() }),
  errors: defineActionErrors("unexpected"),
  http: { method: "GET" },
  run: async () => {
    try {
      const me = await arcon<{ name: string | null }>("/me");
      return { connected: true, name: me.name ?? null, reason: "ok" as const, arconUrl };
    } catch (e) {
      const code = (e as { errorCode?: string }).errorCode;
      return { connected: false, name: null, reason: code === "not_connected" ? ("not_connected" as const) : ("unavailable" as const), arconUrl };
    }
  },
});
