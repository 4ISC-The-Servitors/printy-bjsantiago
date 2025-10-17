# Chat Services Architecture

This directory contains the core services for the JSONB-based chat flow system (V2). It implements a modular, action-based architecture for processing chat flows with clear separation of concerns.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    JsonbFlowProcessor                        │
│  (Flow execution engine - processes JSONB flow definitions)  │
└────────────────────┬────────────────────────────────────────┘
                     │
         ┌───────────┴──────────┐
         │                      │
    ┌────▼─────┐         ┌─────▼────┐
    │ Actions  │         │ Helpers  │
    │ Registry │         │          │
    └────┬─────┘         └──────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼────┐
│Admin │  │Customer│
│Actions│  │Actions│
└──────┘  └───────┘
```

## Directory Structure

```
services/
├── README.md                    # This file
├── JsonbFlowProcessor.ts        # Main flow execution engine
├── ChatDatabaseService.ts       # Database operations layer
├── types.ts                     # Shared TypeScript types
├── actions/                     # Action handler modules
│   ├── index.ts                # Unified action registry
│   ├── admin/                  # Admin-specific actions
│   │   ├── index.ts           # Admin action registry
│   │   ├── aiSummarizeSpecs.ts
│   │   ├── displayQuoteDetailsAdmin.ts
│   │   ├── openSpecEditor.ts
│   │   └── sendQuoteProposal.ts
│   └── customer/              # Customer-specific actions
│       ├── index.ts          # Customer action registry
│       ├── acceptQuoteProposal.ts
│       ├── createInquiry.ts
│       ├── createQuoteConversation.ts
│       ├── displayQuoteDetails.ts
│       ├── rejectQuoteProposal.ts
│       ├── uploadPaymentProof.ts
│       └── verifyOrder.ts
└── helpers/                   # Utility functions
    ├── index.ts
    └── flowHelpers.ts        # Flow processing utilities
```

## Key Components

### 1. JsonbFlowProcessor

The main flow execution engine that:
- Loads flow definitions from the database
- Processes user input and advances through flow nodes
- Executes action handlers when action nodes are reached
- Manages session state and context
- Handles message persistence

**Usage:**
```typescript
import { JsonbFlowProcessor } from './services/JsonbFlowProcessor';

const processor = new JsonbFlowProcessor();

// Start a new flow
await processor.startFlow({
  flowId: 'ask-quote',
  customerId: 'user-123',
  role: 'customer'
});

// Process user input
await processor.processInput({
  sessionId: 'session-456',
  userInput: 'I need 100 business cards',
  customerId: 'user-123'
});
```

### 2. Action Handlers

Modular functions that execute specific business logic during flow execution. Each action handler:
- Receives execution parameters (context, session, customer ID)
- Performs business logic (database operations, external API calls, etc.)
- Returns messages to display to the user

**Action Handler Signature:**
```typescript
export type ActionHandler = (params: ActionExecutionParams) => Promise<ActionExecutionResult>;

interface ActionExecutionParams {
  actionNode: ActionNode;      // The action node from flow definition
  sessionId: string;            // Current chat session ID
  customerId: string;           // Customer performing the action
  context: SessionContext;      // Current session context/variables
}

