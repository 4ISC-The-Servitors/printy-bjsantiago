// Admin Quotes Flow - Minimal quote management interface

import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';
import { buildConversationPrompt } from '../../../features/quote/quoteAssistantPrompt';
import { generateWithCohere } from '../../../features/api/llmClient';
import { openSpecEditor } from '../../../features/quote/specEditorEvents';

export const quotesFlow: ChatFlow = {
  id: 'admin-quotes',
  title: 'Quote Management',

  async initial(context: any): Promise<BotMessage[]> {
    const conversationId = context?.conversationId;

    if (conversationId) {
      // Re-fetch the conversation from the database to get the latest status
      const { data: conversation } = await supabase
        .from('quote_conversations')
        .select(`
          conversation_id,
          quote_id,
          display_id,
          status,
          customer_id
        `)
        .eq('conversation_id', conversationId)
        .single();

      if (conversation) {
        // Fetch customer details separately
        const { data: customer } = await supabase
          .from('customer')
          .select('first_name, last_name')
          .eq('customer_id', conversation.customer_id)
          .single();

        const messages: BotMessage[] = [
          {
            role: 'printy',
            text: `Quote ID: ${conversation.display_id || (conversation.quote_id ? conversation.quote_id.slice(0, 8) : conversation.conversation_id.slice(0, 8))}`
          },
          {
            role: 'printy',
            text: `Customer: ${customer?.first_name ? `${customer.first_name} ${customer.last_name}` : 'Unknown Customer'}`
          },
          {
            role: 'printy',
            text: `Status: ${conversation.status}`
          }
        ];

        // Check if quote was accepted/rejected by looking at proposal status
        const { data: proposals } = await supabase
          .from('quote_proposals')
          .select('status, quoted_price')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (proposals && proposals.length > 0) {
          const latestProposal = proposals[0];
          if (latestProposal.status === 'accepted') {
            messages.push({
              role: 'printy',
              text: `Customer has accepted the quote proposal (₱${latestProposal.quoted_price}). Ready to proceed with order creation.`
            });
          } else if (latestProposal.status === 'rejected') {
            messages.push({
              role: 'printy',
              text: 'Customer has rejected the quote proposal.'
            });
          } else if (latestProposal.status === 'sent') {
            messages.push({
              role: 'printy',
              text: `Quote proposal sent to customer (₱${latestProposal.quoted_price}). Waiting for customer response.`
            });
          }
        }

        return messages;
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

  async quickReplies(context: any): Promise<string[]> {
    const conversationId = context?.conversationId;
    if (!conversationId) {
      return ['End Chat'];
    }

    // Check if quote is accepted
    const { data: proposals } = await supabase
      .from('quote_proposals')
      .select('status')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false})
      .limit(1);

    if (proposals && proposals.length > 0 && proposals[0].status === 'accepted') {
      // Check if order already exists
      const { data: existingOrder } = await supabase
        .from('quote_orders')
        .select('order_id')
        .eq('conversation_id', conversationId)
        .limit(1);

      if (existingOrder && existingOrder.length > 0) {
        return ['View Order Details', 'End Chat'];
      }

      return ['Create Order', 'End Chat'];
    }

    // Check if proposal was sent
    if (proposals && proposals.length > 0 && proposals[0].status === 'sent') {
      return ['View Sent Proposal', 'End Chat'];
    }

    // Check if there are existing specs for this quote
    const { data: specs } = await supabase
      .from('quote_specs')
      .select('spec_id')
      .eq('conversation_id', conversationId)
      .limit(1);

    if (specs && specs.length > 0) {
      return ['Summarize Order Specs', 'Send Specs to Customer', 'End Chat'];
    }

    return ['Summarize Order Specs', 'End Chat'];
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

    // If this is the initial state (empty input), determine what to show based on status
    if (!input || input.trim() === '') {
      // Re-fetch conversation to get latest status
      const { data: conversation } = await supabase
        .from('quote_conversations')
        .select('status')
        .eq('conversation_id', conversationId)
        .single();

      // Check for accepted proposals
      const { data: proposals } = await supabase
        .from('quote_proposals')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      const latestProposal = proposals && proposals.length > 0 ? proposals[0] : null;
      const isAccepted = latestProposal?.status === 'accepted' || conversation?.status === 'accepted';

      // If accepted, show the agreed proposal details
      if (isAccepted && latestProposal) {
        return await displayAcceptedProposal(conversationId, latestProposal);
      }

      // Otherwise, load and display customer description (for new or in-progress quotes)
      const customerMessages = await loadCustomerMessages(conversationId);

      if (customerMessages && customerMessages.length > 0) {
        return {
          messages: [
            ...customerMessages.filter(msg => msg.sender_role === 'customer').map(msg => ({
              role: 'printy' as const,
              text: msg.message_text
            })),
            {
              role: 'printy',
              text: 'What would you like to do with this quote request?'
            }
                ],
                quickReplies: await getQuickRepliesForQuote(quote)
        };
      } else {
        return {
          messages: [
            {
              role: 'printy',
              text: '\nNo customer description found.'
            }
                ],
                quickReplies: await getQuickRepliesForQuote(quote)
        };
      }
    }

            // const inputLower = input.toLowerCase(); // Unused
            
            if (input === 'Summarize Order Specs') {
              return handleSummarizeSpecs(quote);
            }
            
            if (input === 'Manual Order Specs') {
              return handleManualSpecs(quote);
            }
            
            if (input === 'Send Specs to Customer') {
              return handleSendSpecs(quote);
            }
            
    if (input === 'Create Order') {
      // Get the latest proposal details
      const { data: proposals } = await supabase
        .from('quote_proposals')
        .select('proposal_id, quoted_price, spec_final')
        .eq('conversation_id', quote.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!proposals || proposals.length === 0) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Could not find the accepted proposal. Please try again.'
            }
          ],
          quickReplies: ['End Chat']
        };
      }

      const proposal = proposals[0];

      try {
        // Create order in orders_duplicate table
        const { data: orderData, error: orderError } = await supabase
          .from('orders_duplicate')
          .insert({
            customer_id: quote.customer_id,
            total_amount: proposal.quoted_price,
            status: 'awaiting_payment',
            order_specs: proposal.spec_final,
            currency: 'PHP'
          })
          .select('order_id, display_id')
          .single();

        if (orderError) throw orderError;

        // Link order to quote in quote_orders table
        const { error: linkError } = await supabase
          .from('quote_orders')
          .insert({
            conversation_id: quote.conversation_id,
            proposal_id: proposal.proposal_id,
            order_id: orderData.order_id
          });

        if (linkError) throw linkError;

        return {
          messages: [
            {
              role: 'printy',
              text: `Order created successfully!\n\nOrder ID: ${orderData.display_id || orderData.order_id}\nStatus: Pending Payment\nTotal: ₱${proposal.quoted_price}`
            }
          ],
          quickReplies: ['End Chat']
        };
      } catch (error) {
        console.error('Error creating order:', error);
        return {
          messages: [
            {
              role: 'printy',
              text: 'Failed to create the order. Please try again or create the order manually.'
            }
          ],
          quickReplies: ['Create Order', 'End Chat']
        };
      }
    }

    if (input === 'View Order Details') {
      // Get the order details
      const { data: quoteOrder } = await supabase
        .from('quote_orders')
        .select('order_id')
        .eq('conversation_id', quote.conversation_id)
        .single();

      if (!quoteOrder) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Could not find the order. Please try again.'
            }
          ],
          quickReplies: ['End Chat']
        };
      }

      const { data: orderDetails } = await supabase
        .from('orders_duplicate')
        .select('*')
        .eq('order_id', quoteOrder.order_id)
        .single();

      if (!orderDetails) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Could not find the order details. Please try again.'
            }
          ],
          quickReplies: ['End Chat']
        };
      }

      return {
        messages: [
          {
            role: 'printy',
            text: `Order ID: ${orderDetails.display_id || orderDetails.order_id}`
          },
          {
            role: 'printy',
            text: `Status: ${orderDetails.status}`
          },
          {
            role: 'printy',
            text: `Total Amount: ₱${orderDetails.total_amount}`
          },
          {
            role: 'printy',
            text: `Created: ${new Date(orderDetails.created_at).toLocaleString()}`
          }
        ],
        quickReplies: ['End Chat']
      };
    }

    if (input === 'End Chat') {
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
              quickReplies: await getQuickRepliesForQuote(quote)
            };
  }
};

