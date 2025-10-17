/**
 * Shared types for JsonbFlowProcessor
 */

import type { ActionNode, SessionContext } from '@features/chat/types';

export interface FlowExecutionResult {
  messages: Array<{
    id: string;
    role: 'customer' | 'admin' | 'printy';
    text: string;
    ts: number;
  }>;
  quickReplies: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  sessionId: string;
  currentNodeId: string;
}

export interface ActionExecutionParams {
  actionNode: ActionNode;
  sessionId: string;
  customerId: string;
  context: SessionContext;
}

export interface ActionExecutionResult {
  messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }>;
}

export type ActionHandler = (
  params: ActionExecutionParams
) => Promise<ActionExecutionResult>;