interface ActionExecutionResult {
  messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }>;
}
```

### 3. Action Registry

The unified registry (`actions/index.ts`) merges admin and customer action handlers into a single map that the flow processor uses to execute actions.

**Current Registered Actions:**

**Customer Actions:**
- `verify_order` - Verifies an order by tracking number
- `display_quote_details` - Shows quote proposal details
- `upload_payment_proof` - Handles payment proof upload
- `accept_quote_proposal` - Accepts a quote proposal
- `reject_quote_proposal` - Rejects a quote proposal
- `create_quote_conversation` - Creates a new quote request
- `create_inquiry` - Creates a support ticket/inquiry

**Admin Actions:**
- `display_quote_details_admin` - Shows quote details for admin
- `ai_summarize_specs` - AI-powered spec summarization
- `send_quote_proposal` - Sends quote proposal to customer
- `open_spec_editor` - Opens the spec editor UI

### 4. Flow Helpers

Utility functions in `helpers/flowHelpers.ts` that provide common operations:

- `buildQuickReplies(node)` - Builds quick reply buttons from node options
- `getFlowOwner(flowDef, fallback)` - Resolves flow owner (customer/admin/guest)
- `insertMessage(params)` - Inserts encrypted message to database
- `updateSessionMetadata(sessionId, metadata)` - Updates session metadata
- `endSession(sessionId)` - Ends a chat session
- `processPendingQuoteAction(action, conversationId)` - Processes pending quote accept/reject
- `fetchSessionMessages(sessionId)` - Fetches and decrypts session messages

## How It Works

### Flow Execution Lifecycle

1. **Start Flow** (`JsonbFlowProcessor.startFlow`)
   - Load flow definition from database
   - Create new session in `chat_sessions_v2`
   - Display initial message node
   - Return quick replies if available

2. **Process User Input** (`JsonbFlowProcessor.processInput`)
   - Load session and flow definition
   - Find current node in flow
   - Match user input to node options (if applicable)
   - Save user message to database
   - Advance to next node

3. **Execute Action Node** (if next node is action type)
   - Look up action handler in registry
   - Pass execution parameters (context, session, customer)
   - Execute business logic
   - Collect and return messages
   - Advance to next node

4. **Display Message Node** (if next node is message type)
   - Display message text
   - Show quick reply options
   - Wait for user input

5. **End Flow** (when reaching end node)
   - Mark session as ended
   - Process any pending actions (e.g., quote accept/reject)
   - Display final message

## Adding a New Action Handler

### Step 1: Create the Action Handler File

Create a new file in either `actions/admin/` or `actions/customer/`:

```typescript
// actions/customer/myNewAction.ts

import { supabase } from '../../../../../../lib/supabase';
import { insertMessage } from '../../helpers/flowHelpers';
import type { ActionExecutionParams, ActionExecutionResult } from '../../types';

/**
 * Action handler: my_new_action
 * Brief description of what this action does
 */
export async function myNewAction(params: ActionExecutionParams): Promise<ActionExecutionResult> {
  const { actionNode, context, customerId, sessionId } = params;
  const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

  // Extract configuration from action node
  const config = actionNode.action_config as any;
  const someKey = config.some_key || 'default_key';
  const someValue = context[someKey];

  // Perform business logic
  // ... database operations, API calls, etc.

  // Add response message
  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: 'Action completed successfully!',
    ts: Date.now(),
  });

  // Optionally persist message to database
  await insertMessage({
    sessionId,
    text: 'Action completed successfully!',
    role: 'printy',
    nodeId: actionNode.action,
  });

  return { messages };
}
```

### Step 2: Register the Action

Add to the appropriate registry file (`actions/admin/index.ts` or `actions/customer/index.ts`):

```typescript
// actions/customer/index.ts

import { myNewAction } from './myNewAction';

export const actionHandlers: Record<string, ActionHandler> = {
  // ... existing actions
  my_new_action: myNewAction,
};

