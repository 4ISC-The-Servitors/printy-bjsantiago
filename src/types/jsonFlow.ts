// JSON Flow Type Definitions

export interface JsonFlowDefinition {
  id: string;
  title: string;
  version: string;
  roles: ('guest' | 'customer' | 'admin')[];

  initialNode: string;
  nodes: Record<string, JsonNode>;
}

export interface JsonNode {
  id: string;
  type: 'message' | 'input' | 'action' | 'end';

  // Display content
  messages: string[];
  quickReplies?: string[];

  // Behavior
  action?: NodeAction;
  transitions: Transition[];
}

export interface NodeAction {
  type: string;
  config?: Record<string, any>;
}

export interface Transition {
  label?: string;  // If present, matches user selection
  condition?: TransitionCondition;  // If present, evaluated programmatically
  targetNode: string;
}

export interface TransitionCondition {
  type: 'equals' | 'contains' | 'regex' | 'action_result';
  value?: string;
  field?: string;
}

export interface FlowContext {
  sessionId?: string;
  user_input?: string;
  lastActionResult?: string;
  [key: string]: any;
}

export interface ActionResult {
  status: string;  // 'success', 'error', 'found', 'not_found', etc.
  messages?: string[];  // Additional messages to display
  context?: Record<string, any>;  // Context updates
}
