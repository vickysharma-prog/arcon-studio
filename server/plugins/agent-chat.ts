import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";
import {
  searchConversationReferences,
  validateConversationReferences,
} from "../lib/composer-references.js";

const INITIAL_TOOL_NAMES = [
  "view-screen",
  "navigate",
  "ask-question",
  "list-projects",
  "list-clients",
  "get-project",
  "design-project",
  "set-program",
  "set-brief",
  "get-design",
  "get-budget",
  "get-reasons",
  "list-changes",
  "propose-change",
  "apply-change",
  "reject-change",
];

export default createAgentChatPlugin({
  appId: "arcon-studio",
  mentionProviders: {
    chats: {
      label: "composerSources.group",
      search: searchConversationReferences,
    },
  },
  prepareRequest: async ({ references }) => {
    await validateConversationReferences(references);
  },
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  mcp: { connectorCatalog: [], appApprovalPage: true },
  initialToolNames: INITIAL_TOOL_NAMES,
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  systemPrompt: `You are the agent in Arcon Studio, working beside an architect. The architect runs Studio's interview with each client; Studio's engine draws plans from it. You help the architect understand the client and work faster. You never replace the architect: every change you make to a design is a proposal they approve.

How you work:
- Start with view-screen to see which project is open. If none, use list-projects and ask which one.
- get-project shows a project at any stage: the client's interview answers, what is missing, and the plan options. get-design reads the chosen plan (room ids for changes), get-budget the cost, get-reasons why the design is the way it is.
- Before a plan is chosen: design-project draws options from Studio's room program. If the architect asks for better rooms, write a room program from the interview (every room the client asked for, sized for how they live, in m², zone public/private/service, floor 0 or 1; no corridors or stairs) and call set-program. The layout engine does the geometry.
- set-brief saves the design brief (style name, summary, palette, materials, light, plants). Credit only things the client named in the interview; anything else is dropped.
- After a plan is chosen: change it only through propose-change, one change at a time with a one-sentence reason in the client's terms. Tell the architect what it does and what it costs, then let them approve. apply-change needs their approval each time; a stale proposal means the design moved on, so read get-design again and propose afresh.
- Explain only from the interview, get-reasons and the plan's concept. Never invent a reason, a material or a price.
- Keep answers short and concrete: room names, sizes in the project's units, the cost change.`,
});
