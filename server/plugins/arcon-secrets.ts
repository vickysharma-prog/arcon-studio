import { registerRequiredSecret } from "@agent-native/core/secrets";

// Each person connects Studio to their own Arcon account with the token Arcon shows once on its account page.
registerRequiredSecret({
  key: "ARCON_STUDIO_TOKEN",
  label: "Arcon connection",
  description: "The connection token from your Arcon account page (Account, Arcon Studio, Connect). Studio acts as you, with your role on each project.",
  docsUrl: "https://arcon-ten.vercel.app/account",
  scope: "user",
  kind: "api-key",
  required: true,
  validator: (value) =>
    /^arc_st_[A-Za-z0-9_-]{43}$/.test(value.trim()) ? { ok: true } : { ok: false, error: "That doesn't look like an Arcon connection token. It starts with arc_st_." },
  usedFor: [{ feature: "Reading and changing your Arcon designs", effectWhenRemoved: "Studio can no longer see or change your projects until you connect again." }],
});

export default () => {};
