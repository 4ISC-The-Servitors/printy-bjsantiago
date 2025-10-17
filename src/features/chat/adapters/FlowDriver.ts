/**
 * @deprecated LEGACY SYSTEM - DO NOT USE
 *
 * This interface is part of the old flow driver system and is being phased out.
 * Use JsonbFlowProcessor from @features/chat/services/JsonbFlowProcessor instead.
 *
 * This file will be removed in Phase 5 of the chat system migration.
 * See: docs_guide/CHAT_SYSTEM_MIGRATION_PLAN.md
 *
 * FlowDriver defines the minimal interface for any chat flow backend.
 * Implementations:
 * - DatabaseFlowDriver: uses Supabase-backed chat flow (sessions, nodes, messages)
 * - ScriptedFlowDriver: wraps in-memory flows under src/chatLogic/*
 *
 * Purpose: decouple UI/hooks from how flows are powered so we can migrate
 * flows one-by-one without touching pages/components.
 */
export interface FlowDriver {
  /** Flow identifier, e.g., 'about', 'payment' */
  id: string;

  /**
   * Produce initial bot messages given an optional context.
   */
  initial(ctx: unknown): Promise<{ text: string }[]>;

  /**
   * Respond to user input and return bot messages and optional quick replies.
   */
  respond(
    ctx: unknown,
    input: string
  ): Promise<{ messages: { text: string }[]; quickReplies?: string[] }>;

  /**
   * Optional: end the flow (e.g., close DB session). No-op for scripted flows.
   */
  end?(sessionId?: string): Promise<void>;
}


