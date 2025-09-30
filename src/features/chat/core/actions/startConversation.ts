/**
 * startConversation
 * Chooses a driver based on flowId, creates session if DB-backed, and returns
 * a minimal descriptor the UI/hooks can use to update state.
 */
import { DatabaseFlowDriver } from '../adapters/DatabaseFlowDriver';
import { ScriptedFlowDriver } from '../adapters/ScriptedFlowDriver';
import { ChatDatabaseService } from '../services/ChatDatabaseService';

type Params = {
  flowId: string;
  scriptedFlowRegistry?: Record<string, any>;
  ctx?: unknown;
};

export async function startConversation({ flowId, scriptedFlowRegistry, ctx }: Params) {
  if (flowId === 'about') {
    // DB-backed path
    const driver = new DatabaseFlowDriver(flowId);
    const sessionId = await ChatDatabaseService.createSession((ctx as any)?.customerId);
    if (!sessionId) throw new Error('Failed to create session');
    const initialNode = await ChatDatabaseService.fetchInitialNode(flowId);
    if (!initialNode) throw new Error('No initial node');
    await ChatDatabaseService.attachSessionToFlow({ sessionId, flowId, nodeId: initialNode.node_id });
    await ChatDatabaseService.insertMessage({ sessionId, text: initialNode.text, role: 'printy', nodeId: initialNode.node_id });
    const messages = await ChatDatabaseService.fetchSessionMessages(sessionId);
    const node = await ChatDatabaseService.fetchCurrentNode(sessionId);
    const options = node ? await ChatDatabaseService.fetchOptions(node.node_id) : [];
    const quickReplies = options.map((o: any, i: number) => ({ id: `qr-${i}`, label: o.label, value: o.label }));
    return { driver, sessionId, messages, quickReplies } as const;
  }

  // Scripted path
  const flow = scriptedFlowRegistry?.[flowId];
  if (!flow) throw new Error(`Flow not found: ${flowId}`);
  const driver = new ScriptedFlowDriver(flow);
  const initial = await driver.initial(ctx || {});
  const messages = initial.map(m => ({ id: crypto.randomUUID(), role: 'printy' as const, text: m.text, ts: Date.now() }));
  const quickReplies = flow.quickReplies().map((l: string, i: number) => ({ id: `qr-${i}`, label: l, value: l }));
  return { driver, sessionId: null as string | null, messages, quickReplies } as const;
}


