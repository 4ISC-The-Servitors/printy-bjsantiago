## JSONB Chat Flow System - Implementation Guide

This guide explains how to implement the new JSONB-based chat flow system based on the old `AskQuote.ts` logic.

## Architecture Overview

```
User Input
    ↓
useJsonbFlowConversations (Hook)
    ↓
JsonbFlowProcessor (Engine)
    ↓
Database (chat_sessions_v2, chat_messages_v2)
    ↓
Actions (create_quote_conversation, create_inquiry, etc.)
```

## Key Components

### 1. Flow Definitions (`src/chatFlows/`)

TypeScript objects that define the complete flow structure:

```typescript
export const askQuoteFlow: FlowDefinition = {
  flow_id: 'ask-quote',
  title: 'Request a Quote',
  initial_node: 'intro',
  nodes: {
    intro: { ... },
    create_quote: { ... },
    end: { ... }
  }
};
```

### 2. Database Tables

**chat_flows_v2** - Stores flow definitions as JSONB  
**chat_sessions_v2** - Active conversations  
**chat_messages_v2** - Encrypted message history  

See: `supabase/sql/chat-logic-flows/v2_jsonb_chat_system.sql`

### 3. JsonbFlowProcessor (`src/features/chat/core/services/JsonbFlowProcessor.ts`)

The execution engine that:
- Starts new conversations
- Processes user input
- Executes actions (create quote, create inquiry, etc.)
- Manages session state

Based on the logic from `src/chatLogic/customer/flows/AskQuote.ts`

### 4. useJsonbFlowConversations Hook (`src/hooks/customer/useJsonbFlowConversations.ts`)

React hook that:
- Manages UI state (messages, typing, quick replies)
- Calls JsonbFlowProcessor
- Handles conversation lifecycle

## How It Works (Ask Quote Example)

### Step 1: User Starts Flow

```typescript
// User clicks "Ask for Quote" button
await startFlow('ask-quote', 'Request a Quote');
```

What happens:
1. Hook gets customer ID from auth
2. Fetches flow definition from `chatFlows/customer/askQuoteFlow.ts`
3. Calls `JsonbFlowProcessor.startFlow()`
4. Creates row in `chat_sessions_v2` with metadata:
   ```json
   {
     "current_node_id": "intro",
     "context": {}
   }
   ```
5. Inserts Printy's intro message to `chat_messages_v2`
6. Returns initial messages and quick replies to UI

### Step 2: User Sends Quote Details

```typescript
// User types: "I need 100 business cards, 3.5x2 inches, matte finish"
await sendMessage(userInput);
```

What happens:
1. Insert user message to `chat_messages_v2`
2. Get current node (`intro`)
3. Node expects input → store in `context.quote_details`
4. Move to next node (`create_quote`)
5. Execute action `create_quote_conversation`

### Step 3: Create Quote Action Executes

In `JsonbFlowProcessor.executeAction()`:

```typescript
case 'create_quote_conversation': {
  // Get quote details from context
  const quoteDetails = context['quote_details'];
  
  // Create quote conversation (old AskQuote.ts logic)
  const { data: conversationId } = await supabase.rpc(
    'create_quote_conversation',
    { p_customer_id: customerId }
  );
  
  // Fetch display_id
  const { data: quoteData } = await supabase
    .from('quote_conversations')
    .select('display_id')
    .eq('conversation_id', conversationId)
    .single();
  
  // Add message to quote_messages
  await supabase.rpc('add_quote_message', {
    p_conversation_id: conversationId,
    p_sender_id: customerId,
    p_sender_role: 'customer',
    p_message_text: quoteDetails,
    p_message_type: 'chat',
  });
  
  // Link session to quote
  await updateSessionMetadata(sessionId, {
    ...metadata,
    quote_conversation_id: conversationId,
  });
  
  // Send success message with display_id
  const successText = `Your quote request has been submitted successfully! 
    Here is your Quote ID: ${quoteData.display_id}...`;
}
```

This matches exactly what the old `AskQuote.ts` did!

### Step 4: Flow Continues

1. Move to `quote_created` node
2. Show confirmation message
3. Display "End Chat" quick reply
4. User clicks "End Chat" → move to `end` node
5. Session status → 'ended'

## Migration Steps

### Phase 1: Database Setup

1. Run migration: `supabase/sql/chat-logic-flows/v2_jsonb_chat_system.sql`
2. Insert flow definitions: `supabase/sql/chat-logic-flows/inserts/004_insert_customer_flows.sql`
3. Verify tables and RPC functions exist

### Phase 2: Test with Ask Quote Flow

1. Use `useJsonbFlowConversations` hook in a test component
2. Start 'ask-quote' flow
3. Submit quote details
4. Verify quote conversation is created
5. Check messages in both `chat_messages_v2` and `quote_messages`

