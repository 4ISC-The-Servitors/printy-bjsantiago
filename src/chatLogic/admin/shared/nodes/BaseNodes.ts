// Base node handlers for all chat flows

import type { NodeHandler } from '../NodeHandler';
import {
  createEndChatMessage,
  createErrorMessage,
} from '../utils/MessageBuilders';

export const endChatNode: NodeHandler = {
  messages: () => [createEndChatMessage()],
  quickReplies: () => ['End Chat'],
};

export const actionNode: NodeHandler = {
  messages: () => {
    // This will be overridden by specific flows
    return [{ role: 'printy', text: 'What would you like to do?' }];
  },
  quickReplies: () => ['End Chat'],
};

export const doneNode: NodeHandler = {
  messages: () => [{ role: 'printy', text: 'Done. Anything else?' }],
  quickReplies: () => ['End Chat'],
};

export function createErrorNode(message: string): NodeHandler {
  return {
    messages: () => [createErrorMessage(message)],
    quickReplies: () => ['End Chat'],
  };
}

export function createInfoNode(
  message: string,
  quickReplies: string[] = ['End Chat']
): NodeHandler {
  return {
    messages: () => [{ role: 'printy', text: message }],
    quickReplies: () => quickReplies,
  };
}
