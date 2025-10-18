/**
 * SessionStateManager
 *
 * Manages session state with optimized batching to reduce database roundtrips.
 * This class implements a write-behind cache pattern where metadata updates are
 * batched in memory and written to the database only when necessary.
 *
 * Performance Improvement: Reduces 3-5 sequential metadata updates to 1 batched update
 * Expected savings: 100-200ms per flow execution
 *
 * @example
 * ```typescript
 * const stateManager = new SessionStateManager(sessionId, initialMetadata);
 *
 * // Update context multiple times (held in memory)
 * stateManager.updateContext({ key1: 'value1' });
 * stateManager.updateContext({ key2: 'value2' });
 * stateManager.setCurrentNode('next_node');
 *
 * // Flush to database once at the end
 * await stateManager.flush();
 * ```
 */

import type { SessionMetadata, SessionContext } from '@features/chat/types';
import { supabase } from '@lib/supabase';

export class SessionStateManager {
  private sessionId: string;
  private metadata: SessionMetadata;
  private isDirty: boolean = false;

  constructor(sessionId: string, initialMetadata: SessionMetadata) {
    this.sessionId = sessionId;
    this.metadata = { ...initialMetadata };
  }

  /**
   * Get current metadata (from in-memory cache)
   */
  getMetadata(): SessionMetadata {
    return { ...this.metadata };
  }

  /**
   * Get current context (from in-memory cache)
   */
  getContext(): SessionContext {
    return { ...this.metadata.context };
  }

  /**
   * Get current node ID (from in-memory cache)
   */
  getCurrentNodeId(): string {
    return this.metadata.current_node_id;
  }

  /**
   * Update context (batched in memory)
   */
  updateContext(updates: Partial<SessionContext>): void {
    this.metadata.context = {
      ...this.metadata.context,
      ...updates,
    };
    this.isDirty = true;
  }

  /**
   * Set current node ID (batched in memory)
   */
  setCurrentNode(nodeId: string): void {
    this.metadata.current_node_id = nodeId;
    this.isDirty = true;
  }

  /**
   * Update multiple metadata fields at once (batched in memory)
   */
  updateMetadata(updates: Partial<SessionMetadata>): void {
    this.metadata = {
      ...this.metadata,
      ...updates,
    };
    this.isDirty = true;
  }

  /**
   * Check if there are pending updates
   */
  hasPendingUpdates(): boolean {
    return this.isDirty;
  }

  /**
   * Flush pending updates to database
   * This is the only method that makes a database call
   */
  async flush(): Promise<boolean> {
    if (!this.isDirty) {
      return true; // No updates to write
    }

    try {
      const { error } = await supabase
        .from('chat_sessions_v2')
        .update({ metadata: this.metadata })
        .eq('session_id', this.sessionId);

      if (error) {
        console.error('[SessionStateManager] Error flushing metadata:', error);
        return false;
      }

      this.isDirty = false;
      return true;
    } catch (error) {
      console.error(
        '[SessionStateManager] Unexpected error during flush:',
        error
      );
      return false;
    }
  }

  /**
   * Reload metadata from database (discards pending changes)
   */
  async reload(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions_v2')
        .select('metadata')
        .eq('session_id', this.sessionId)
        .single();

      if (error || !data) {
        console.error('[SessionStateManager] Error reloading metadata:', error);
        return false;
      }

      this.metadata = data.metadata as SessionMetadata;
      this.isDirty = false;
      return true;
    } catch (error) {
      console.error(
        '[SessionStateManager] Unexpected error during reload:',
        error
      );
      return false;
    }
  }

  /**
   * Factory method: Create SessionStateManager from database
   */
  static async load(sessionId: string): Promise<SessionStateManager | null> {
    try {
      const { data, error } = await supabase
        .from('chat_sessions_v2')
        .select('metadata')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) {
        console.error('[SessionStateManager] Error loading session:', error);
        return null;
      }

      return new SessionStateManager(
        sessionId,
        data.metadata as SessionMetadata
      );
    } catch (error) {
      console.error(
        '[SessionStateManager] Unexpected error loading session:',
        error
      );
      return null;
    }
  }
}
