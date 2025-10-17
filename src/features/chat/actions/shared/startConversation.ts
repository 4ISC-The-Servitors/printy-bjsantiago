/**
 * @deprecated LEGACY SYSTEM - DO NOT USE
 *
 * This action uses the old DatabaseFlowDriver and ScriptedFlowDriver systems.
 * Use JsonbFlowProcessor.startFlow() instead.
 *
 * Migration example:
 *
 * OLD:
 * const result = await startConversation({ flowId: 'ask-quote', ctx });
 *
 * NEW:
 * const flowDefinition = await getFlowDefinition('ask-quote');
 * const result = await JsonbFlowProcessor.startFlow({
 *   flowId: 'ask-quote',
 *   customerId,
 *   flowDefinition,
 *   initialContext: ctx,
 * });
 *
 * This file will be removed in Phase 5.
 * See: docs_guide/CHAT_SYSTEM_MIGRATION_PLAN.md
 *
 * Chooses a driver based on flowId, creates session if DB-backed, and returns
 * a minimal descriptor the UI/hooks can use to update state.
 */
import { DatabaseFlowDriver } from '@features/chat/adapters/DatabaseFlowDriver';
import { ScriptedFlowDriver } from '@features/chat/adapters/ScriptedFlowDriver';
import { ChatDatabaseService } from '@features/chat/services/ChatDatabaseService';

type Params = {
  flowId: string;
  scriptedFlowRegistry?: Record<string, any>;
  ctx?: unknown;
};

export async function startConversation({
  flowId,
  scriptedFlowRegistry,
  ctx,
}: Params) {
  // Normalize legacy flow ids to DB-backed equivalents
  const normalizedFlowId =
    flowId === 'issue-ticket'
      ? 'ask-assistance'
      : flowId === 'track-ticket'
        ? 'customer-track-ticket'
        : flowId;

  // DB-backed flows
  if (
    normalizedFlowId === 'about' ||
    normalizedFlowId === 'ask-assistance' ||
    normalizedFlowId === 'customer-track-ticket' ||
    normalizedFlowId === 'ask-quote'
  ) {
    // DB-backed path
    const driver = new DatabaseFlowDriver(normalizedFlowId);
    const sessionId = await ChatDatabaseService.createSession(
      (ctx as any)?.customerId
    );
    if (!sessionId) throw new Error('Failed to create session');
    const initialNode =
      await ChatDatabaseService.fetchInitialNode(normalizedFlowId);
    if (!initialNode) throw new Error('No initial node');
    await ChatDatabaseService.attachSessionToFlow({
      sessionId,
      flowId: normalizedFlowId,
      nodeId: initialNode.node_id,
    });
    await ChatDatabaseService.insertMessage({
      sessionId,
      text: initialNode.text,
      role: 'printy',
      nodeId: initialNode.node_id,
    });
    const messages = await ChatDatabaseService.fetchSessionMessages(sessionId);
    const hasAnyText = (messages || []).some(
      m => (m.text || '').trim().length > 0
    );
    const safeMessages = hasAnyText
      ? messages
      : [
          {
            id: crypto.randomUUID(),
            role: 'printy' as const,
            text: initialNode.text,
            ts: Date.now(),
          },
        ];
    const node = await ChatDatabaseService.fetchCurrentNode(sessionId);
    const options = node
      ? await ChatDatabaseService.fetchOptions(node.node_id)
      : [];
    const quickReplies = options.map((o: any, i: number) => ({
      id: `qr-${i}`,
      label: o.label,
      value: o.label,
    }));
    return { driver, sessionId, messages: safeMessages, quickReplies } as const;
  }

  // Scripted path
  const flow = scriptedFlowRegistry?.[flowId];
  if (!flow) throw new Error(`Flow not found: ${flowId}`);
  const driver = new ScriptedFlowDriver(flow);
  const initial = await driver.initial(ctx || {});
  const messages = initial.map(m => ({
    id: crypto.randomUUID(),
    role: 'printy' as const,
    text: m.text,
    ts: Date.now(),
  }));
  const quickRepliesResult = await Promise.resolve(flow.quickReplies(ctx));
  const quickReplies = quickRepliesResult.map((l: string, i: number) => ({
    id: `qr-${i}`,
    label: l,
    value: l,
  }));
  return {
    driver,
    sessionId: null as string | null,
    messages,
    quickReplies,
  } as const;
}
