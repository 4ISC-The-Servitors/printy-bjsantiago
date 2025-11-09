// Unified Flow & Session Types (moved from legacy src/chatFlows/types)

export type NodeType = 'message' | 'action' | 'conditional' | 'end';
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
  | 'send_admin_reply'
  | 'ai_summarize_specs'
  | 'display_quote_details'
  | 'display_quote_details_admin'
  | 'accept_quote_proposal'
  | 'reject_quote_proposal'
  | 'send_quote_proposal'
  | 'manual_order_specs'
  | 'edit_saved_specs'
  | 'check_existing_specs'
  | 'dynamic_choose_action'
  | 'create_order'
  | 'check_accepted_quote'
  | 'display_accepted_proposal'
  | 'display_quote_price'
  | 'display_quoted_price'
  | 'show_quote_decision_prompt'
  | 'display_order_payment_info'
  | 'display_payment_methods'
  | 'process_payment_proof_upload'
  | 'reupload_payment_proof'
  | 'cancel_order'
  | 'fetch_denial_reason'
  | 'show_customer_orders'
  | 'display_service_categories'
  | 'display_services_by_category';

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

export interface DisplayQuoteDetailsAdminConfig {
  conversation_id_key: string;
}

export interface SendQuoteProposalConfig {
  conversation_id_key: string;
}

export interface ManualOrderSpecsConfig {
  conversation_id_key: string;
}

export interface EditSavedSpecsConfig {
  conversation_id_key: string;
}

export interface CheckExistingSpecsConfig {
  conversation_id_key: string;
}

export interface DynamicChooseActionConfig {
  conversation_id_key: string;
}

export interface CreateOrderConfig {
  conversation_id_key: string;
}

export interface CheckAcceptedQuoteConfig {
  conversation_id_key: string;
}

export interface DisplayAcceptedProposalConfig {
  conversation_id_key: string;
}

export interface DisplayQuotePriceConfig {
  conversation_id_key: string;
}

export interface DisplayQuotedPriceConfig {
  conversation_id_key: string;
}

export interface ShowQuoteDecisionPromptConfig {
  conversation_id_key: string;
}

export interface DisplayOrderPaymentInfoConfig {
  order_id_key: string;
}

export interface DisplayPaymentMethodsConfig {
  // No specific config needed - will fetch all active payment methods
}

export interface ProcessPaymentProofUploadConfig {
  order_id_key: string;
}

export interface ReuploadPaymentProofConfig {
  order_id_key: string;
  file_key?: string;
}

export interface CancelOrderConfig {
  order_id_key: string;
  reason_key: string;
}

export interface FetchDenialReasonConfig {
  order_id_key: string;
}

export type ActionConfig =
  | CreateQuoteConversationConfig
  | CreateInquiryConfig
  | SendAdminReplyConfig
  | AiSummarizeSpecsConfig
  | DisplayQuoteDetailsConfig
  | DisplayQuoteDetailsAdminConfig
  | AcceptQuoteProposalConfig
  | RejectQuoteProposalConfig
  | SendQuoteProposalConfig
  | ManualOrderSpecsConfig
  | EditSavedSpecsConfig
  | CheckExistingSpecsConfig
  | DynamicChooseActionConfig
  | CreateOrderConfig
  | CheckAcceptedQuoteConfig
  | DisplayAcceptedProposalConfig
  | DisplayQuotePriceConfig
  | DisplayQuotedPriceConfig
  | ShowQuoteDecisionPromptConfig
  | DisplayOrderPaymentInfoConfig
  | DisplayPaymentMethodsConfig
  | ProcessPaymentProofUploadConfig
  | ReuploadPaymentProofConfig
  | CancelOrderConfig
  | FetchDenialReasonConfig;

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

export interface ConditionalNode extends BaseNode {
  type: 'conditional';
  condition: string;
  cases: Record<string, string>;
  default?: string; // Default case when no matching case is found
}

export interface EndNode extends BaseNode {
  type: 'end';
}

export type FlowNode = MessageNode | ActionNode | ConditionalNode | EndNode;

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
