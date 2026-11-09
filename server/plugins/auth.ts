import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

// The front page ("/" and "/about") is open to everyone; the studio and every action stay behind sign-in.
export default createToolkitAuthPlugin({
  publicPaths: ["/", "/about"],
  workspaceAppPublicPaths: ["/"],
  rootAuth: false,
  marketing: false,
});
