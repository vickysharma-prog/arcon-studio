import { sendToAgentChatAndConfirm } from "@agent-native/core/client/agent-chat";
import { toast } from "sonner";

/**
 * Hands the architect's request to the agent in the side panel and checks it arrived. The first press opens the
 * panel, which may not be listening yet, so an undelivered message is sent once more when it is.
 */
export async function askAgent(message: string, context: Record<string, unknown>) {
  const send = () => sendToAgentChatAndConfirm({ message, context: JSON.stringify(context), submit: true, openSidebar: true }, { timeoutMs: 4000 });
  const first = await send().catch(() => ({ delivered: false }));
  if (first.delivered) return;
  await new Promise((r) => setTimeout(r, 900));
  const second = await send().catch(() => ({ delivered: false }));
  if (!second.delivered) toast.error("The agent panel didn't open. Open it on the right and ask there.");
}
