// Admin Quotes Flow - Minimal quote management interface

import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';

export const quotesFlow: ChatFlow = {
  id: 'admin-quotes',
  title: 'Quote Management',

  initial(context: any): BotMessage[] {
    const conversationId = context?.conversationId;
    const quotes = context?.quotes || [];
    
    if (conversationId && quotes.length > 0) {
      // Find the specific quote conversation
      const quote = quotes.find((q: any) => q.conversation_id === conversationId);
      if (quote) {
        // Return empty array to trigger respond method immediately
        return [];
      }
    }
    
    // Default intro
    return [
      {
        role: 'printy',
        text: 'Quote Management - Select a quote conversation to view and respond to customer requests.'
      }
    ];
  },

  quickReplies(): string[] {
    return ['Summarize Order Specs', 'Send Specs to Customer', 'End Chat'];
  },

  async respond(context: any, input: string): Promise<{ messages: BotMessage[]; quickReplies?: string[] }> {
    const conversationId = context?.conversationId;
    const quotes = context?.quotes || [];
    const quote = quotes.find((q: any) => q.conversation_id === conversationId);
    
    if (!quote) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Quote conversation not found. Please select a valid quote from the quotes list.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    // If this is the initial state (empty input) or any other state, show the full quote info
    if (!input || input.trim() === '') {
      return {
        messages: await displayQuoteWithCustomerDescription(quote),
        quickReplies: getQuickRepliesForQuote(quote)
      };
    }

    const inputLower = input.toLowerCase();
    
    if (inputLower.includes('summarize') || inputLower.includes('specs')) {
      return handleSummarizeSpecs(quote);
    }
    
    if (inputLower.includes('send') || inputLower.includes('customer')) {
      return handleSendSpecs(quote);
    }
    
    if (inputLower.includes('end') || inputLower.includes('close')) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Quote conversation ended. You can continue managing other quotes.'
          }
        ],
        quickReplies: []
      };
    }
    
    // For any other input, show the full quote info again
    return {
      messages: await displayQuoteWithCustomerDescription(quote),
      quickReplies: getQuickRepliesForQuote(quote)
    };
  }
};

// Helper functions

async function displayQuoteWithCustomerDescription(quote: any): Promise<BotMessage[]> {
  const messages: BotMessage[] = [];
  
  // Quote ID
  messages.push({
    role: 'printy',
    text: `Quote ID: ${quote.quote_id ? quote.quote_id.slice(0, 8) : quote.conversation_id.slice(0, 8)}...`
  });

  // Customer info
  const customerName = quote.customer?.first_name 
    ? `${quote.customer.first_name} ${quote.customer.last_name}`
    : 'Unknown Customer';
  
  messages.push({
    role: 'printy',
    text: `Customer: ${customerName}`
  });

  // Status
  messages.push({
    role: 'printy',
    text: `Status: ${quote.status}`
  });

  // Load and display customer description
  const customerMessages = await loadCustomerMessages(quote.conversation_id);
  
  if (customerMessages && customerMessages.length > 0) {
    messages.push({
      role: 'printy',
      text: '\n--- Customer Description ---'
    });
    
    customerMessages.forEach((msg: any) => {
      if (msg.sender_role === 'customer') {
        messages.push({
          role: 'printy',
          text: msg.message_text
        });
      }
    });
    
    messages.push({
      role: 'printy',
      text: '--- End of Description ---\n'
    });

    messages.push({
      role: 'printy',
      text: 'What would you like to do with this quote request?'
    });
  } else {
    messages.push({
      role: 'printy',
      text: '\nNo customer description found.'
    });
  }

  return messages;
}

function displayQuoteOverview(quote: any): BotMessage[] {
    const messages: BotMessage[] = [];
    
    // Quote ID
    messages.push({
      role: 'printy',
      text: `Quote ID: ${quote.quote_id ? quote.quote_id.slice(0, 8) : quote.conversation_id.slice(0, 8)}...`
    });

    // Customer info
    const customerName = quote.customer?.first_name 
      ? `${quote.customer.first_name} ${quote.customer.last_name}`
      : 'Unknown Customer';
    
    messages.push({
      role: 'printy',
      text: `Customer: ${customerName}`
    });

    // Status
    messages.push({
      role: 'printy',
      text: `Status: ${quote.status}`
    });

    return messages;
}

function getQuickRepliesForQuote(quote: any): string[] {
    // Check if there are existing specs for this quote
    return ['Summarize Order Specs', 'Send Specs to Customer', 'End Chat'];
}

async function loadCustomerMessages(conversationId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('quote_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('sender_role', 'customer')
        .order('sent_at', { ascending: true });
      
      if (error) {
        console.error('Error loading customer messages:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error loading customer messages:', error);
      return [];
    }
}

async function handleSummarizeSpecs(quote: any): Promise<{ messages: BotMessage[]; quickReplies?: string[] }> {
    // TODO: Implement AI summarization
    return {
      messages: [
        {
          role: 'printy',
          text: 'AI Spec Summarization\n\nAnalyzing customer requirements and generating structured specifications...\n\nAI summarization feature is being implemented. For now, please manually review the customer description above.'
        }
      ],
      quickReplies: ['Send Specs to Customer', 'End Chat']
    };
}

async function handleSendSpecs(quote: any): Promise<{ messages: BotMessage[]; quickReplies?: string[] }> {
    // TODO: Implement spec sending functionality
    return {
      messages: [
        {
          role: 'printy',
          text: 'Sending Specs to Customer\n\nPreparing to send structured specifications to the customer...\n\nSpec sending feature is being implemented. You can manually contact the customer for now.'
        }
      ],
      quickReplies: ['Summarize Order Specs', 'End Chat']
    };
}