// Helper functions

async function displayAcceptedProposal(conversationId: string, proposal: any): Promise<{ messages: BotMessage[]; quickReplies?: string[] }> {
  const messages: BotMessage[] = [];
  const specData = proposal.spec_final;

  messages.push({
    role: 'printy',
    text: 'Accepted Quote Details:'
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
    text: `Agreed Price: ₱${proposal.quoted_price}`
  });

  if (proposal.notes) {
    messages.push({
      role: 'printy',
      text: `Admin Notes: ${proposal.notes}`
    });
  }

  messages.push({
    role: 'printy',
    text: 'Customer has accepted this proposal. Ready to create an order.'
  });

  // Check if order already exists
  const { data: existingOrder } = await supabase
    .from('quote_orders')
    .select('order_id')
    .eq('conversation_id', conversationId)
    .limit(1);

  return {
    messages,
    quickReplies: existingOrder && existingOrder.length > 0
      ? ['View Order Details', 'End Chat']
      : ['Create Order', 'End Chat']
  };
}

async function displayQuoteWithCustomerDescription(quote: any): Promise<BotMessage[]> {
  const messages: BotMessage[] = [];
  
  // Quote ID
  messages.push({
    role: 'printy',
    text: `Quote ID: ${quote.display_id || (quote.quote_id ? quote.quote_id.slice(0, 8) : quote.conversation_id.slice(0, 8))}`
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
    customerMessages.forEach((msg: any) => {
      if (msg.sender_role === 'customer') {
        messages.push({
          role: 'printy' as const,
          text: msg.message_text
        });
      }
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

function _displayQuoteOverview(quote: any): BotMessage[] {
    const messages: BotMessage[] = [];
    
    // Quote ID
    messages.push({
      role: 'printy',
      text: `Quote ID: ${quote.display_id || (quote.quote_id ? quote.quote_id.slice(0, 8) : quote.conversation_id.slice(0, 8))}`
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

async function getQuickRepliesForQuote(quote: any): Promise<string[]> {
    try {
      // Check if there are existing specs for this quote
      const { data: existingSpecs } = await supabase
        .from('quote_specs')
        .select('spec_id')
        .eq('conversation_id', quote.conversation_id)
        .limit(1);

      const hasSavedSpecs = existingSpecs && existingSpecs.length > 0;
      
      if (hasSavedSpecs) {
        return ['Summarize Order Specs', 'Manual Order Specs', 'Send Specs to Customer', 'End Chat'];
      } else {
        return ['Summarize Order Specs', 'Manual Order Specs', 'End Chat'];
      }
    } catch (error) {
      console.error('Error checking for existing specs:', error);
      return ['Summarize Order Specs', 'Manual Order Specs', 'End Chat'];
    }
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
    try {
      // Load all messages for this quote
      const customerMessages = await loadCustomerMessages(quote.conversation_id);
      
      // Build conversation history for AI
      const history = customerMessages.map(msg => ({
        role: msg.sender_role,
        text: msg.message_text
      }));

      // Generate AI analysis
      const prompt = buildConversationPrompt(history);
      const analysis = await generateWithCohere(
        [{ role: 'user', content: prompt }], 
        true,
        'command-nightly' // Using the nightly model which has better multilingual support
      );

      // Trigger spec editor modal via event
      openSpecEditor({
        conversationId: quote.conversation_id,
        specData: {
          ...analysis.spec,
          quoted_price: undefined // Ensure admin must enter price
        },
        language: analysis.language
      });

      return {
        messages: [
          {
            role: 'printy',
            text: 'Analyzing conversation and preparing order specifications...'
          }
        ],
        quickReplies: ['Send Specs to Customer', 'End Chat']
      };
    } catch (error) {
      console.error('Error summarizing specs:', error);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Sorry, there was an error analyzing the conversation. Please try again or review the customer description manually.'
          }
        ],
        quickReplies: ['Send Specs to Customer', 'End Chat']
      };
    }
}

async function handleManualSpecs(quote: any): Promise<{ messages: BotMessage[]; quickReplies?: string[] }> {
    try {
      // Trigger spec editor modal with empty/default data for manual input
      openSpecEditor({
        conversationId: quote.conversation_id,
        specData: {
          product_name: '',
          category: '',
          description: '',
          size: '',
          materials: [],
          color: '',
          finishing: [],
          others: [],
          quantity: 1,
          artwork: '',
          deadline: '',
          notes: '',
          quoted_price: undefined // Admin must enter price
        },
        language: 'en' // Default language for manual input
      });

      return {
        messages: [
          {
            role: 'printy',
            text: 'Opening manual specification form... Please fill out the order details and save the draft.'
          }
        ],
        quickReplies: ['Send Specs to Customer', 'End Chat']
      };
    } catch (error) {
      console.error('Error opening manual specs form:', error);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Sorry, there was an error opening the manual specification form. Please try again.'
          }
        ],
        quickReplies: ['Summarize Order Specs', 'Manual Order Specs', 'End Chat']
      };
    }
}

async function handleSendSpecs(quote: any): Promise<{ messages: BotMessage[]; quickReplies?: string[] }> {
    try {
      // First, check if there's a saved draft in quote_specs
      const { data: existingSpecs, error: specError } = await supabase
        .from('quote_specs')
        .select('*')
        .eq('conversation_id', quote.conversation_id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (specError) {
        console.error('Error fetching existing specs:', specError);
        return {
          messages: [
            {
              role: 'printy',
              text: 'Error fetching saved specifications. Please try summarizing the specs first.'
            }
          ],
          quickReplies: ['Summarize Order Specs', 'End Chat']
        };
      }

      if (!existingSpecs || existingSpecs.length === 0) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'No saved specifications found. Please summarize the order specs first before sending to customer.'
            }
          ],
          quickReplies: ['Summarize Order Specs', 'End Chat']
        };
      }

      const latestSpec = existingSpecs[0];
      const specData = latestSpec.spec_data;

      // Validate that quoted_price exists
      if (!specData.quoted_price) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Quoted price is missing from the specifications. Please edit the draft and add a price before sending to customer.'
            }
          ],
          quickReplies: ['Summarize Order Specs', 'End Chat']
        };
      }

      // Create quote proposal
      const { data: proposalData, error: proposalError } = await supabase
        .from('quote_proposals')
        .insert({
          conversation_id: quote.conversation_id,
          spec_id: latestSpec.spec_id,
          spec_final: specData,
          quoted_price: specData.quoted_price,
          currency: 'PHP',
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .select('proposal_id')
        .single();

      if (proposalError) {
        console.error('Error creating proposal:', proposalError);
        return {
          messages: [
            {
              role: 'printy',
              text: 'Error creating proposal. Please try again.'
            }
          ],
          quickReplies: ['Summarize Order Specs', 'End Chat']
        };
      }

      // Update conversation status
      await supabase
        .from('quote_conversations')
        .update({ status: 'spec_proposed' })
        .eq('conversation_id', quote.conversation_id);

      return {
        messages: [
          {
            role: 'printy',
            text: `Specifications sent to customer successfully!\n\nProposal ID: ${proposalData.proposal_id.slice(0, 8)}...\nQuoted Price: ₱${specData.quoted_price}\n\nCustomer can now view and respond to this proposal.`
          }
        ],
        quickReplies: ['End Chat']
      };
    } catch (error) {
      console.error('Error sending specs to customer:', error);
      return {
        messages: [
          {
            role: 'printy',
            text: 'Sorry, there was an error sending the specifications to the customer. Please try again.'
          }
        ],
        quickReplies: ['Summarize Order Specs', 'End Chat']
      };
    }
}