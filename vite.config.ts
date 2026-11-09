import { agentNative } from "@agent-native/core/vite";
import { reactRouter } from "@react-router/dev/vite";
import path from "node:path";
import { defineConfig } from "vite";

const reactRouterPlugins = reactRouter as unknown as () => any[];
const agentNativePlugins = agentNative as unknown as (
  options?: Parameters<typeof agentNative>[0],
) => any[];
export default defineConfig({
  resolve: {
    // Arcon's engine and the components ported from Arcon, and Next's two modules they used, answered by Studio.
    alias: [
      { find: /^@engine\/(.*)$/, replacement: path.resolve(__dirname, "engine/$1") },
      { find: /^@arcon\/(.*)$/, replacement: path.resolve(__dirname, "app/arcon/$1") },
      { find: /^next\/link$/, replacement: path.resolve(__dirname, "app/arcon/shims/link.tsx") },
      { find: /^next\/navigation$/, replacement: path.resolve(__dirname, "app/arcon/shims/navigation.ts") },
    ],
  },
  optimizeDeps: {
    entries: [
      "app/entry.client.tsx",
      "app/root.tsx",
      "app/components/layout/{Layout,Sidebar}.tsx",
      "app/components/chat/ChatRouteContent.tsx",
      "app/routes/{home,chat.$threadId}.tsx",
    ],
  },
  plugins: [
    ...reactRouterPlugins(),
    ...agentNativePlugins({
      ssrStubs: ["shiki"],
    }),
  ],
});
