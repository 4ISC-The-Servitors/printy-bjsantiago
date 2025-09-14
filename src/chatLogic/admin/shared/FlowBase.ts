// Abstract base class for all chat flows

import type { ChatFlow, BotMessage } from '../../../types/chatFlow';
import type { FlowState } from './FlowState';
import type { FlowContext } from './FlowContext';
import type { NodeHandler, NodeHandlerResult } from './NodeHandler';
import { isEndChat } from './utils/InputValidators';
import { createEndChatMessage } from './utils/MessageBuilders';

export abstract class FlowBase implements ChatFlow {
  abstract id: string;
  abstract title: string;

  protected state: FlowState;
  protected context: FlowContext = {};
  protected nodes: Map<string, NodeHandler> = new Map();

  constructor(initialState: FlowState) {
    this.state = initialState;
  }

  protected registerNode(nodeId: string, handler: NodeHandler) {
    this.nodes.set(nodeId, handler);
  }

  initial = (ctx: FlowContext) => {
    this.context = ctx;
    this.initializeState(ctx);
    return this.getCurrentMessages();
  };

  quickReplies = () => this.getCurrentQuickReplies();

  respond = async (_ctx: FlowContext, input: string) => {
    const handler = this.nodes.get(this.state.currentNodeId);
    if (!handler) {
      return this.createEndChatResponse();
    }

    // Handle "End Chat" globally
    if (isEndChat(input)) {
      return this.createEndChatResponse();
    }

    // Try custom handler first
    if (handler.handleInput) {
      const result = handler.handleInput(input, this.state, this.context);
      if (result) {
        return this.processHandlerResult(result);
      }
    }

    // Fallback to default behavior
    return this.createFallbackResponse();
  };

  protected abstract initializeState(context: FlowContext): void;

  protected getCurrentMessages(): BotMessage[] {
    const handler = this.nodes.get(this.state.currentNodeId);
    return handler ? handler.messages(this.state, this.context) : [];
  }

  protected getCurrentQuickReplies(): string[] {
    const handler = this.nodes.get(this.state.currentNodeId);
    return handler
      ? handler.quickReplies(this.state, this.context)
      : ['End Chat'];
  }

  protected processHandlerResult(result: NodeHandlerResult) {
    // Update state if needed
    if (result.stateUpdates) {
      this.state = { ...this.state, ...result.stateUpdates };
    }

    // Set next node if specified
    if (result.nextNodeId) {
      this.state.currentNodeId = result.nextNodeId;
    }

    // Return messages and quick replies
    return {
      messages: result.messages || this.getCurrentMessages(),
      quickReplies: result.quickReplies || this.getCurrentQuickReplies(),
    };
  }

  protected createEndChatResponse() {
    return {
      messages: [createEndChatMessage()],
      quickReplies: ['End Chat'],
    };
  }

  protected createFallbackResponse() {
    return {
      messages: [{ role: 'printy', text: 'Please use the options below.' }],
      quickReplies: this.getCurrentQuickReplies(),
    };
  }
}