export { myNewAction };
```

### Step 3: Use in Flow Definition

Reference the action in your JSONB flow definition:

```json
{
  "id": "my-flow",
  "name": "My Flow",
  "initial_node": "start",
  "nodes": [
    {
      "id": "action_node",
      "type": "action",
      "action": "my_new_action",
      "action_config": {
        "some_key": "context_variable_name"
      },
      "next": "next_node"
    }
  ]
}
```

## Database Schema

### chat_sessions_v2
Stores chat session metadata including flow state and context variables.

```sql
- session_id (uuid, PK)
- customer_id (uuid)
- flow_id (text)
- status (text) - 'active' | 'ended'
- started_at (timestamp)
- ended_at (timestamp, nullable)
- metadata (jsonb) - includes current_node, context, etc.
```

### chat_messages_v2
Stores encrypted chat messages.

```sql
- message_id (uuid, PK)
- session_id (uuid, FK)
- sender_role (text) - 'customer' | 'admin' | 'printy'
- message_text_enc (text) - encrypted message
- sent_at (timestamp)
- node_id (text, nullable)
```

### chat_flows
Stores JSONB flow definitions.

```sql
- flow_id (text, PK)
- flow_name (text)
- flow_definition (jsonb)
- owner (text) - 'customer' | 'admin' | 'guest'
- is_active (boolean)
- created_at (timestamp)
```

## Security Considerations

1. **Message Encryption**: All messages in `chat_messages_v2` are encrypted using Supabase RPC functions:
   - `api_insert_chat_message_v2` - Encrypts and inserts messages
   - `api_fetch_chat_messages_v2` - Fetches and decrypts messages

2. **Access Control**: Action handlers should verify:
   - User owns the resource they're modifying
   - User has permission for the requested action
   - Session belongs to the user

3. **Input Validation**: Always validate context variables and user input before processing.

## Testing

### Unit Testing Action Handlers

```typescript
import { describe, it, expect, vi } from 'vitest';
import { myNewAction } from './myNewAction';

describe('myNewAction', () => {
  it('should execute action successfully', async () => {
    const params = {
      actionNode: {
        id: 'test',
        type: 'action',
        action: 'my_new_action',
        action_config: { some_key: 'test_key' },
        next: 'next_node'
      },
      sessionId: 'session-123',
      customerId: 'customer-456',
      context: { test_key: 'test_value' }
    };

    const result = await myNewAction(params);

    expect(result.messages).toHaveLength(1);
    expect(result.messages[0].text).toContain('success');
  });
});
```

## Migration from Legacy System

This modular action system replaces the legacy inline action handling in `sendConversationMessage.ts`.

**Old approach (deprecated):**
```typescript
// All action logic inline in massive switch statement
switch (actionType) {
  case 'create_quote':
    // 50 lines of inline logic
    break;
  case 'verify_order':
    // 40 lines of inline logic
    break;
  // ... hundreds more lines
}
```

**New approach (current):**
```typescript
// Clean delegation to modular handlers
const handler = actionHandlers[actionType];
if (handler) {
  const result = await handler({ actionNode, sessionId, customerId, context });
  return result.messages;
}
```

**Benefits:**
- ✅ Single Responsibility: Each action in its own file
- ✅ Testable: Easy to unit test individual actions
- ✅ Maintainable: Changes isolated to specific action files
- ✅ Discoverable: Clear structure shows all available actions
- ✅ Scalable: Adding new actions doesn't bloat existing files

## Troubleshooting

### Action Not Executing
1. Check action is registered in `actions/{role}/index.ts`
2. Verify action name matches exactly in flow definition
3. Check console logs for execution errors
4. Verify action handler signature matches `ActionHandler` type

### Messages Not Persisting
1. Ensure `insertMessage` is called with correct parameters
2. Check `api_insert_chat_message_v2` RPC exists in database
3. Verify session_id is valid and active
4. Check Supabase logs for RPC errors

### Context Variables Missing
1. Verify variables are captured in previous flow nodes
2. Check session metadata in `chat_sessions_v2` table
3. Ensure `updateSessionMetadata` is called when needed
4. Verify action_config keys match context variable names

## Related Files

- `../JsonbFlowProcessor.ts` - Main flow processor
- `../ChatDatabaseService.ts` - Database operations
- `../../../../chatFlows/types.ts` - Flow definition types
- `../../../../hooks/customer/useJsonbFlowConversations.ts` - Customer hook
- `../../../../hooks/admin/useAdminChat.ts` - Admin hook

## Future Improvements

- [ ] Add comprehensive unit tests for all action handlers
- [ ] Implement action handler middleware (logging, error handling, auth)
- [ ] Add action handler timeout mechanism
- [ ] Create action handler generator CLI tool
- [ ] Add action handler validation against flow definitions
- [ ] Implement action handler versioning
- [ ] Add performance monitoring for slow actions

---

**Last Updated:** 2025-10-16
**Maintained By:** Development Team
