/**
 * sendConversationMessage
 * Sends user input through the appropriate driver and returns UI-ready updates.
 */
import { ChatDatabaseService } from '../services/ChatDatabaseService';
import type { FlowDriver } from '../adapters/FlowDriver';

type Params = {
  driver: FlowDriver;
  sessionId: string | null;
  activeNodeId?: string | null;
  input: string;
};

export async function sendConversationMessage({ driver, sessionId, activeNodeId, input }: Params) {
  // DB-backed path (About Us)
  if (sessionId) {
    const sid = sessionId;
    await ChatDatabaseService.insertMessage({ sessionId: sid, text: input, role: 'user' });
    // Resolve transition from current node
    const node = await ChatDatabaseService.fetchCurrentNode(sid);
    const options = node ? await ChatDatabaseService.fetchOptions(node.node_id) : [];
    const match = options.find((o: any) => o.label.toLowerCase() === input.trim().toLowerCase());
    if (!match) {
      await ChatDatabaseService.insertMessage({ sessionId: sid, text: 'Please choose one of the options.', role: 'printy', nodeId: activeNodeId || node?.node_id });
    } else {
      await ChatDatabaseService.updateCurrentNode(sid, match.to_node_id);
      const next = await ChatDatabaseService.fetchCurrentNode(sid);
      if (next) {
        await ChatDatabaseService.insertMessage({ sessionId: sid, text: next.text, role: 'printy', nodeId: next.node_id });
      }
    }
    const messages = await ChatDatabaseService.fetchSessionMessages(sid);
    const now = await ChatDatabaseService.fetchCurrentNode(sid);
    const newOptions = now ? await ChatDatabaseService.fetchOptions(now.node_id) : [];
    const quickReplies = (newOptions.length ? newOptions : [{ label: 'End Chat' }]).map((o: any, i: number) => ({ id: `qr-${i}`, label: o.label, value: o.label }));
    return { messages, quickReplies, activeNodeId: now?.node_id || null } as const;
  }

  // Scripted path
  const resp = await driver.respond({}, input);
  const botMessages = (resp.messages || []).map(m => ({ id: crypto.randomUUID(), role: 'printy' as const, text: m.text, ts: Date.now() }));
  const quickReplies = (resp.quickReplies || []).map((l: string, i: number) => ({ id: `qr-${i}`, label: l, value: l }));
  return { messages: botMessages, quickReplies, activeNodeId: null } as const;
}


