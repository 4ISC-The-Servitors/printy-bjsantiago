// Edit node handlers for modifying item properties

import type { BotMessage } from '../../../types/chatFlow';
import type { FlowState } from '../FlowState';
import type { FlowContext } from '../FlowContext';
import type { NodeHandler } from '../NodeHandler';
import {
  isValidTextInput,
  isValidServiceName,
  isValidCategory,
  isValidTicketReply,
} from '../utils/InputValidators';
import {
  createServiceUpdatedMessage,
  createTicketReplyMessage,
} from '../utils/MessageBuilders';

export function createEditNameNode(
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
          text: `Current name: ${item.name}. What should the new name be?`,
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

      const newName = input.trim();
      if (!isValidServiceName(newName)) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please provide a valid name for the service.',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }

      const oldName = item.name;
      updateItem(item.id, { name: newName }, state, context);

      return {
        nextNodeId: getNextNode(state, context),
        messages: [
          createServiceUpdatedMessage(
            item.code || item.id,
            'name',
            oldName,
            newName
          ),
        ],
      };
    },
  };
}

export function createEditCategoryNode(
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
          text: `Current category: ${item.category}. What should the new category be?`,
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

      const newCategory = input.trim();
      if (!isValidCategory(newCategory)) {
        return {
          messages: [
            {
              role: 'printy',
              text: 'Please provide a valid category for the service.',
            },
          ],
          quickReplies: ['End Chat'],
        };
      }

      const oldCategory = item.category;
      updateItem(item.id, { category: newCategory }, state, context);

      return {
        nextNodeId: getNextNode(state, context),
        messages: [
          createServiceUpdatedMessage(
            item.code || item.id,
            'category',
            oldCategory,
            newCategory
          ),
        ],
      };
    },
  };
}

export function createReplyNode(
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
      return [
        {
          role: 'printy',
          text: 'Type your reply message to send to the user.',
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

      if (!isValidTicketReply(input)) {
        return {
          messages: [{ role: 'printy', text: 'Please type a reply message.' }],
          quickReplies: ['End Chat'],
        };
      }

      updateItem(item.id, { lastMessage: input }, state, context);

      return {
        nextNodeId: getNextNode(state, context),
        messages: [createTicketReplyMessage(item.id)],
      };
    },
  };
}
