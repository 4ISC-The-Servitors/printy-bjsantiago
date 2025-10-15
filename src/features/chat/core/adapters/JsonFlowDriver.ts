/**
 * JsonFlowDriver
 * Executes JSON-based chat flows with Supabase action integrations
 */
import type { FlowDriver } from './FlowDriver';
import type {
  JsonFlowDefinition,
  JsonNode,
  Transition,
  TransitionCondition,
  FlowContext,
  ActionResult,
} from '../../../../types/jsonFlow';
import { JsonFlowActions } from '../actions/jsonFlowActions';

export class JsonFlowDriver implements FlowDriver {
  id: string;
  private flowDef: JsonFlowDefinition;
  private currentNodeId: string;
  private context: FlowContext = {};

  constructor(flowDef: JsonFlowDefinition) {
    this.id = flowDef.id;
    this.flowDef = flowDef;
    this.currentNodeId = flowDef.initialNode;
  }

  async initial(ctx: unknown): Promise<{ text: string }[]> {
    this.context = { ...(ctx as FlowContext) };
    const initialNode = this.flowDef.nodes[this.flowDef.initialNode];

    // Execute action if present
    if (initialNode.action) {
      const result = await this.executeAction(initialNode.action, initialNode);
      this.context.lastActionResult = result.status;

      // Merge context updates
      if (result.context) {
        this.context = { ...this.context, ...result.context };
      }

      // Add action result messages to node messages
      if (result.messages && result.messages.length > 0) {
        return [...initialNode.messages, ...result.messages].map(text => ({
          text,
        }));
      }
    }

    return initialNode.messages.map(text => ({ text }));
  }

  async respond(
    ctx: unknown,
    input: string
  ): Promise<{
    messages: { text: string }[];
    quickReplies?: string[];
  }> {
    this.context = { ...this.context, ...(ctx as FlowContext) };
    this.context.user_input = input;

    const currentNode = this.flowDef.nodes[this.currentNodeId];

    // Check if this input matches a transition (button click vs free text)
    const matchingTransition = this.findTransition(currentNode, input);
    const isButtonClick = matchingTransition && (
      matchingTransition.label?.toLowerCase() === input.trim().toLowerCase()
    );

    // For INPUT nodes, execute action FIRST (before transition) - but ONLY for free text, not button clicks
    let preTransitionMessages: string[] = [];
    if (currentNode.type === 'input' && currentNode.action && !isButtonClick) {
      const result = await this.executeAction(currentNode.action, currentNode);
      this.context.lastActionResult = result.status;

      // Merge context updates
      if (result.context) {
        this.context = { ...this.context, ...result.context };
      }

      // Capture action messages
      if (result.messages) {
        preTransitionMessages = result.messages;
      }

      // If action says to stay (e.g., collected details), stay on current node
      if (result.status === 'details_collected' || result.status === 'awaiting_input') {
        return {
          messages: preTransitionMessages.map(text => ({ text })),
          quickReplies: currentNode.quickReplies,
        };
      }
    }

    // Find matching transition
    const transition = matchingTransition;

    if (!transition) {
      return {
        messages: [{ text: 'Please choose one of the available options.' }],
        quickReplies: currentNode.quickReplies,
      };
    }

    // Move to next node
    this.currentNodeId = transition.targetNode;
    const nextNode = this.flowDef.nodes[this.currentNodeId];

    // Execute action if present on target node (but NOT for INPUT nodes arriving via button click)
    let actionMessages: string[] = [];
    if (nextNode.action && nextNode.type !== 'input') {
      const result = await this.executeAction(nextNode.action, nextNode);
      this.context.lastActionResult = result.status;

      // Merge context updates
      if (result.context) {
        this.context = { ...this.context, ...result.context };
      }

      // Capture action result messages
      if (result.messages) {
        actionMessages = result.messages;
      }
    }

    // Combine node messages with action messages
    const allMessages = [...nextNode.messages, ...actionMessages];

    return {
      messages: allMessages.map(text => ({ text })),
      quickReplies: nextNode.quickReplies,
    };
  }

  private findTransition(node: JsonNode, input: string): Transition | null {
    for (const transition of node.transitions) {
      // Label-based transition (user clicked quick reply)
      if (transition.label) {
        if (
          transition.label.toLowerCase() === input.trim().toLowerCase()
        ) {
          return transition;
        }
      }

      // Condition-based transition (programmatic evaluation)
      if (transition.condition) {
        if (this.evaluateCondition(transition.condition, input)) {
          return transition;
        }
      }

      // Fallback transition (no label or condition)
      if (!transition.label && !transition.condition) {
        return transition;
      }
    }

    return null;
  }

  private evaluateCondition(
    condition: TransitionCondition,
    input: string
  ): boolean {
    switch (condition.type) {
      case 'equals':
        return (
          input.trim().toLowerCase() === condition.value?.toLowerCase()
        );

      case 'contains':
        return input
          .toLowerCase()
          .includes(condition.value?.toLowerCase() || '');

      case 'regex':
        return new RegExp(condition.value || '', 'i').test(input);

      case 'action_result':
        return this.context.lastActionResult === condition.value;

      default:
        return false;
    }
  }

  private async executeAction(
    action: { type: string; config?: Record<string, any> },
    node: JsonNode
  ): Promise<ActionResult> {
    const handler = JsonFlowActions[action.type];

    if (!handler) {
      console.warn(`Unknown action type: ${action.type}`);
      return {
        status: 'unknown',
        messages: [],
      };
    }

    try {
      return await handler(this.context, action.config || {}, node);
    } catch (error) {
      console.error(`Error executing action ${action.type}:`, error);
      return {
        status: 'error',
        messages: ['An error occurred. Please try again.'],
      };
    }
  }

  // Getter for current context (useful for debugging)
  getContext(): FlowContext {
    return { ...this.context };
  }
}
