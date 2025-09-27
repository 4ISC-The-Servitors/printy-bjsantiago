import type { FlowState } from '../../shared/FlowState';
import type { FlowContext } from '../../shared/FlowContext';
import type { NodeHandler } from '../../shared/NodeHandler';
import { formatPriceInput, isValidPriceInput } from '../../../../utils/shared';

export interface CreateQuoteNodeArgs {
  getCurrentOrder: (state: FlowState, context: FlowContext) => any | null;
  updateOrder: (
    id: string,
    updates: Partial<any>,
    state: FlowState,
    context: FlowContext
  ) => void;
  nextNodeId?: string; // defaults to 'action'
}

export function createQuotePriceNode({
  getCurrentOrder,
  updateOrder,
  nextNodeId = 'action',
}: CreateQuoteNodeArgs): NodeHandler {
  return {
    messages: (state, context) => {
      const order = getCurrentOrder(state, context);
      if (!order) return [{ role: 'printy', text: 'Order not found.' }];
      return [
        {
          role: 'printy',
          text: `Creating quote for ${order.id} (${order.customer}).`,
        },
        {
          role: 'printy',
          text: 'Please enter the quote amount (e.g., 3800, 3,800, or ₱3,800).',
        },
      ];
    },
    quickReplies: () => ['End Chat'],
    handleInput: (input, state, context) => {
      const order = getCurrentOrder(state, context);
      if (!order) {
        return {
          messages: [{ role: 'printy', text: 'Order not found.' }],
          quickReplies: ['End Chat'],
        };
      }

      const valid = isValidPriceInput(input) || /\d/.test(input);
      if (!valid) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please enter a valid price amount (e.g., 3800, 3,800, or ₱3,800).',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }

      const formatted = formatPriceInput(input);
      updateOrder(
        order.id,
        { status: 'Pending', total: formatted },
        state,
        context
      );
      return {
        nextNodeId,
        messages: [
          {
            role: 'printy',
            text: `📋 Quote created for ${order.id}. Set to Pending with total ${formatted}.`,
          },
        ],
      };
    },
  };
}
