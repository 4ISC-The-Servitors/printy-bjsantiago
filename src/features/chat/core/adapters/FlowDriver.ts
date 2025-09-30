/**
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


