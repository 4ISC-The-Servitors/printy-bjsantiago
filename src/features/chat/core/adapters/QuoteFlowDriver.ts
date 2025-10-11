/**
 * QuoteFlowDriver
 * Implements FlowDriver for quote-specific conversations that bypass the ticketing system.
 * Always calls the chat-quote Edge Function on user input for LLM-powered quote drafting.
 */
import type { FlowDriver } from './FlowDriver';

interface QuoteContext {
  customerId?: string;
  inquiryId?: string;
  quoteId?: string;
  sessionId?: string;
  isFirstMessage?: boolean;
}

export class QuoteFlowDriver implements FlowDriver {
  id = 'ask-quote';
  private inquiryId: string | null = null;

  async initial(_ctx: QuoteContext): Promise<{ text: string }[]> {
    // Initial message to start the quote conversation
    return [
      {
        text: "Hello! I'm here to help you get a quote for your printing needs. Please tell me what you're looking for - what type of product, quantity, size, materials, or any other specifications you have in mind.",
      },
    ];
  }

  async respond(
    ctx: QuoteContext,
    input: string
  ): Promise<{ messages: { text: string }[]; quickReplies?: string[] }> {
    try {
      // Create inquiry record on first message if needed
      let inquiryId = this.inquiryId || ctx.inquiryId;
      if (!inquiryId && ctx.customerId) {
        inquiryId = await this.createInquiryRecord(ctx.customerId, input);
        this.inquiryId = inquiryId; // Store for subsequent messages
      }

      // Simple acknowledgment - NO LLM processing on customer side
      return {
        messages: [
          {
            text: "Thank you for your quote request! I've noted your requirements. Our team will review this and get back to you with a detailed quote soon. Is there anything else you'd like to specify?",
          },
        ],
        // No quick replies for quote flow - free text only
        quickReplies: [],
      };
    } catch (error) {
      console.error('QuoteFlowDriver error:', error);
      return {
        messages: [
          {
            text: "I've received your quote request. Our team will review this and get back to you soon.",
          },
        ],
        quickReplies: [],
      };
    }
  }

  private async createInquiryRecord(
    customerId: string,
    initialMessage: string
  ): Promise<string> {
    const { supabase } = await import('../../../../lib/supabase');

    const { data, error } = await supabase
      .from('inquiries_duplicate')
      .insert({
        customer_id: customerId,
        inquiry_type: 'quote_request',
        inquiry_status: 'new',
        subject: 'Quote Request',
        description: `Quote request initiated via chat: ${initialMessage.substring(0, 100)}${initialMessage.length > 100 ? '...' : ''}`,
        priority: 'medium',
        tags: ['quote', 'chat'],
        metadata: {
          source: 'ask_quote_flow',
          initial_message: initialMessage,
        },
      })
      .select('inquiry_id')
      .single();

    if (error) {
      console.error('Failed to create inquiry record:', error);
      throw new Error('Failed to create inquiry record');
    }

    return data.inquiry_id;
  }

  async end(_sessionId?: string): Promise<void> {
    // Quote flow doesn't require special cleanup
    // The chat-quote Edge Function handles quote persistence
  }
}
