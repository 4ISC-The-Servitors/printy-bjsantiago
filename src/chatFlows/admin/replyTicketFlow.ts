import type { FlowDefinition } from '../types';

/**
 * Reply to Ticket Flow - Admin replies to a customer support ticket
 *
 * Flow Steps:
 * 1. intro - Show ticket details and ask for reply
 * 2. send_reply - Send admin's reply to customer
 * 3. reply_sent - Confirmation message
 * 4. ask_resolve - Ask if ticket should be resolved
 * 5. resolve_ticket - Mark ticket as resolved (if yes)
 * 6. end - End conversation
 */
export const replyTicketFlow: FlowDefinition = {
  flow_id: 'reply-ticket',
  title: 'Reply to Support Ticket',
  description: 'Admin responds to a customer support ticket',
  initial_node: 'intro',

  nodes: {
    intro: {
      type: 'message',
      message: `TICKET DETAILS

Customer: [CUSTOMER_NAME]
Issue Type: [INQUIRY_TYPE]
Submitted: [CREATED_DATE]

Customer's Message:
[ISSUE_DETAILS]

Please type your reply to the customer:`,
      expects_input: true,
      input_config: {
        store_as: 'admin_reply',
        required: true,
        validation: 'min_length:10',
      },
      next: 'send_reply',
    },

    send_reply: {
      type: 'action',
      message: 'Sending your reply to the customer...',
      action: 'send_admin_reply',
      action_config: {
        inquiry_id_key: 'inquiry_id',
        notify_customer: true,
      },
      next: 'reply_sent',
    },

    reply_sent: {
      type: 'message',
      message: `Your reply has been sent to the customer!

They will receive a notification and can view your response in their dashboard.

Would you like to resolve this ticket?`,
      options: [
        {
          label: 'Yes, Resolve Ticket',
          next: 'resolve_ticket',
          value: 'true',
          store_as: 'resolve',
        },
        { label: 'No, Keep Open', next: 'end' },
      ],
    },

    resolve_ticket: {
      type: 'action',
      message: 'Resolving ticket...',
      action: 'resolve_inquiry' as any, // TODO: Implement this action
      action_config: {
        inquiry_id_key: 'inquiry_id',
      } as any,
      next: 'end',
    },

    end: {
      type: 'end',
      message: 'Ticket updated successfully!',
    },
  },
};
