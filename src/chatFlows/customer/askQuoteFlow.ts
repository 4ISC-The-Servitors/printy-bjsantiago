import type { FlowDefinition } from '../types';

/**
 * Ask Quote Flow - Customer requests a printing quote
 * 
 * Flow Steps:
 * 1. intro - Collect quote details from customer
 * 2. create_quote - Create quote conversation in database
 * 3. quote_created - Confirmation message
 * 4. end - End conversation
 */
export const askQuoteFlow: FlowDefinition = {
  flow_id: 'ask-quote',
  title: 'Request a Quote',
  description: 'Customer describes what they want printed and submits a quote request',
  initial_node: 'intro',
  
  nodes: {
    intro: {
      type: 'message',
      message: `Hi! I'm Printy, B.J. Santiago's bot assistant. Let's get you a quote for the product you want printed!

                Please describe what you'd like printed. Include as many details as possible:

                • Item type (business cards, flyers, banners, etc.)
                • Size and dimensions (e.g., 3.5" x 2", A4, custom)
                • Quantity (how many do you need?)
                • Materials or finishing (glossy, matte, cardstock, etc.)
                • Your deadline (when do you need it by?)`,
      expects_input: true,
      input_config: {
        store_as: 'quote_details',
        required: true,
      },
      next: 'create_quote',
    },
    
    create_quote: {
      type: 'action',
      message: 'Let me process your quote request. Hang on for a minute.',
      action: 'create_quote_conversation',
      action_config: {
        details_key: 'quote_details',
        show_display_id: true,
      },
      next: 'quote_created',
    },
    
    quote_created: {
      type: 'message',
      message: `Your quote request has been submitted successfully! Here is your Quote ID:

                Our team will review your requirements and send you a detailed proposal with pricing soon. You can track your quote status in your dashboard.

                We'll notify you as soon as we have an update!`, // must show user the display_id of the quote_id from the database
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

