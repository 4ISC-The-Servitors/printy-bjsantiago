/**
 * ScriptedFlowDriver
 * Implements FlowDriver by wrapping in-memory flows in src/chatLogic/*.
 * This allows us to keep using scripted flows during migration.
 */
import type { FlowDriver } from './FlowDriver';

type ScriptedFlow = {
  id: string;
  initial: (ctx: unknown) => { text: string }[] | Promise<{ text: string }[]>;
  respond: (
    ctx: unknown,
    input: string
  ) => Promise<{ messages: { text: string }[]; quickReplies?: string[] }>;
  quickReplies: () => string[];
};

export class ScriptedFlowDriver implements FlowDriver {
  id: string;
  private flow: ScriptedFlow;
  private context: unknown = {};

  constructor(flow: ScriptedFlow) {
    this.id = flow.id;
    this.flow = flow;
  }

  async initial(ctx: unknown): Promise<{ text: string }[]> {
    // Store the initial context so it can be used in respond()
    this.context = ctx;
    return await this.flow.initial(ctx);
  }

  async respond(ctx: unknown, input: string): Promise<{ messages: { text: string }[]; quickReplies?: string[] }> {
    // Merge any new context with the stored context, prioritizing new context
    const mergedCtx = { ...this.context, ...ctx };
    return this.flow.respond(mergedCtx, input);
  }
}


