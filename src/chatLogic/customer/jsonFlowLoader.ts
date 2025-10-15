/**
 * JSON Flow Loader
 * Loads and initializes JSON-based chat flows
 */
import type { JsonFlowDefinition } from '../../types/jsonFlow';
import { JsonFlowDriver } from '../../features/chat/core/adapters/JsonFlowDriver';
import type { ChatFlow } from '../../types/chatFlow';

// Import JSON flow definitions
import trackTicketFlowDef from './flows/track-ticket.json';
import issueTicketFlowDef from './flows/issue-ticket.json';

// Registry of JSON flows
const JSON_FLOW_DEFINITIONS: Record<string, JsonFlowDefinition> = {
  'track-ticket': trackTicketFlowDef as JsonFlowDefinition,
  'issue-ticket': issueTicketFlowDef as JsonFlowDefinition,
};

/**
 * Converts a JsonFlowDriver to the legacy ChatFlow interface
 * This allows JSON flows to work with existing UI components
 */
function wrapJsonFlowDriver(driver: JsonFlowDriver): ChatFlow {
  return {
    id: driver.id,
    title: JSON_FLOW_DEFINITIONS[driver.id]?.title || driver.id,

    initial: async (ctx) => {
      const messages = await driver.initial(ctx);
      return messages.map(m => ({ role: 'printy' as const, text: m.text }));
    },

    quickReplies: async (ctx) => {
      // Get current node's quick replies
      const flowDef = JSON_FLOW_DEFINITIONS[driver.id];
      const currentNodeId = (driver as any).currentNodeId || flowDef.initialNode;
      const currentNode = flowDef.nodes[currentNodeId];
      return currentNode.quickReplies || [];
    },

    respond: async (ctx, input) => {
      const result = await driver.respond(ctx, input);
      return {
        messages: result.messages.map(m => ({
          role: 'printy' as const,
          text: m.text,
        })),
        quickReplies: result.quickReplies,
      };
    },
  };
}

/**
 * Load a JSON flow by ID
 */
export function loadJsonFlow(flowId: string): ChatFlow | null {
  const flowDef = JSON_FLOW_DEFINITIONS[flowId];

  if (!flowDef) {
    return null;
  }

  const driver = new JsonFlowDriver(flowDef);
  return wrapJsonFlowDriver(driver);
}

/**
 * Check if a flow ID is a JSON flow
 */
export function isJsonFlow(flowId: string): boolean {
  return flowId in JSON_FLOW_DEFINITIONS;
}

/**
 * Get all available JSON flow IDs
 */
export function getJsonFlowIds(): string[] {
  return Object.keys(JSON_FLOW_DEFINITIONS);
}

/**
 * Load all JSON flows as ChatFlow objects
 */
export function loadAllJsonFlows(): Record<string, ChatFlow> {
  const flows: Record<string, ChatFlow> = {};

  for (const flowId of Object.keys(JSON_FLOW_DEFINITIONS)) {
    const flow = loadJsonFlow(flowId);
    if (flow) {
      flows[flowId] = flow;
    }
  }

  return flows;
}
