// Status change node handlers for all flows

import type { BotMessage } from '../../../../types/chatFlow';
import type { FlowState } from '../FlowState';
import type { FlowContext } from '../FlowContext';
import type { NodeHandler } from '../NodeHandler';
import {
  normalizeOrderStatus,
  normalizeServiceStatus,
  normalizeTicketStatus,
} from '../utils/StatusNormalizers';
import { createStatusChangeMessage } from '../utils/MessageBuilders';

export function createStatusChangeNode(
  statusType: 'order' | 'service' | 'ticket',
  getCurrentItem: (state: FlowState, context: FlowContext) => any,
  updateItem: (
    id: string,
    updates: Partial<any>,
    state: FlowState,
    context: FlowContext
  ) => void,
  getNextNode: (state: FlowState, context: FlowContext) => string,
  getStatusOptions: (state: FlowState, context: FlowContext) => string[]
): NodeHandler {
  return {
    messages: (state, context) => {
      const item = getCurrentItem(state, context);
      if (!item) return [{ role: 'printy', text: 'Item not found.' }];
      return [
        {
          role: 'printy',
          text: `What status would you like to set for ${item.id}?`,
        },
      ];
    },
    quickReplies: (state, context) => {
      return [...getStatusOptions(state, context), 'End Chat'];
    },
    handleInput: (input, state, context) => {
      const item = getCurrentItem(state, context);
      if (!item) {
        return {
          messages: [{ role: 'printy', text: 'Item not found.' }],
          quickReplies: ['End Chat'],
        };
      }

      let newStatus: string | null = null;
      switch (statusType) {
        case 'order':
          newStatus = normalizeOrderStatus(input);
          break;
        case 'service':
          newStatus = normalizeServiceStatus(input);
          break;
        case 'ticket':
          newStatus = normalizeTicketStatus(input);
          break;
      }

      if (!newStatus) {
        const options = getStatusOptions(state, context);
        return {
          messages: [
            { role: 'printy', text: `Valid statuses: ${options.join(', ')}` },
          ],
          quickReplies: [...options, 'End Chat'],
        };
      }

      const prevStatus = item.status;
      updateItem(item.id, { status: newStatus }, state, context);

      return {
        nextNodeId: getNextNode(state, context),
        messages: [createStatusChangeMessage(item.id, prevStatus, newStatus)],
      };
    },
  };
}

export function createBulkStatusChangeNode(
  statusType: 'order' | 'service' | 'ticket',
  getSelectedItems: (state: FlowState, context: FlowContext) => any[],
  updateItem: (
    id: string,
    updates: Partial<any>,
    state: FlowState,
    context: FlowContext
  ) => void,
  getNextNode: (state: FlowState, context: FlowContext) => string,
  getStatusOptions: (state: FlowState, context: FlowContext) => string[]
): NodeHandler {
  return {
    messages: (_state, _context) => {
      return [
        {
          role: 'printy',
          text: `Okay, apply one status to all selected. What status?`,
        },
      ];
    },
    quickReplies: (state, context) => {
      return [...getStatusOptions(state, context), 'End Chat'];
    },
    handleInput: (input, state, context) => {
      const selected = getSelectedItems(state, context);
      let newStatus: string | null = null;

      switch (statusType) {
        case 'order':
          newStatus = normalizeOrderStatus(input);
          break;
        case 'service':
          newStatus = normalizeServiceStatus(input);
          break;
        case 'ticket':
          newStatus = normalizeTicketStatus(input);
          break;
      }

      if (!newStatus) {
        const options = getStatusOptions(state, context);
        return {
          messages: [
            { role: 'printy', text: `Valid statuses: ${options.join(', ')}` },
          ],
          quickReplies: [...options, 'End Chat'],
        };
      }

      const msgs: BotMessage[] = [
        {
          role: 'printy',
          text: `✅ Applying ${newStatus} to ${selected.length} item(s):`,
        },
      ];

      selected.forEach(item => {
        const prevStatus = item.status;
        updateItem(item.id, { status: newStatus }, state, context);
        msgs.push({
          role: 'printy',
          text: `${item.id}: ${prevStatus} → ${newStatus}`,
        });
      });

      return {
        nextNodeId: getNextNode(state, context),
        messages: msgs,
      };
    },
  };
}
