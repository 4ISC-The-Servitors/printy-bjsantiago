// Unified Flow & Session Types (moved from legacy src/chatFlows/types)

export type NodeType = 'message' | 'action' | 'end';
export type SenderRole = 'customer' | 'admin' | 'printy';

// Input configuration for message nodes expecting text input
export interface InputConfig {
  store_as: string;
  required?: boolean;
  validation?: string;
}

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
  details_key: string;
  show_display_id?: boolean;
}

export interface CreateInquiryConfig {
  type_key: string;
  details_key: string;
  show_inquiry_id?: boolean;
  order_id_key?: string;
}

export interface UploadPaymentProofConfig {
  order_id_key: string;
  allowed_formats?: string[];
  file_key?: string;
}

export interface SendAdminReplyConfig {
  inquiry_id_key: string;
  notify_customer?: boolean;
}

export interface AiSummarizeSpecsConfig {
  conversation_id_key: string;
  ai_model?: 'cohere' | 'openai';
}

export interface DisplayQuoteDetailsConfig {
  conversation_id_key: string;
}

export interface AcceptQuoteProposalConfig {
  conversation_id_key: string;
}

export interface RejectQuoteProposalConfig {
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

export interface FlowOption {
  label: string;
  next: string;
  value?: string;
  store_as?: string;
}

export interface BaseNode {
  type: NodeType;
  message: string | any; // tolerate legacy bad message types
}

export interface MessageNode extends BaseNode {
  type: 'message';
  expects_input?: boolean;
  input_config?: InputConfig;
  next?: string;
  options?: FlowOption[];
}

export interface ActionNode extends BaseNode {
  type: 'action';
  action: ActionType;
  action_config: ActionConfig;
  next?: string;
  options?: FlowOption[];
}

export interface EndNode extends BaseNode {
  type: 'end';
}

export type FlowNode = MessageNode | ActionNode | EndNode;

export interface FlowDefinition {
  flow_id: string;
  title: string;
  description: string;
  initial_node: string;
  nodes: Record<string, FlowNode>;
  owner?: 'customer' | 'admin' | 'guest';
}

export interface SessionContext {
  [key: string]: any;
  quote_details?: string;
  order_id?: string;
  inquiry_type?: 'quality' | 'delivery' | 'billing' | 'other';
  issue_details?: string;
  payment_proof_url?: string;
}

export interface SessionMetadata {
  current_node_id: string;
  context: SessionContext;
  quote_conversation_id?: string;
  inquiry_id?: string;
}
