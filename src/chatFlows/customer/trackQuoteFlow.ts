import type { FlowDefinition } from '../types';

/**
 * Track Quote Flow - Customer tracks an existing printing quote
 * 
 * Flow Steps:
 * 1. intro - Greeting and load quote details
 * 2. show_quote_details - Display quote information and any proposals
 * 3. accept_quote - Handle quote acceptance
 * 4. reject_quote - Handle quote rejection
 * 5. end - End conversation
 */
export const trackQuoteFlow: FlowDefinition = {
  flow_id: 'track-quote',
  title: 'Track Quote',
  description: 'Customer tracks an existing printing quote and reviews proposals',
  initial_node: 'intro',
  
  nodes: {
    intro: {
      type: 'action',
      message: 'Hi, I\'m Printy, B.J. Santiago\'s bot assistant. Let me pull up your quote request details for you.',
      action: 'display_quote_details',
      action_config: {
        conversation_id_key: 'conversation_id',
      },
      next: 'await_response',
    },
    
    await_response: {
      type: 'message',
      message: 'IMPORTANT: Once you accept this quote, you CANNOT cancel your order. Payment is required upfront before we begin processing your order.',
      options: [
        { label: 'Accept Quote', next: 'accept_quote' },
        { label: 'Reject Quote', next: 'reject_quote' },
        { label: 'End Chat', next: 'end' },
      ],
    },
    
    accept_quote: {
      type: 'action',
      message: '',
      action: 'accept_quote_proposal',
      action_config: {
        conversation_id_key: 'conversation_id',
      },
      next: 'quote_accepted',
    },
    
    quote_accepted: {
      type: 'message',
      message: 'Great! You have accepted the quote proposal.\n\nOur admin will create your order and you will be instructed to pay for it before your order gets processed.\n\nThank you for choosing B.J. Santiago!',
      options: [
        { label: 'End Chat', next: 'end' },
      ],
    },
    
    reject_quote: {
      type: 'action',
      message: '',
      action: 'reject_quote_proposal',
      action_config: {
        conversation_id_key: 'conversation_id',
      },
      next: 'quote_rejected',
    },
    
    quote_rejected: {
      type: 'message',
      message: 'You have rejected the quote proposal.\n\nIf you would like to request a new quote or discuss modifications, please start a new quote request or contact our admin team.\n\nThank you for considering B.J. Santiago!',
      options: [
        { label: 'End Chat', next: 'end' },
      ],
    },
    
    end: {
      type: 'end',
      message: 'Thanks for choosing B.J. Santiago! Have a great day!',
    },
  },
};

