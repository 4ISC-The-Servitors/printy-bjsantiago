# Chat Flows Structure Overview

## File Tree

```
src/chatFlows/
├── types.ts                           # TypeScript definitions for flow system
├── index.ts                           # Main exports and utility functions
├── README.md                          # Documentation and usage guide
├── STRUCTURE.md                       # This file - quick reference
│
├── customer/                          # Customer-facing flows
│   ├── index.ts                       # Customer flows exports
│   ├── askQuoteFlow.ts                # Flow: ask-quote
│   ├── issueTicketFlow.ts             # Flow: issue-ticket
│   ├── trackOrderFlow.ts              # Flow: track-order
│   └── uploadPaymentFlow.ts           # Flow: upload-payment
│
└── admin/                             # Admin-facing flows
    ├── index.ts                       # Admin flows exports
    ├── replyTicketFlow.ts             # Flow: reply-ticket
    └── sendQuoteProposalFlow.ts       # Flow: send-quote-proposal
```

## Quick Import Reference

```typescript
// Import everything
import { flows, allFlows, getFlow } from '@/chatFlows';

// Import types
import type {
  FlowDefinition,
  FlowNode,
  MessageNode,
  ActionNode,
  EndNode,
  SessionMetadata,
  SessionContext,
} from '@/chatFlows';

// Import specific flows
import {
  askQuoteFlow,
  issueTicketFlow,
  trackOrderFlow,
  uploadPaymentFlow,
} from '@/chatFlows/customer';

import { replyTicketFlow, sendQuoteProposalFlow } from '@/chatFlows/admin';
```

## Flow IDs Reference

### Customer Flows

- `ask-quote` - Request a printing quote
- `issue-ticket` - Submit a support ticket
- `track-order` - Check order status
- `upload-payment` - Upload payment proof

### Admin Flows

- `reply-ticket` - Reply to customer support ticket
- `send-quote-proposal` - Send quote proposal to customer

## Implementation Status

### Fully Defined (Ready to Use)

- ask-quote
- issue-ticket

### Needs Action Implementation

- track-order (needs `lookup_order` action)
- upload-payment (needs `verify_order` action)
- reply-ticket (needs `resolve_inquiry` action)
- send-quote-proposal (needs `send_quote_proposal` action)

## Next Steps

1. Implement missing backend actions
2. Create database migration to add flows to `chat_flows_v2` table
3. Build flow execution engine that reads and executes these flows
4. Connect to UI components for rendering messages and collecting input
5. Test each flow end-to-end

## Related Documentation

- Full System Guide: `docs_guide/JSONB_CHAT_FLOW_SYSTEM.md`
- Usage Examples: `src/chatFlows/README.md`
- Type Definitions: `src/chatFlows/types.ts`
