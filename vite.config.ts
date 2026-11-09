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
      { find: /^next\/dynamic$/, replacement: path.resolve(__dirname, "app/arcon/shims/dynamic.tsx") },
    ],
  },
  optimizeDeps: {
    // The 3D model and Arcon's motion: pre-bundled, so their CommonJS pieces (scheduler) load in dev.
    include: [
      "scheduler",
      "three",
      "@react-three/fiber",
      "@react-three/drei",
      "@react-three/postprocessing",
      "postprocessing",
      "motion/react",
    ],
    entries: [
      "app/entry.client.tsx",
      "app/root.tsx",
      "app/components/layout/{Layout,Sidebar}.tsx",
      "app/components/chat/ChatRouteContent.tsx",
      "app/routes/{home,chat.$threadId}.tsx",
    ],
  },
  plugins: [
    // Agent-Native tags every JSX element with data-* attributes in dev so the agent can find its source. React Three
    // Fiber's elements (<mesh>, <group>) aren't DOM and reject them, so the 3D files are left untagged: the tagger
    // only touches a file whose code still matches the disk, and this marks the 3D ones first. Dev only.
    {
      name: "studio-3d-untagged",
      enforce: "pre",
      transform(code: string, id: string) {
        if (!/[\\/]app[\\/]arcon[\\/]three[\\/][^?]+\.tsx($|\?)/.test(id)) return null;
        return { code: `${code}\n// 3D: no DOM tagging\n`, map: null };
      },
    },
    ...reactRouterPlugins(),
    ...agentNativePlugins({
      ssrStubs: ["shiki"],
    }),
  ],
});
