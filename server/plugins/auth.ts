import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

// The front page ("/", "/about") and Resources is open to everyone; the studio and every action stay behind sign-in.
export default createToolkitAuthPlugin({
  publicPaths: ["/", "/about", "/resources"],
  workspaceAppPublicPaths: ["/"],
  rootAuth: false,
  marketing: false,
});