### Phase 3: Implement Other Flows

1. Issue Ticket flow (uses `create_inquiry` action)
2. Track Order flow (needs `lookup_order` action - not yet implemented)
3. Upload Payment flow (needs `verify_order` action - not yet implemented)

### Phase 4: Switch Production

1. Update customer dashboard to use `useJsonbFlowConversations`
2. Test all flows in staging
3. Gradual rollout to production
4. Monitor for errors

## Comparison: Old vs New

### Old System (AskQuote.ts)

```typescript
export const askQuoteFlow: ChatFlow = {
  id: 'ask-quote',
  
  initial(ctx) {
    return [{ role: 'printy', text: "Hi! I'm Printy..." }];
  },
  
  async respond(ctx, input) {
    if (!hasCreatedQuote) {
      // Create quote conversation
      const { data: conversationId } = await supabase.rpc(...);
      // Add message
      await supabase.rpc('add_quote_message', ...);
      hasCreatedQuote = true;
      return { messages: [...] };
    }
  }
};
```

**Issues:**
- State stored in module variable (`hasCreatedQuote`)
- Hard to test
- No clear flow structure
- Can't easily modify flow without code changes

### New System (JSONB Flow)

```typescript
export const askQuoteFlow: FlowDefinition = {
  flow_id: 'ask-quote',
  initial_node: 'intro',
  nodes: {
    intro: {
      type: 'message',
      message: "Hi! I'm Printy...",
      expects_input: true,
      input_config: { store_as: 'quote_details' },
      next: 'create_quote'
    },
    create_quote: {
      type: 'action',
      action: 'create_quote_conversation',
      action_config: { details_key: 'quote_details' },
      next: 'quote_created'
    },
    quote_created: { ... },
    end: { type: 'end', ... }
  }
};
```

**Benefits:**
- State stored in database (`chat_sessions_v2.metadata`)
- Clear, declarative flow structure
- Easy to modify (just edit JSON)
- Can be stored in database and updated without code deploy
- Testable and maintainable

## Action Implementations

### Implemented Actions

- `create_quote_conversation` - Creates quote and dual-writes to quote_messages
- `create_inquiry` - Creates support ticket

### TODO Actions

- `lookup_order` - Track order status
- `verify_order` - Verify order for payment upload
- `upload_payment_proof` - Handle payment file upload
- `send_admin_reply` - Admin replies to ticket
- `send_quote_proposal` - Admin sends quote proposal
- `ai_summarize_specs` - AI analyzes quote conversation

## Testing Checklist

- [ ] Database tables created successfully
- [ ] Flow definitions inserted
- [ ] RPC functions work (encryption/decryption)
- [ ] Ask Quote flow: start conversation
- [ ] Ask Quote flow: submit details
- [ ] Ask Quote flow: quote created in database
- [ ] Ask Quote flow: display_id shown to user
- [ ] Ask Quote flow: messages in both chat_messages_v2 and quote_messages
- [ ] Issue Ticket flow: create inquiry
- [ ] Session state persists across messages
- [ ] End Chat works correctly
- [ ] Conversation history retrievable

## Debugging Tips

### View Flow Definitions

```sql
SELECT flow_id, active, flow_definition->>'title' as title 
FROM chat_flows_v2;
```

### View Active Sessions

```sql
SELECT s.session_id, s.flow_id, s.status, 
       s.metadata->>'current_node_id' as current_node
FROM chat_sessions_v2 s
WHERE customer_id = 'USER_ID'
ORDER BY created_at DESC;
```

### View Messages

```sql
SELECT * FROM api_fetch_chat_messages_v2('SESSION_ID');
```

### Check Quote Link

```sql
SELECT metadata->>'quote_conversation_id' 
FROM chat_sessions_v2 
WHERE session_id = 'SESSION_ID';
```

## Performance Considerations

1. **JSONB Indexing**: If you need to query flow definitions frequently, add GIN index:
   ```sql
   CREATE INDEX idx_flow_definition_gin ON chat_flows_v2 USING GIN (flow_definition);
   ```

2. **Message Encryption**: Decryption happens on every message fetch. Consider caching for frequently accessed conversations.

3. **Session Cleanup**: Implement a cron job to archive old ended sessions.

## Security Notes

1. Messages are encrypted using `pgp_sym_encrypt`
2. RLS policies ensure users only see their own sessions
3. Encryption key should be stored in Supabase Vault (not hardcoded)
4. Customer ID is verified from `auth.uid()` to prevent impersonation

## Next Steps

1. Test the system with real users
2. Implement remaining actions
3. Add analytics/logging
4. Create admin interface to edit flows
5. Add flow versioning
6. Migrate old chat_sessions to v2 format
7. Deprecate old chat system

