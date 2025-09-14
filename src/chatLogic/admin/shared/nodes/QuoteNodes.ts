// Quote creation node handlers

import type { FlowState } from '../FlowState';
import type { FlowContext } from '../FlowContext';
import type { NodeHandler } from '../NodeHandler';
import { createQuoteCreatedMessage } from '../utils/MessageBuilders';
import { formatPriceInput, isValidPriceInput } from '../../../../utils/shared';

export function createQuotePriceNode(
  getCurrentItem: (state: FlowState, context: FlowContext) => any,
  updateItem: (
    id: string,
    updates: Partial<any>,
    state: FlowState,
    context: FlowContext
  ) => void,
  getNextNode: (state: FlowState, context: FlowContext) => string
): NodeHandler {
  return {
    messages: (state, context) => {
      const item = getCurrentItem(state, context);
      if (!item) return [{ role: 'printy', text: 'Item not found.' }];
      return [
        {
          role: 'printy',
          text: `Creating quote for ${item.id} (${item.customer || item.name}).`,
        },
        {
          role: 'printy',
          text: 'Please enter the quote amount (e.g., 3800, 3,800, or ₱3,800).',
        },
      ];
    },
    quickReplies: () => ['End Chat'],
    handleInput: (input, state, context) => {
      const item = getCurrentItem(state, context);
      if (!item) {
        return {
          messages: [{ role: 'printy', text: 'Item not found.' }],
          quickReplies: ['End Chat'],
        };
      }

      const priceValid = isValidPriceInput(input) || /\d/.test(input);
      if (!priceValid) {
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
      updateItem(
        item.id,
        { status: 'Pending', total: formatted },
        state,
        context
      );

      return {
        nextNodeId: getNextNode(state, context),
        messages: [createQuoteCreatedMessage(item.id, formatted)],
      };
    },
  };
}

export function createChooseQuoteTargetNode(
  getRemainingItems: (state: FlowState, context: FlowContext) => any[],
  getNextNode: (state: FlowState, context: FlowContext) => string
): NodeHandler {
  return {
    messages: (state, context) => {
      const remaining = getRemainingItems(state, context);
      return [
        {
          role: 'printy',
          text: `Which item would you like to create a quote for? (${remaining.length} remaining)`,
        },
      ];
    },
    quickReplies: (state, context) => {
      const remaining = getRemainingItems(state, context);
      return remaining.map(item => item.id).concat(['End Chat']);
    },
    handleInput: (input, state, context) => {
      const remaining = getRemainingItems(state, context);
      const selectedId = remaining.find(
        item =>
          item.id.toLowerCase() === input.toLowerCase() ||
          item.name?.toLowerCase().includes(input.toLowerCase())
      )?.id;

      if (!selectedId || !remaining.find(item => item.id === selectedId)) {
        return {
          messages: [
            { role: 'printy', text: 'Please pick one of the selected items.' },
          ],
          quickReplies: remaining.map(item => item.id).concat(['End Chat']),
        };
      }

      return {
        nextNodeId: getNextNode(state, context),
        stateUpdates: { currentTargetId: selectedId },
      };
    },
  };
}
