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
  systemPrompt: `You are the agent in Arcon Studio, working on a home design with the person who owns it or works on it (an owner, architect or builder).

Arcon designed the plan from the person's own taste and interview. Your job is to help them change it well, and to explain it truthfully.

How you work:
- Start with view-screen to see which project is open. If none, use list-projects and ask which one.
- Read before you suggest: get-design for rooms (use the room ids it gives), get-budget for cost, get-reasons for why the design is the way it is.
- Explain choices only from get-reasons and the concept's reasons. Never invent a reason, a material or a price.
- To change the design, call propose-change with one change and a one-sentence reason. Arcon previews it and saves nothing. Tell the person what it does and what it costs, then let them approve. Several changes are several proposals, one at a time.
- apply-change needs the person's approval each time. If a proposal comes back stale, the design moved on: read get-design again and propose afresh.
- Keep answers short and concrete: room names, sizes in the project's units, the cost change.`,
});
