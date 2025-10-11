/**
 * askQuote Flow
 * Simple flow configuration for the ask-quote conversation.
 * Uses QuoteFlowDriver for LLM-powered quote drafting.
 */
import type {
  ChatFlow,
  FlowContext,
  BotMessage,
  FlowResponse,
} from '../../../../types/chatFlow';
import { QuoteFlowDriver } from '../../core/adapters/QuoteFlowDriver';

const driver = new QuoteFlowDriver();

const askQuoteFlow: ChatFlow = {
  id: 'ask-quote',
  title: 'Ask Quote',
  initial: (_ctx: FlowContext): BotMessage[] => {
    // Return initial message synchronously
    return [
      {
        role: 'printy',
        text: "Hello! I'm here to help you get a quote for your printing needs. Please tell me what you're looking for - what type of product, quantity, size, materials, or any other specifications you have in mind.",
      },
    ];
  },
  quickReplies: (): string[] => {
    // No quick replies for quote flow - free text only
    return [];
  },
  respond: async (ctx: FlowContext, input: string): Promise<FlowResponse> => {
    const result = await driver.respond(ctx, input);
    // Convert messages to BotMessage format
    const messages: BotMessage[] = result.messages.map(msg => ({
      role: 'printy' as const,
      text: msg.text,
    }));
    return {
      messages,
      quickReplies: result.quickReplies,
    };
  },
};

export { askQuoteFlow };
