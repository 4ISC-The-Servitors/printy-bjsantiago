# Chat Flows - JSONB System

This directory contains all chat flow definitions for the Printy application using the JSONB-based flow system.

## Overview

Each flow is a TypeScript object that will be stored as JSONB in the `chat_flows_v2` database table. This approach provides:

- Single-file flow definitions
- Easy version control
- Type safety with TypeScript
- Simple editing and maintenance

For complete system documentation, see: `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md`

## Directory Structure

```
src/chatFlows/
├── types.ts              # TypeScript type definitions
├── index.ts              # Main export file
├── README.md             # This file
├── customer/             # Customer-facing flows
│   ├── index.ts
│   ├── askQuoteFlow.ts
│   ├── issueTicketFlow.ts
│   ├── trackOrderFlow.ts
│   └── uploadPaymentFlow.ts
└── admin/                # Admin-facing flows
    ├── index.ts
    ├── replyTicketFlow.ts
    └── sendQuoteProposalFlow.ts
```

## Customer Flows

### 1. Ask Quote Flow (`ask-quote`)

Customer requests a printing quote by describing their requirements.

**Steps:**

1. Collect quote details from customer
2. Create quote conversation in database
3. Show confirmation

### 2. Issue Ticket Flow (`issue-ticket`)

Customer submits a support ticket for issues (quality, delivery, billing, etc.).

**Steps:**

1. Select issue type
2. Describe the issue
3. Optionally provide order ID
4. Create ticket in database

### 3. Track Order Flow (`track-order`)

Customer checks the status of their order.

**Steps:**

1. Enter order ID
2. Look up order in database
3. Display order status

Note: Requires `lookup_order` action to be implemented.

### 4. Upload Payment Flow (`upload-payment`)

Customer uploads proof of payment for their order.

**Steps:**

1. Enter order ID
2. Verify order exists
3. Upload payment proof file
4. Process and store file

## Admin Flows

### 1. Reply Ticket Flow (`reply-ticket`)

Admin responds to a customer support ticket.

**Steps:**

1. Show ticket details
2. Collect admin's reply
3. Send reply to customer
4. Optionally resolve the ticket

### 2. Send Quote Proposal Flow (`send-quote-proposal`)

Admin sends a detailed quote proposal to customer.

**Steps:**

1. Show quote request details
2. Collect specification details
3. Collect pricing
4. Collect estimated deadline
5. Review summary
6. Send proposal to customer

## Usage

### Import a Specific Flow

```typescript
import { askQuoteFlow } from '@/chatFlows/customer';
import { replyTicketFlow } from '@/chatFlows/admin';
```

### Import All Flows

```typescript
import { allFlows, getFlow, flows } from '@/chatFlows';

// Get a specific flow
const flow = getFlow('ask-quote');

// Get all customer flows
const customerFlows = flows.customer.all;

// Get all admin flows
const adminFlows = flows.admin.all;
```

### Using the Flows Helper

```typescript
import { flows } from '@/chatFlows';

// Check if a flow exists
if (flows.exists('ask-quote')) {
  const flow = flows.get('ask-quote');
}

// Get all flow IDs
const allIds = flows.allIds();
const customerIds = flows.customer.ids();
const adminIds = flows.admin.ids();
```

## Adding a New Flow

1. Create a new file in the appropriate directory (`customer/` or `admin/`)
2. Define your flow using the `FlowDefinition` type
3. Export the flow from the file
4. Add the export to the directory's `index.ts`

Example:

```typescript
// customer/myNewFlow.ts
import type { FlowDefinition } from '../types';

export const myNewFlow: FlowDefinition = {
  flow_id: 'my-new-flow',
  title: 'My New Flow',
  description: 'Description of what this flow does',
  initial_node: 'welcome',

  nodes: {
    welcome: {
      type: 'message',
      message: 'Welcome message here',
      options: [{ label: 'Continue', next: 'end' }],
    },

    end: {
      type: 'end',
      message: 'Goodbye!',
    },
  },
};

// Then add to customer/index.ts:
export { myNewFlow } from './myNewFlow';
// And add to customerFlows map
```

## Node Types

### Message Node

Displays a message with optional buttons or text input.

```typescript
{
  type: 'message',
  message: 'Your message here',
  expects_input?: true,
  input_config?: {
    store_as: 'variable_name',
    required: true,
    validation: 'min_length:10'
  },
  next?: 'next_node_id',
  options?: [
    { label: 'Button Text', next: 'next_node_id' }
  ]
}
```

### Action Node

Performs a backend action (create quote, send email, etc.).

```typescript
{
  type: 'action',
  message: 'Processing...',
  action: 'create_quote_conversation',
  action_config: {
    details_key: 'quote_details',
    show_display_id: true
  },
  next?: 'next_node_id',
  options?: [...]
}
```

### End Node

Ends the conversation.

```typescript
{
  type: 'end',
  message: 'Final message here'
}
```

## Available Actions

- `create_quote_conversation` - Creates a quote request
- `create_inquiry` - Creates a support ticket
- `upload_payment_proof` - Handles payment proof uploads
- `send_admin_reply` - Sends admin reply to customer
- `ai_summarize_specs` - AI analyzes quote conversation

See `types.ts` for complete action configurations.

## TODO Items in Flows

Some flows reference actions that need to be implemented:

- `lookup_order` - Track Order Flow
- `verify_order` - Upload Payment Flow
- `resolve_inquiry` - Reply Ticket Flow
- `send_quote_proposal` - Send Quote Proposal Flow

These are marked with `as any` type casts and TODO comments.

## Testing

Before deploying flows to production:

1. Review the flow definition for correctness
2. Test all paths through the flow
3. Verify all actions are implemented
4. Check input validations work as expected
5. Ensure error handling is in place

## Migration to Database

To insert these flows into the database:

```sql
INSERT INTO chat_flows_v2 (flow_id, flow_definition, active)
VALUES (
  'ask-quote',
  '[FLOW_DEFINITION_JSON]'::jsonb,
  true
);
```

See the migration guide in `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md` for details.
