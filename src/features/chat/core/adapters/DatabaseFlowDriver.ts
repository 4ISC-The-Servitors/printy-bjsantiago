/**
 * DatabaseFlowDriver
 * Implements FlowDriver using ChatDatabaseService (Supabase-backed flows).
 * Keeps logic UI-agnostic and focused on orchestrating DB operations.
 */
import { ChatDatabaseService } from '../services/ChatDatabaseService';
import type { FlowDriver } from './FlowDriver';

type Ctx = {
  flowId: string;
  sessionId?: string;
  nodeId?: string;
};

export class DatabaseFlowDriver implements FlowDriver {
  id: string;

  constructor(flowId: string) {
    this.id = flowId;
  }

  async initial(_ctx: unknown): Promise<{ text: string }[]> {
    // Database seeds the initial message via nodes; caller will actually
    // read messages from DB after attaching the session. Returning empty here
    // keeps the contract consistent without duplicating DB calls.
    return [];
  }

  async respond(_ctx: Ctx, _input: string): Promise<{ messages: { text: string }[]; quickReplies?: string[] }> {
    // Response is computed from DB nodes/transitions; caller should handle
    // inserting messages and reading them back. Driver returns empty and
    // relies on service-level reads to update UI state.
    return { messages: [] };
  }

  async end(sessionId?: string): Promise<void> {
    if (!sessionId) return;
    await ChatDatabaseService.endSession(sessionId);
  }
}


