// Node handler interface for all chat flows

import type { BotMessage } from '../../../types/chatFlow';
import type { FlowState } from './FlowState';
import type { FlowContext } from './FlowContext';

export interface NodeHandlerResult {
  nextNodeId?: string;
  messages?: BotMessage[];
  quickReplies?: string[];
  stateUpdates?: Partial<FlowState>;
}

export interface NodeHandler {
  messages: (state: FlowState, context: FlowContext) => BotMessage[];
  quickReplies: (state: FlowState, context: FlowContext) => string[];
  handleInput?: (
    input: string,
    state: FlowState,
    context: FlowContext
  ) => NodeHandlerResult | null;
}
