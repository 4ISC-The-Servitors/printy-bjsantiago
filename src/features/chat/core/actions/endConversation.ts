/**
 * endConversation
 * Ends the current conversation. For DB-backed sessions, inserts end text (if any)
 * and calls endSession. Scripted flows are no-ops.
 */
import { ChatDatabaseService } from '../services/ChatDatabaseService';

export async function endConversation(sessionId: string | null, flowId?: string) {
  if (!sessionId) return;
  // Attempt to fetch end text for DB-backed flows
  try {
    const endNode = await ChatDatabaseService.fetchEndNodeText(flowId || 'about');
    if (endNode) {
      await ChatDatabaseService.insertMessage({ sessionId, text: endNode.text, role: 'printy', nodeId: endNode.nodeId });
    }
  } catch {}
  await ChatDatabaseService.endSession(sessionId);
}


