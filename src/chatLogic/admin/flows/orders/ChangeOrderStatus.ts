import type { FlowState } from '../../shared/FlowState';
import type { FlowContext } from '../../shared/FlowContext';
import type { NodeHandler } from '../../shared/NodeHandler';

export interface CreateStatusNodeArgs {
  getCurrentOrder: (state: FlowState, context: FlowContext) => any | null;
  updateOrder: (
    id: string,
    updates: Partial<any>,
    state: FlowState,
    context: FlowContext
  ) => void;
  getStatusOptions: (state: FlowState, context: FlowContext) => string[];
  normalizeStatus: (input: string) => string | null;
  nextNodeId?: string; // defaults to 'action'
}

export function createStatusChangeNode({
  getCurrentOrder,
  updateOrder,
  getStatusOptions,
  normalizeStatus,
  nextNodeId = 'action',
}: CreateStatusNodeArgs): NodeHandler {
  return {
    messages: (state, context) => {
      const order = getCurrentOrder(state, context);
      if (!order) return [{ role: 'printy', text: 'Order not found.' }];
      return [
        {
          role: 'printy',
          text: `What status would you like to set for ${order.id}?`,
        },
      ];
    },
    quickReplies: (state, context) => [
      ...getStatusOptions(state, context),
      'End Chat',
    ],
    handleInput: (input, state, context) => {
      const order = getCurrentOrder(state, context);
      if (!order) {
        return {
          messages: [{ role: 'printy', text: 'Order not found.' }],
          quickReplies: ['End Chat'],
        };
      }

      const next = normalizeStatus(input);
      if (!next) {
        const options = getStatusOptions(state, context);
        return {
          messages: [
            {
              role: 'printy',
              text: `Valid statuses: ${options.join(', ')}`,
            },
          ],
          quickReplies: [...options, 'End Chat'],
        };
      }

      const prev = order.status;
      updateOrder(order.id, { status: next }, state, context);
      return {
        nextNodeId,
        messages: [
          { role: 'printy', text: `✅ ${order.id}: ${prev} → ${next}` },
        ],
      };
    },
  };
}


