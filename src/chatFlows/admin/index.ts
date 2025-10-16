/**
 * Admin Chat Flows
 * JSONB-based flow definitions for admin-facing conversations
 */

export { replyTicketFlow } from './replyTicketFlow';
export { sendQuoteProposalFlow } from './sendQuoteProposalFlow';
export { default as quoteProposeFlowJson } from './quoteProposeFlow.json';

import { replyTicketFlow } from './replyTicketFlow';
import { sendQuoteProposalFlow } from './sendQuoteProposalFlow';
import quoteProposeFlowJson from './quoteProposeFlow.json' assert { type: 'json' };
import type { FlowDefinition } from '../types';

/**
 * Map of all admin flows by flow_id
 */
export const adminFlows: Record<string, FlowDefinition> = {
  [replyTicketFlow.flow_id]: replyTicketFlow,
  [sendQuoteProposalFlow.flow_id]: sendQuoteProposalFlow,
  [quoteProposeFlowJson.flow_id]: quoteProposeFlowJson as unknown as FlowDefinition,
};

/**
 * Get an admin flow by ID
 */
export function getAdminFlow(flowId: string): FlowDefinition | undefined {
  return adminFlows[flowId];
}

/**
 * Get all admin flow IDs
 */
export function getAdminFlowIds(): string[] {
  return Object.keys(adminFlows);
}
