/**
 * useConversationController
 * Composes start/send/end actions and exposes a simple API for pages.
 * Driver selection is handled inside actions (DB for 'about', scripted otherwise).
 */
import { useState } from 'react';
import { startConversation } from '../actions/startConversation';
import { sendConversationMessage } from '../actions/sendConversationMessage';
import { endConversation as endConv } from '../actions/endConversation';

export function useConversationController() {
  const [driver, setDriver] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  const start = async (flowId: string, registry?: Record<string, any>, ctx?: unknown) => {
    const result = await startConversation({ flowId, scriptedFlowRegistry: registry, ctx });
    setDriver(result.driver);
    setSessionId(result.sessionId);
    return result;
  };

  const send = async (input: string) => {
    if (!driver) throw new Error('No driver configured');
    const res = await sendConversationMessage({ driver, sessionId, activeNodeId, input });
    setActiveNodeId(res.activeNodeId || null);
    return res;
  };

  const end = async (flowId?: string) => {
    await endConv(sessionId, flowId);
    setDriver(null);
    setSessionId(null);
    setActiveNodeId(null);
  };

  // Allow existing sessions (selected from history) to set controller session id
  const setControllerSession = (id: string | null) => setSessionId(id);

  return { start, send, end, sessionId, setControllerSession } as const;
}

export default useConversationController;


