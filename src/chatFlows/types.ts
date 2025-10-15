/**
 * JSONB Chat Flow System - TypeScript Definitions
 * Based on: docs_guide/JSONB_CHAT_FLOW_SYSTEM.md
 */

// ============================================================================
// Node Types
// ============================================================================

export type NodeType = 'message' | 'action' | 'end';

export type SenderRole = 'customer' | 'admin' | 'printy';

// ============================================================================
// Input Configuration
// ============================================================================

export interface InputConfig {
  /** Key name to store user input in session.metadata.context */
  store_as: string;

  /** Whether input is required */
  required?: boolean;

  /** Validation rule (e.g., "min_length:10") */
  validation?: string;
}

// ============================================================================
// Action Configuration
// ============================================================================

export type ActionType =
  | 'create_quote_conversation'
  | 'create_inquiry'
  | 'verify_order'
  | 'upload_payment_proof'
  | 'send_admin_reply'
  | 'ai_summarize_specs'
  | 'display_quote_details'
  | 'accept_quote_proposal'
  | 'reject_quote_proposal';

export interface CreateQuoteConversationConfig {
  /** Which context key has the quote description */
  details_key: string;

  /** Show quote ID to user after creation */
  show_display_id?: boolean;
}

export interface CreateInquiryConfig {
  /** Which context key has the inquiry type */
  type_key: string;

  /** Which context key has the issue details */
  details_key: string;

  /** Show ticket ID to user after creation */
  show_inquiry_id?: boolean;

  /** Optional order ID key for order-related issues */
  order_id_key?: string;
}

export interface UploadPaymentProofConfig {
  /** Which context key has the order ID */
  order_id_key: string;

  /** Allowed file formats */
  allowed_formats?: string[];

  /** Which context key has the uploaded file reference */
  file_key?: string;
}

export interface SendAdminReplyConfig {
  /** Which context key has the inquiry ID */
  inquiry_id_key: string;

  /** Send notification to customer */
  notify_customer?: boolean;
}

export interface AiSummarizeSpecsConfig {
  /** Which context key has the conversation ID */
  conversation_id_key: string;

  /** AI model to use */
  ai_model?: 'cohere' | 'openai';
}

export interface DisplayQuoteDetailsConfig {
  /** Which context key has the conversation ID */
  conversation_id_key: string;
}

export interface AcceptQuoteProposalConfig {
  /** Which context key has the conversation ID */
  conversation_id_key: string;
}

export interface RejectQuoteProposalConfig {
  /** Which context key has the conversation ID */
  conversation_id_key: string;
}

export type ActionConfig =
  | CreateQuoteConversationConfig
  | CreateInquiryConfig
  | UploadPaymentProofConfig
  | SendAdminReplyConfig
  | AiSummarizeSpecsConfig
  | DisplayQuoteDetailsConfig
  | AcceptQuoteProposalConfig
  | RejectQuoteProposalConfig;

// ============================================================================
// Option (Button)
// ============================================================================

export interface FlowOption {
  /** Button label shown to user */
  label: string;

  /** Next node ID to navigate to */
  next: string;

  /** Optional value to store when clicked */
  value?: string;

  /** Optional context key to store value in */
  store_as?: string;
}

// ============================================================================
// Node Definitions
// ============================================================================

export interface BaseNode {
  /** Node type */
  type: NodeType;

  /** Message to show (Printy's message) */
  message: string;
}

export interface MessageNode extends BaseNode {
  type: 'message';

  /** Whether this node expects user text input */
  expects_input?: boolean;

  /** Input configuration (if expects_input is true) */
  input_config?: InputConfig;

  /** Next node to navigate to after user input */
  next?: string;

  /** Options (buttons) to show to user */
  options?: FlowOption[];
}

export interface ActionNode extends BaseNode {
  type: 'action';

  /** Action to perform */
  action: ActionType;

  /** Action-specific configuration */
  action_config: ActionConfig;

  /** Next node to navigate to after action */
  next?: string;

  /** Options (buttons) to show after action */
  options?: FlowOption[];
}

export interface EndNode extends BaseNode {
  type: 'end';
  // No additional properties - ends the conversation
}

export type FlowNode = MessageNode | ActionNode | EndNode;

// ============================================================================
// Flow Definition
// ============================================================================

export interface FlowDefinition {
  /** Unique flow identifier */
  flow_id: string;

  /** Human-readable title */
  title: string;

  /** Flow description */
  description: string;

  /** Initial node ID to start the flow */
  initial_node: string;

  /** Map of node_id to node definition */
  nodes: Record<string, FlowNode>;
}

// ============================================================================
// Session Metadata
// ============================================================================

export interface SessionContext {
  /** Collected data from user inputs */
  [key: string]: any;

  // Common context keys:
  quote_details?: string;
  order_id?: string;
  inquiry_type?: 'quality' | 'delivery' | 'billing' | 'other';
  issue_details?: string;
  payment_proof_url?: string;
}

export interface SessionMetadata {
  /** Current node ID in the flow */
  current_node_id: string;

  /** Context data collected during the conversation */
  context: SessionContext;

  /** Quote conversation ID (if created) */
  quote_conversation_id?: string;

  /** Inquiry ID (if created) */
  inquiry_id?: string;
}

// ============================================================================
// Database Types (for reference)
// ============================================================================

export interface ChatSession {
  session_id: string;
  flow_id: string;
  customer_id: string;
  status: 'active' | 'ended';
  created_at: string;
  ended_at?: string;
  metadata: SessionMetadata;
}

export interface ChatMessage {
  message_id: string;
  session_id: string;
  sender_role: SenderRole;
  message_text_enc: Uint8Array; // Encrypted
  sent_at: string;
  metadata: {
    node_id?: string;
    has_attachment?: boolean;
    attachment_url?: string;
    [key: string]: any;
  };
}

export interface ChatFlow {
  flow_id: string;
  flow_definition: FlowDefinition;
  active: boolean;
  created_at: string;
  updated_at: string;
}
