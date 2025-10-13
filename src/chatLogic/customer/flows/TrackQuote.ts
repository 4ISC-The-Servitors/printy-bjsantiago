// TrackQuote.ts - Customer quote tracking and proposal review flow

import type { ChatFlow, FlowContext, FlowResponse, BotMessage } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';

export const trackQuoteFlow: ChatFlow = {
  id: 'track-quote',
  title: 'Track Quote',

  async initial(ctx: FlowContext): Promise<BotMessage[]> {
    const conversationId = ctx?.conversationId as string;

    if (!conversationId) {
      return [
        {
          role: 'printy',
          text: 'Quote conversation not found. Please try again.'
        }
      ];
    }

    // Start with greeting
    const messages: BotMessage[] = [
      {
        role: 'printy',
        text: 'Hi, I\'m Printy! Let me pull up your quote request details for you.'
      }
    ];

    // Fetch and display quote details immediately
    try {
      const detailsResponse = await displayQuoteDetails(conversationId);
      messages.push(...detailsResponse.messages);
    } catch (error) {
      console.error('Error fetching initial quote details:', error);
      messages.push({
        role: 'printy',
        text: 'Sorry, there was an error loading your quote details. Please try again.'
      });
    }

    return messages;
  },

  async quickReplies(ctx?: FlowContext): Promise<string[]> {
    const conversationId = ctx?.conversationId as string;
    
    if (!conversationId) {
      return ['End Chat'];
    }

    try {
      // Check if there are any proposals for this conversation
      const { data: proposals } = await supabase
        .from('quote_proposals')
        .select('proposal_id')
        .eq('conversation_id', conversationId)
        .limit(1);

      // Only show Accept/Reject buttons if there's a proposal
      if (proposals && proposals.length > 0) {
        return ['Accept Quote', 'Reject Quote', 'End Chat'];
      } else {
        return ['End Chat'];
      }
    } catch (error) {
      console.error('Error checking for proposals in quickReplies:', error);
      return ['End Chat'];
    }
  },

  async respond(ctx: FlowContext, input: string): Promise<FlowResponse> {
    const conversationId = ctx?.conversationId as string;
    
    if (!conversationId) {
      return {
        messages: [
          {
            role: 'printy',
            text: 'Quote conversation not found. Please try again.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    try {
      // Handle quick replies
      if (input === 'Accept Quote') {
        return await handleAcceptQuote(conversationId);
      }
      
      if (input === 'Reject Quote') {
        return await handleRejectQuote(conversationId);
      }
      
      if (input === 'End Chat') {
        return {
          messages: [],
          quickReplies: []
        };
      }

      // Initial load or any other input - show customer description and any proposals
      return await displayQuoteDetails(conversationId);

    } catch (error) {
      console.error('Error in track quote flow:', error);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Sorry, there was an error loading your quote details. Please try again.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }
  }
};

async function displayQuoteDetails(conversationId: string): Promise<FlowResponse> {
  try {
    const messages: BotMessage[] = [];

    // Add quote ID info
    const { data: conversation, error: convError } = await supabase
      .from('quote_conversations')
      .select(`
        quote_id,
        display_id,
        status,
        customer_id
      `)
      .eq('conversation_id', conversationId)
      .single();

    if (convError || !conversation) {
      throw new Error('Quote conversation not found');
    }

    messages.push({
      role: 'printy',
      text: `Quote ID: ${conversation.display_id || (conversation.quote_id ? conversation.quote_id.slice(0, 8) : conversationId.slice(0, 8))}`
    });
    messages.push({
      role: 'printy',
      text: `Status: ${conversation.status}`
    });

    // Load customer's original description
    const { data: customerMessages, error: msgError } = await supabase
      .from('quote_messages')
      .select('message_text, sent_at')
      .eq('conversation_id', conversationId)
      .eq('sender_role', 'customer')
      .order('sent_at', { ascending: true });

    if (msgError) {
      throw new Error('Failed to load customer messages');
    }

    if (customerMessages && customerMessages.length > 0) {
      messages.push({
        role: 'printy',
        text: 'Your Original Request:'
      });
      
      customerMessages.forEach(msg => {
        messages.push({
          role: 'printy',
          text: msg.message_text
        });
      });
    }

    // Check for proposals
    const { data: proposals } = await supabase
      .from('quote_proposals')
      .select(`
        proposal_id,
        spec_final,
        quoted_price,
        status,
        notes,
        created_at
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (proposals && proposals.length > 0) {
      const proposal = proposals[0];
      const specData = proposal.spec_final;

      messages.push({
        role: 'printy',
        text: '--- Admin Proposal ---'
      });

      messages.push({
        role: 'printy',
        text: `Product: ${specData.product_name || 'Not specified'}`
      });

      if (specData.category) {
        messages.push({
          role: 'printy',
          text: `Category: ${specData.category}`
        });
      }

      if (specData.description) {
        messages.push({
          role: 'printy',
          text: `Description: ${specData.description}`
        });
      }

      if (specData.size) {
        messages.push({
          role: 'printy',
          text: `Size: ${specData.size}`
        });
      }

      if (specData.materials && specData.materials.length > 0) {
        messages.push({
          role: 'printy',
          text: `Materials: ${specData.materials.join(', ')}`
        });
      }

      if (specData.color) {
        messages.push({
          role: 'printy',
          text: `Color: ${specData.color}`
        });
      }

      if (specData.finishing && specData.finishing.length > 0) {
        messages.push({
          role: 'printy',
          text: `Finishing: ${specData.finishing.join(', ')}`
        });
      }

      if (specData.quantity) {
        messages.push({
          role: 'printy',
          text: `Quantity: ${specData.quantity}`
        });
      }

      if (specData.deadline) {
        messages.push({
          role: 'printy',
          text: `Deadline: ${specData.deadline}`
        });
      }

      if (specData.notes) {
        messages.push({
          role: 'printy',
          text: `Notes: ${specData.notes}`
        });
      }

      messages.push({
        role: 'printy',
        text: `--- QUOTED PRICE: ₱${proposal.quoted_price} ---`
      });

      if (proposal.notes) {
        messages.push({
          role: 'printy',
          text: `Admin Notes: ${proposal.notes}`
        });
      }

      // Add warning message before accept/reject options
      messages.push({
        role: 'printy',
        text: 'IMPORTANT: Once you accept this quote, you CANNOT cancel your order. Payment is required upfront before we begin processing your order.'
      });

      return {
        messages,
        quickReplies: ['Accept Quote', 'Reject Quote', 'End Chat']
      };
    } else {
      // No proposals yet
      messages.push({
        role: 'printy',
        text: 'Your quote request is being reviewed by our admin team. We will send you a detailed proposal with pricing soon.'
      });

      return {
        messages,
        quickReplies: ['End Chat']
      };
    }

  } catch (error) {
    console.error('Error displaying quote details:', error);
    return {
      messages: [
        {
          role: 'printy',
          text: 'Error loading quote details. Please try again.'
        }
      ],
      quickReplies: ['End Chat']
    };
  }
}

async function handleAcceptQuote(conversationId: string): Promise<FlowResponse> {
  try {
    console.log('[TrackQuote] Accepting quote for conversation:', conversationId);

    // Get the latest proposal
    const { data: proposals, error: fetchError } = await supabase
      .from('quote_proposals')
      .select('proposal_id, status')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[TrackQuote] Error fetching proposal:', fetchError);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Could not find the quote proposal. Please try again or contact support.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    if (!proposals || proposals.length === 0) {
      console.error('[TrackQuote] No proposals found for conversation:', conversationId);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Could not find the quote proposal. Please try again or contact support.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    console.log('[TrackQuote] Found proposal:', proposals[0]);

    // Update the proposal status to accepted
    const { error: proposalError } = await supabase
      .from('quote_proposals')
      .update({ status: 'accepted' })
      .eq('proposal_id', proposals[0].proposal_id);

    if (proposalError) {
      console.error('[TrackQuote] Error updating proposal status:', proposalError);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Error accepting the quote. Please try again or contact support.'
          }
        ],
        quickReplies: ['Reject Quote', 'End Chat']
      };
    }

    console.log('[TrackQuote] Proposal status updated to accepted');

    // Update conversation status
    const { error: conversationError } = await supabase
      .from('quote_conversations')
      .update({ status: 'accepted' })
      .eq('conversation_id', conversationId);

    if (conversationError) {
      console.error('[TrackQuote] Error updating conversation status:', conversationError);
      // Still return success since the proposal was updated
    } else {
      console.log('[TrackQuote] Conversation status updated to accepted');
    }

    return {
      messages: [
        {
          role: 'printy',
          text: 'Great! You have accepted the quote proposal.'
        },
        {
          role: 'printy',
          text: 'Our admin will create your order and you will be instructed to pay for it before your order gets processed.'
        },
        {
          role: 'printy',
          text: 'Thank you for choosing Printy!'
        }
      ],
      quickReplies: ['End Chat']
    };
  } catch (error) {
    console.error('[TrackQuote] Unexpected error accepting quote:', error);
    return {
      messages: [
        {
          role: 'printy',
          text: 'Sorry, there was an error accepting the quote. Please try again or contact support.'
        }
      ],
      quickReplies: ['Accept Quote', 'Reject Quote', 'End Chat']
    };
  }
}

async function handleRejectQuote(conversationId: string): Promise<FlowResponse> {
  try {
    console.log('[TrackQuote] Rejecting quote for conversation:', conversationId);

    // Get the latest proposal
    const { data: proposals, error: fetchError } = await supabase
      .from('quote_proposals')
      .select('proposal_id, status')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (fetchError) {
      console.error('[TrackQuote] Error fetching proposal:', fetchError);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Could not find the quote proposal. Please try again or contact support.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    if (!proposals || proposals.length === 0) {
      console.error('[TrackQuote] No proposals found for conversation:', conversationId);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Could not find the quote proposal. Please try again or contact support.'
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    console.log('[TrackQuote] Found proposal:', proposals[0]);

    // Update the proposal status to rejected
    const { error: proposalError } = await supabase
      .from('quote_proposals')
      .update({ status: 'rejected' })
      .eq('proposal_id', proposals[0].proposal_id);

    if (proposalError) {
      console.error('[TrackQuote] Error updating proposal status:', proposalError);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Error rejecting the quote. Please try again or contact support.'
          }
        ],
        quickReplies: ['Accept Quote', 'End Chat']
      };
    }

    console.log('[TrackQuote] Proposal status updated to rejected');

    // Update conversation status
    const { error: conversationError } = await supabase
      .from('quote_conversations')
      .update({ status: 'rejected' })
      .eq('conversation_id', conversationId);

    if (conversationError) {
      console.error('[TrackQuote] Error updating conversation status:', conversationError);
      // Still return success since the proposal was updated
    } else {
      console.log('[TrackQuote] Conversation status updated to rejected');
    }

    return {
      messages: [
        {
          role: 'printy',
          text: 'You have rejected the quote proposal.'
        },
        {
          role: 'printy',
          text: 'If you would like to request a new quote or discuss modifications, please start a new quote request or contact our admin team.'
        },
        {
          role: 'printy',
          text: 'Thank you for considering Printy!'
        }
      ],
      quickReplies: ['End Chat']
    };
  } catch (error) {
    console.error('[TrackQuote] Unexpected error rejecting quote:', error);
    return {
      messages: [
        {
          role: 'printy',
          text: 'Sorry, there was an error rejecting the quote. Please try again or contact support.'
        }
      ],
      quickReplies: ['Accept Quote', 'Reject Quote', 'End Chat']
    };
  }
}
