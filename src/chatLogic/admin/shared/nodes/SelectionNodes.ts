// Selection node handlers for choosing items from lists

import type { BotMessage } from '../../../../types/chatFlow';
import type { FlowState } from '../FlowState';
import type { FlowContext } from '../FlowContext';
import type { NodeHandler } from '../NodeHandler';
import { extractIds } from '../utils/IdExtractors';
import { createSelectionListMessage } from '../utils/MessageBuilders';

export interface SelectionItem {
  id: string;
  name: string;
  status: string;
  category?: string;
}

export function createChooseItemNode(
  itemType: 'order' | 'service' | 'ticket',
  getRemainingItems: (state: FlowState, context: FlowContext) => SelectionItem[]
): NodeHandler {
  return {
    messages: (state, context) => {
      const remaining = getRemainingItems(state, context);
      const msgs: BotMessage[] = [
        {
          role: 'printy',
          text: `Which ${itemType} would you like to work on first? (${remaining.length} remaining)`,
        },
      ];
      return msgs;
    },
    quickReplies: (state, context) => {
      const remaining = getRemainingItems(state, context);
      return remaining
        .map(item => `${item.id} - ${item.name}`)
        .concat(['End Chat']);
    },
    handleInput: (input, state, context) => {
      const remaining = getRemainingItems(state, context);
      const ids = extractIds(input, itemType);
      const selectedId =
        ids[0] ||
        remaining.find(
          item =>
            item.id.toLowerCase() === input.toLowerCase() ||
            item.name.toLowerCase().includes(input.toLowerCase())
        )?.id;

      if (!selectedId || !remaining.find(item => item.id === selectedId)) {
        return {
          messages: [
            {
              role: 'printy',
              text: `Please pick one of the selected ${itemType}s.`,
            },
          ],
          quickReplies: remaining
            .map(item => `${item.id} - ${item.name}`)
            .concat(['End Chat']),
        };
      }

      return {
        nextNodeId: 'edit_item', // This will be overridden by specific flows
        stateUpdates: { currentItemId: selectedId },
      };
    },
  };
}

export function createMultiStartNode(
  itemType: 'order' | 'service' | 'ticket',
  getSelectedItems: (state: FlowState, context: FlowContext) => SelectionItem[]
): NodeHandler {
  return {
    messages: (state, context) => {
      const selected = getSelectedItems(state, context);
      const msgs: BotMessage[] = [
        {
          role: 'printy',
          text: `Multiple ${itemType}s assistant ready (${selected.length} selected).`,
        },
        { role: 'printy', text: 'You selected:' },
      ];
      msgs.push(...createSelectionListMessage(selected, itemType));
      msgs.push({
        role: 'printy',
        text: `What do you want to do with these ${itemType}s?`,
      });
      return msgs;
    },
    quickReplies: () => ['Change Status', 'Create Quote', 'End Chat'], // This will be overridden by specific flows
  };
}
