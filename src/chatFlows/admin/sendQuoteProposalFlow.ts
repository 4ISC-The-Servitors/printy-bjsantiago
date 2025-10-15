import type { FlowDefinition } from '../types';

/**
 * Send Quote Proposal Flow - Admin sends a quote proposal to customer
 *
 * Flow Steps:
 * 1. intro - Show quote request details
 * 2. collect_specs - Collect specification details
 * 3. collect_price - Collect pricing information
 * 4. collect_deadline - Collect estimated completion date
 * 5. review_proposal - Show summary for review
 * 6. send_proposal - Send proposal to customer
 * 7. proposal_sent - Confirmation message
 * 8. end - End conversation
 */
export const sendQuoteProposalFlow: FlowDefinition = {
  flow_id: 'send-quote-proposal',
  title: 'Send Quote Proposal',
  description: 'Admin sends a detailed quote proposal to customer',
  initial_node: 'intro',

  nodes: {
    intro: {
      type: 'message',
      message: `QUOTE REQUEST DETAILS

Customer: [CUSTOMER_NAME]
Requested: [CREATED_DATE]
Quote ID: [QUOTE_ID]

Customer's Request:
[QUOTE_DETAILS]

Let's create a proposal for this quote.

Please enter the specification details (e.g., material, size, finishing, etc.):`,
      expects_input: true,
      input_config: {
        store_as: 'spec_details',
        required: true,
        validation: 'min_length:10',
      },
      next: 'collect_price',
    },

    collect_price: {
      type: 'message',
      message: `Enter the quoted price (numbers only, no currency symbol):

Example: 1500`,
      expects_input: true,
      input_config: {
        store_as: 'quoted_price',
        required: true,
        validation: 'numeric',
      },
      next: 'collect_deadline',
    },

    collect_deadline: {
      type: 'message',
      message: `Enter the estimated completion date:

Example: 2025-10-25 or "5 business days"`,
      expects_input: true,
      input_config: {
        store_as: 'estimated_deadline',
        required: true,
      },
      next: 'review_proposal',
    },

    review_proposal: {
      type: 'message',
      message: `PROPOSAL SUMMARY

Specifications: [SPEC_DETAILS]
Quoted Price: PHP [QUOTED_PRICE]
Estimated Completion: [ESTIMATED_DEADLINE]

Does this look correct?`,
      options: [
        { label: 'Yes, Send Proposal', next: 'send_proposal' },
        { label: 'Cancel', next: 'end' },
      ],
    },

    send_proposal: {
      type: 'action',
      message: 'Sending proposal to customer...',
      action: 'send_quote_proposal' as any, // TODO: Implement this action
      action_config: {
        quote_conversation_id_key: 'quote_conversation_id',
        spec_details_key: 'spec_details',
        quoted_price_key: 'quoted_price',
        deadline_key: 'estimated_deadline',
        notify_customer: true,
      } as any,
      next: 'proposal_sent',
    },

    proposal_sent: {
      type: 'message',
      message: `Your quote proposal has been sent to the customer!

They will receive a notification and can review the proposal in their dashboard.

The quote status has been updated to "Pending Customer Response".`,
      options: [{ label: 'End Chat', next: 'end' }],
    },

    end: {
      type: 'end',
      message: 'Quote proposal process complete!',
    },
  },
};
