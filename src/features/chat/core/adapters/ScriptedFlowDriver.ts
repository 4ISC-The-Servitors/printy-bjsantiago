/**
 * ScriptedFlowDriver
 * Implements FlowDriver by wrapping in-memory flows in src/chatLogic/*.
 * This allows us to keep using scripted flows during migration.
 */
import type { FlowDriver } from './FlowDriver';

type ScriptedFlow = {
  id: string;
  initial: (ctx: unknown) => { text: string }[];
  respond: (
    ctx: unknown,
    input: string
  ) => Promise<{ messages: { text: string }[]; quickReplies?: string[] }>;
  quickReplies: () => string[];
};

export class ScriptedFlowDriver implements FlowDriver {
  id: string;
  private flow: ScriptedFlow;

  constructor(flow: ScriptedFlow) {
    this.id = flow.id;
    this.flow = flow;
  }

  async initial(ctx: unknown): Promise<{ text: string }[]> {
    return this.flow.initial(ctx);
  }

  async respond(ctx: unknown, input: string): Promise<{ messages: { text: string }[]; quickReplies?: string[] }> {
    return this.flow.respond(ctx, input);
  }
}


