// AskQuote.ts - Simple initial Printy messages for quote requests

import type { ChatFlow, FlowContext, FlowResponse, BotMessage } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';
import { getCurrentCustomerId } from '../../../lib/utils';

let hasCreatedQuote = false;

export const askQuoteFlow: ChatFlow = {
  id: 'ask-quote',
  title: 'Ask Quote',

  initial(ctx: FlowContext): BotMessage[] {
    hasCreatedQuote = false; // Reset state
    return [
      {
        role: 'printy',
        text: "Hi! I'm Printy. Let's start by understanding what you'd like to print!"
      },
      {
        role: 'printy', 
        text: "Please describe the product you want printed in detail. For example:\n\n• What type of item (business cards, flyers, banners, etc.)\n• Size and dimensions\n• Quantity needed\n• Any specific materials or finishing requirements\n• Your preferred deadline\n\nFeel free to share any other details that might be important!"
      }
    ];
  },

  quickReplies(): string[] {
    return [
      "End Chat"
    ];
  },

  async respond(ctx: FlowContext, input: string): Promise<FlowResponse> {
    // Handle End Chat quick reply
    if (input.trim() === "End Chat") {
      return {
        messages: [
          {
            role: 'printy',
            text: "Thank you for chatting with Printy! Have a great day."
          }
        ],
        quickReplies: []
      };
    }

    // Check if this is the first message (no quote conversation created yet)
    if (!hasCreatedQuote) {
      try {
        // Create quote conversation with quote_id
        const customerId = await getCurrentCustomerId();
        
        // Generate quote_id
        const quoteId = (crypto as any)?.randomUUID?.()
          ? (crypto as any).randomUUID()
          : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        
        // Create quote conversation
        const { data: conversationId, error: conversationError } = await supabase.rpc(
          'create_quote_conversation',
          { 
            p_customer_id: customerId,
            p_quote_id: quoteId
          }
        );

        if (conversationError) {
          console.error('Failed to create quote conversation:', conversationError);
          return {
            messages: [
              {
                role: 'printy',
                text: "Sorry, there was an error creating your quote request. Please try again."
              }
            ],
            quickReplies: ["End Chat"]
          };
        }

        // Add the first message to the quote conversation
        await supabase.rpc('add_quote_message', {
          p_conversation_id: conversationId,
          p_sender_id: customerId,
          p_sender_role: 'customer',
          p_message_text: input,
          p_message_type: 'chat'
        });

        hasCreatedQuote = true; // Mark as created

        return {
          messages: [
            {
              role: 'printy',
              text: `Thank you for providing those details! I've created your quote request.\n\n📋 **Quote Request ID:** ${quoteId}\n\nAdmin will review your request and get back to you with pricing and details.`
            }
          ],
          quickReplies: ["End Chat"]
        };
      } catch (error) {
        console.error('Error creating quote conversation:', error);
        return {
          messages: [
            {
              role: 'printy',
              text: "Sorry, there was an error processing your request. Please try again."
            }
          ],
          quickReplies: ["End Chat"]
        };
      }
    } else {
      // Subsequent messages - simple acknowledgment
      return {
        messages: [
          {
            role: 'printy',
            text: "Thank you for the additional details! Admin will review your updated request."
          }
        ],
        quickReplies: ["End Chat"]
      };
    }
  }
};
