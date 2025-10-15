/**
 * Customer Chat Flows
 * JSONB-based flow definitions for customer-facing conversations
 */

export { askQuoteFlow } from './askQuoteFlow';
export { issueTicketFlow } from './issueTicketFlow';
export { trackOrderFlow } from './trackOrderFlow';
export { uploadPaymentFlow } from './uploadPaymentFlow';

import { askQuoteFlow } from './askQuoteFlow';
import { issueTicketFlow } from './issueTicketFlow';
import { trackOrderFlow } from './trackOrderFlow';
import { uploadPaymentFlow } from './uploadPaymentFlow';
import type { FlowDefinition } from '../types';

/**
 * Map of all customer flows by flow_id
 */
export const customerFlows: Record<string, FlowDefinition> = {
  [askQuoteFlow.flow_id]: askQuoteFlow,
  [issueTicketFlow.flow_id]: issueTicketFlow,
  [trackOrderFlow.flow_id]: trackOrderFlow,
  [uploadPaymentFlow.flow_id]: uploadPaymentFlow,
};

/**
 * Get a customer flow by ID
 */
export function getCustomerFlow(flowId: string): FlowDefinition | undefined {
  return customerFlows[flowId];
}

/**
 * Get all customer flow IDs
 */
export function getCustomerFlowIds(): string[] {
  return Object.keys(customerFlows);
}
