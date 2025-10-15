# JSONB Chat Flow System - Simple Guide

## 🎯 The Big Idea

Instead of spreading chat flows across 3 database tables with dozens of rows, we store **one complete flow in one JSONB document**. Simple, readable, easy to edit.

---

## 📊 The Three Tables You Need

### 1. `chat_flows_v2` - Flow Definitions

**One row = one complete chat flow**

```sql
CREATE TABLE chat_flows_v2 (
  flow_id TEXT PRIMARY KEY,           -- 'ask-quote', 'issue-ticket', etc.
  flow_definition JSONB NOT NULL,     -- The entire flow (see below)
  active BOOLEAN DEFAULT true,        -- Is this flow available?
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. `chat_sessions_v2` - Active Conversations

**One row = one conversation between a user and Printy**

```sql
CREATE TABLE chat_sessions_v2 (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id TEXT REFERENCES chat_flows_v2(flow_id),
  customer_id UUID NOT NULL,          -- Who is chatting
  status TEXT DEFAULT 'active',       -- 'active' or 'ended'
  created_at TIMESTAMPTZ DEFAULT now(),
  ended_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb  -- Current state (see below)
);

CREATE INDEX idx_sessions_customer ON chat_sessions_v2(customer_id);
CREATE INDEX idx_sessions_status ON chat_sessions_v2(status);
```

**What goes in `metadata`?**

```json
{
  "current_node_id": "intro",
  "context": {
    "quote_details": "I need 100 business cards...",
    "order_id": "ORD-123",
    "inquiry_type": "quality"
  },
  "quote_conversation_id": "uuid-here",
  "inquiry_id": "uuid-here"
}
```

### 3. `chat_messages_v2` - Message History

**One row = one message (from anyone)**

```sql
CREATE TABLE chat_messages_v2 (
  message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions_v2(session_id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,          -- 'customer', 'admin', 'printy'
  message_text_enc BYTEA NOT NULL,    -- Encrypted message
  sent_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb  -- Extra info
);

CREATE INDEX idx_messages_session ON chat_messages_v2(session_id, sent_at);
```

**What goes in `metadata`?**

```json
{
  "node_id": "intro",
  "has_attachment": true,
  "attachment_url": "https://..."
}
```

---

## 📝 Flow Definition Structure

This is what goes in `chat_flows_v2.flow_definition`:

```json
{
  "flow_id": "ask-quote",
  "title": "Ask Quote",
  "description": "Customer requests a quote for printing",
  "initial_node": "intro",
  "nodes": {
    "intro": {
      "type": "message",
      "message": "Hi! I'm Printy. What would you like to print?\n\nPlease describe:\n• Item type\n• Size\n• Quantity\n• Materials\n• Deadline",
      "expects_input": true,
      "input_config": {
        "store_as": "quote_details",
        "required": true
      },
      "next": "create_quote"
    },
    "create_quote": {
      "type": "action",
      "message": "Creating your quote request...",
      "action": "create_quote_conversation",
      "action_config": {
        "details_key": "quote_details",
        "show_display_id": true
      },
      "options": [{ "label": "End Chat", "next": "end" }]
    },
    "end": {
      "type": "end",
      "message": "Thanks for chatting with Printy! Have a great day."
    }
  }
}
```

---

## 🔄 How It Works

### Starting a Conversation

```typescript
// 1. User clicks "Ask for Quote"
const session = {
  session_id: generateUUID(),
  flow_id: 'ask-quote',
  customer_id: currentUser.id,
  status: 'active',
  metadata: {
    current_node_id: 'intro', // Start at initial_node
    context: {},
  },
};

// 2. Get the flow definition
const flow = await db.query(
  'SELECT flow_definition FROM chat_flows_v2 WHERE flow_id = $1',
  ['ask-quote']
);

// 3. Get the initial node
const initialNode =
  flow.flow_definition.nodes[flow.flow_definition.initial_node];

// 4. Show Printy's first message
const printyMessage = {
  session_id: session.session_id,
  sender_role: 'printy',
  message_text_enc: encrypt(initialNode.message),
  metadata: { node_id: 'intro' },
};

// 5. Save message to chat_messages_v2
await saveMessage(printyMessage);
```

### User Sends a Message

```typescript
// 1. User types: "I need 100 business cards, 3.5x2 inches..."
const userMessage = {
  session_id: session.session_id,
  sender_role: 'customer',
  message_text_enc: encrypt(userInput),
  metadata: { node_id: currentNodeId },
};

// 2. Save user's message
await saveMessage(userMessage);

// 3. Get current node from flow
const currentNode = flow.nodes[session.metadata.current_node_id];

// 4. If node expects input, store it
if (currentNode.expects_input) {
  session.metadata.context[currentNode.input_config.store_as] = userInput;
  // Now metadata.context.quote_details = "I need 100 business cards..."
}

// 5. Move to next node
const nextNodeId = currentNode.next;
session.metadata.current_node_id = nextNodeId;

// 6. Update session
await updateSession(session);

// 7. Process next node (might have an action)
const nextNode = flow.nodes[nextNodeId];
if (nextNode.action) {
  await performAction(nextNode.action, nextNode.action_config, session);
}

// 8. Send Printy's response
const printyMessage = {
  sender_role: 'printy',
  message_text_enc: encrypt(nextNode.message),
  metadata: { node_id: nextNodeId },
};
await saveMessage(printyMessage);
```

### User Clicks a Button

```typescript
// 1. User clicks "End Chat" button
const selectedOption = currentNode.options.find(opt => opt.label === userInput);

// 2. Move to the next node specified by the option
session.metadata.current_node_id = selectedOption.next;

// 3. Continue from step 6 above (update session, process node, send response)
```

---

## 🎨 Node Types

### `message` - Simple Message

Just shows a message with optional buttons.

```json
{
  "welcome": {
    "type": "message",
    "message": "Welcome! How can I help?",
    "options": [
      { "label": "Get Quote", "next": "quote_intro" },
      { "label": "Track Order", "next": "track_order" },
      { "label": "End Chat", "next": "end" }
    ]
  }
}
```

### `message` with Input - Collects User Data

Shows message and waits for user to type something.

```json
{
  "collect_details": {
    "type": "message",
    "message": "Please describe your issue in detail.",
    "expects_input": true,
    "input_config": {
      "store_as": "issue_details",
      "required": true,
      "validation": "min_length:10"
    },
    "next": "submit_ticket"
  }
}
```

**What happens:**

- User types: "My order arrived damaged..."
- System stores in `session.metadata.context.issue_details`
- System moves to `submit_ticket` node

### `action` - Does Something Special

Performs an action (create quote, submit ticket, etc.)

```json
{
  "create_ticket": {
    "type": "action",
    "message": "Creating your ticket...",
    "action": "create_inquiry",
    "action_config": {
      "type_key": "inquiry_type",
      "details_key": "issue_details",
      "show_inquiry_id": true
    },
    "options": [{ "label": "End Chat", "next": "end" }]
  }
}
```

### `end` - Conversation Over

Ends the conversation.

```json
{
  "end": {
    "type": "end",
    "message": "Thanks for chatting! Have a great day."
  }
}
```

**What happens:**

- Shows message
- Sets `session.status = 'ended'`
- Sets `session.ended_at = now()`

---

## ⚡ Available Actions

### `create_quote_conversation`

Creates a quote request in the quote system.

```json
{
  "action": "create_quote_conversation",
  "action_config": {
    "details_key": "quote_details", // Which context key has the description
    "show_display_id": true // Show quote ID to user
  }
}
```

**What it does:**

1. Takes text from `session.metadata.context.quote_details`
2. Creates row in `quote_conversations` table
3. Stores `quote_conversation_id` in `session.metadata`
4. Dual-writes subsequent messages to both systems

### `create_inquiry`

Creates a support ticket.

```json
{
  "action": "create_inquiry",
  "action_config": {
    "type_key": "inquiry_type", // quality, delivery, billing, other
    "details_key": "issue_details",
    "show_inquiry_id": true
  }
}
```

**What it does:**

1. Creates row in `inquiries` table
2. Stores `inquiry_id` in `session.metadata`
3. Shows ticket ID to user

### `upload_payment_proof`

Handles payment proof uploads.

```json
{
  "action": "upload_payment_proof",
  "action_config": {
    "order_id_key": "order_id",
    "allowed_formats": ["jpg", "png", "pdf"]
  }
}
```

### `send_admin_reply`

Admin replies to customer ticket.

```json
{
  "action": "send_admin_reply",
  "action_config": {
    "inquiry_id_key": "inquiry_id",
    "notify_customer": true
  }
}
```

### `ai_summarize_specs`

AI analyzes quote conversation (the small AI feature).

```json
{
  "action": "ai_summarize_specs",
  "action_config": {
    "conversation_id_key": "quote_conversation_id",
    "ai_model": "cohere"
  }
}
```

---

## 📦 Example: Complete Ask Quote Flow

```json
{
  "flow_id": "ask-quote",
  "title": "Request a Quote",
  "description": "Customer describes what they want printed",
  "initial_node": "intro",
  "nodes": {
    "intro": {
      "type": "message",
      "message": "Hi! I'm Printy. Let's get you a quote!\n\nPlease describe what you'd like printed:\n• Item type (cards, flyers, etc.)\n• Size and dimensions\n• Quantity needed\n• Materials or finishing\n• Your deadline\n\nThe more details, the better!",
      "expects_input": true,
      "input_config": {
        "store_as": "quote_details",
        "required": true,
        "validation": "min_length:20"
      },
      "next": "create_quote"
    },

    "create_quote": {
      "type": "action",
      "message": "Processing your quote request...",
      "action": "create_quote_conversation",
      "action_config": {
        "details_key": "quote_details",
        "show_display_id": true
      },
      "next": "quote_created"
    },

    "quote_created": {
      "type": "message",
      "message": "Your quote request has been submitted! Our team will review it and send you a proposal soon.\n\nYou can track your quote status in your dashboard.",
      "options": [{ "label": "End Chat", "next": "end" }]
    },

    "end": {
      "type": "end",
      "message": "Thanks for choosing Printy! Have a great day!"
    }
  }
}
```

---

## 🔐 Data Collection Points

### Customer Flows

| Flow             | What We Collect     | Stored As                   |
| ---------------- | ------------------- | --------------------------- |
| **Ask Quote**    | Product description | `context.quote_details`     |
| **Issue Ticket** | Problem description | `context.issue_details`     |
|                  | Issue type          | `context.inquiry_type`      |
|                  | Order ID (optional) | `context.order_id`          |
| **Payment**      | Payment proof file  | `context.payment_proof_url` |
|                  | Order ID            | `context.order_id`          |

### Admin Flows

| Flow                | What We Collect      | Stored As                            |
| ------------------- | -------------------- | ------------------------------------ |
| **Reply to Ticket** | Admin's reply text   | Sent directly, not stored in context |
| **Quote Proposal**  | Spec details & price | Sent to quote system                 |

---

## 💾 Message Storage

### All Messages Are Saved

**Customer message:**

```sql
INSERT INTO chat_messages_v2 (session_id, sender_role, message_text_enc, metadata)
VALUES (
  'session-uuid',
  'customer',
  encrypt('I need 100 business cards...'),
  '{"node_id": "intro"}'::jsonb
);
```

**Printy message:**

```sql
INSERT INTO chat_messages_v2 (session_id, sender_role, message_text_enc, metadata)
VALUES (
  'session-uuid',
  'printy',
  encrypt('Processing your quote request...'),
  '{"node_id": "create_quote"}'::jsonb
);
```

### Reading History

```sql
-- Get all messages for a conversation
SELECT
  message_id,
  sender_role,
  decrypt(message_text_enc) as message_text,
  sent_at,
  metadata->>'node_id' as node_id
FROM chat_messages_v2
WHERE session_id = 'session-uuid'
ORDER BY sent_at ASC;
```

---

## 🔄 Session Lifecycle

```
1. START
   ├─ Create session (status='active')
   ├─ Set current_node_id to initial_node
   └─ Show first Printy message

2. CONVERSATION
   ├─ User sends message → Save to chat_messages_v2
   ├─ Collect input if needed → Store in metadata.context
   ├─ Move to next node → Update metadata.current_node_id
   ├─ Run action if needed → perform_action()
   ├─ Show Printy response → Save to chat_messages_v2
   └─ Repeat

3. END
   ├─ Set status='ended'
   ├─ Set ended_at=now()
   └─ Show final message
```

---

## 🎯 Why This Is Better

### Old System (Current)

```
One flow = 3 tables × many rows

chat_flows:          1 row
chat_flow_nodes:     10 rows
chat_flow_options:   25 rows
------------------------
Total: 36 rows to manage
```

### New System (JSONB)

```
One flow = 1 table × 1 row

chat_flows_v2:       1 row (with complete JSONB)
------------------------
Total: 1 row to manage
```

### Benefits

✅ **Easier to understand** - See entire flow in one place  
✅ **Easier to edit** - Edit JSON, not SQL  
✅ **Version control friendly** - Flow is a single JSON document  
✅ **Faster queries** - One lookup instead of JOINs  
✅ **Simpler migrations** - Just update the JSONB  
✅ **Better for your use case** - You're prompt-based, not complex state machines

---

## 🚀 Next Steps

1. **Create the v2 tables** (test in separate branch)
2. **Migrate one flow** (start with ask-quote)
3. **Test thoroughly** with real users
4. **Migrate other flows** one by one
5. **Compare performance** and developer experience
6. **Decide** whether to fully switch or keep both systems

---

## 📚 Quick Reference

### Adding a New Flow

1. Create JSON definition
2. Insert into `chat_flows_v2`
3. That's it! Flow is ready to use

### Editing a Flow

1. Update the JSONB in `chat_flows_v2`
2. That's it! Changes are live

### Reading a Conversation

1. Get session from `chat_sessions_v2`
2. Get all messages from `chat_messages_v2` where `session_id` matches
3. Decrypt and display in order

### Simple. Clean. Maintainable. 🎉
