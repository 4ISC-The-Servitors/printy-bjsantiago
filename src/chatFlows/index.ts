/**
 * Chat Flows - JSONB Flow System
 *
 * NOTE: This static registry is NO LONGER USED in the runtime system.
 * Flows are now fetched directly from the database (chat_flows_v2 table)
 * using getFlowDefinition() from src/features/api/jsonbChatFlowApi.ts
 *
 * The individual flow files (askQuoteFlow.ts, etc.) serve as:
 * - Documentation of flow structure
 * - Blueprints for database inserts
 * - Reference for flow design
 *
 * See: docs_guide/JSONB_CHAT_FLOW_SYSTEM.md for complete documentation
 */

// Types are still exported for TypeScript type checking
export * from './types';

/*
// COMMENTED OUT - Using database-fetched flows instead
// Customer Flows
export * from './customer';

// Admin Flows
export * from './admin';

import { customerFlows, getCustomerFlow, getCustomerFlowIds } from './customer';
import { adminFlows, getAdminFlow, getAdminFlowIds } from './admin';
import type { FlowDefinition } from './types';

export const allFlows: Record<string, FlowDefinition> = {
  ...customerFlows,
  ...adminFlows,
};

export function getFlow(flowId: string): FlowDefinition | undefined {
  return allFlows[flowId];
}

export function getAllFlowIds(): string[] {
  return Object.keys(allFlows);
}

export function flowExists(flowId: string): boolean {
  return flowId in allFlows;
}

export const flows = {
  customer: {
    all: customerFlows,
    get: getCustomerFlow,
    ids: getCustomerFlowIds,
  },
  admin: {
    all: adminFlows,
    get: getAdminFlow,
    ids: getAdminFlowIds,
  },
  get: getFlow,
  exists: flowExists,
  allIds: getAllFlowIds,
};
*/
