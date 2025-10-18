/**
 * JsonbFlowProcessor
 * Executes JSONB-based chat flows similar to how the old AskQuote.ts worked
 * but using the new FlowDefinition structure from chatFlows/
 *
 * Refactored to use modular action handlers and helper functions
 */

import type {
  FlowDefinition,
  ActionNode,
  ConditionalNode,
  SessionMetadata,
  SessionContext,
} from '@features/chat/types';
import { supabase } from '@lib/supabase';
import { actionHandlers } from '@features/chat/actions';
import {
  buildQuickReplies,
  insertMessage,
  updateSessionMetadata,
  endSession,
  processPendingQuoteAction,
  fetchSessionMessages,
} from '@features/chat/helpers/flowHelpers';

// Re-export types and fetchSessionMessages for backward compatibility
export type { FlowExecutionResult } from '@features/chat/types';
export { fetchSessionMessages };

export class JsonbFlowProcessor {
  /**
   * Start a new flow conversation
   */
  static async startFlow(params: {
    flowId: string;
    customerId: string;
    flowDefinition: FlowDefinition;
    initialContext?: Partial<SessionContext> & {
      order_id?: string;
      display_id?: string;
      total_amount?: string;
      inquiry_id?: string; // ADD THIS
      quote_id?: string; // ADD THIS
    };
  }) {
    const { flowId, customerId, flowDefinition, initialContext } = params;

    // Create chat session
    const sessionId = crypto.randomUUID();

    // Prepare FK columns
    const inquiryId = initialContext?.inquiry_id || null;
    const quoteId = initialContext?.quote_id || null;

    const { error: sessionError } = await supabase
      .from('chat_sessions_v2')
      .insert({
        session_id: sessionId,
        flow_id: flowId,
        customer_id: customerId,
        status: 'active',
        inquiry_id: inquiryId, // ✅ Set FK directly
        quote_id: quoteId, // ✅ Set FK directly
        metadata: {
          current_node_id: flowDefinition.initial_node,
          context: {
            ...(initialContext || {}),
            flow_owner: (flowDefinition as any).owner || 'customer',
          },
        },
      });

    if (sessionError) {
      console.error('Failed to create chat session:', sessionError);
      throw new Error('Failed to start conversation');
    }

    // Resolve starting node, with auto-skip if initial context already provides required input
    let currentNodeId = flowDefinition.initial_node;
    let initialNode = flowDefinition.nodes[currentNodeId];
    if (!initialNode) {
      throw new Error(`Initial node ${flowDefinition.initial_node} not found`);
    }

    const bootMessages: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
    }> = [];

    // If initial node expects input and initialContext already has it, skip to next node
    if (
      initialNode.type === 'message' &&
      initialNode.expects_input &&
      initialNode.input_config?.store_as &&
      initialContext &&
      typeof initialContext[initialNode.input_config.store_as] === 'string' &&
      String(initialContext[initialNode.input_config.store_as]).trim().length >
        0 &&
      initialNode.next
    ) {
      // Personalized greeting when order context exists
      const orderInput = String(
        initialContext.display_id || initialContext.order_id || ''
      ).trim();

      if (orderInput) {
        const greet = `Hi! I'm Printy. I see you'd like to pay for your ${orderInput}.`;
        bootMessages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: greet,
          ts: Date.now(),
        });
        await insertMessage({
          sessionId,
          text: greet,
          role: 'printy',
          nodeId: currentNodeId,
        });
      }

      // Move to next
      currentNodeId = initialNode.next;
      await updateSessionMetadata(sessionId, {
        current_node_id: currentNodeId,
        context: (initialContext || {}) as any,
      });
      initialNode = flowDefinition.nodes[currentNodeId];
    }

    // If we land on an action node (e.g., verify_order), execute it immediately
    if (initialNode.type === 'action') {
      const actionResult = await this.executeAction({
        actionNode: initialNode as ActionNode,
        sessionId,
        customerId,
        context: (initialContext || {}) as any,
      });
      bootMessages.push(...actionResult.messages);

      // ✅ FIX: Save action messages to database
      for (const message of actionResult.messages) {
        await insertMessage({
          sessionId,
          text: message.text,
          role: message.role,
          nodeId: currentNodeId,
        });
      }

      // Update context if action provided context updates
      if ('context' in actionResult && actionResult.context) {
        const updatedContext = {
          ...(initialContext || {}),
          ...actionResult.context,
        };
        await updateSessionMetadata(sessionId, {
          current_node_id: currentNodeId,
          context: updatedContext,
        });
      }

      // Advance after action if next exists
      if ((initialNode as ActionNode).next) {
        currentNodeId = (initialNode as ActionNode).next as string;

        // Get the updated context from the database to preserve action context updates
        const { data: updatedSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', sessionId)
          .single();

        const updatedContext =
          updatedSession?.metadata?.context || initialContext || {};

        await updateSessionMetadata(sessionId, {
          current_node_id: currentNodeId,
          context: updatedContext,
        });
        initialNode = flowDefinition.nodes[currentNodeId];

        // If the next node is a conditional, process it immediately
        if (initialNode && initialNode.type === 'conditional') {
          const conditionalNode = initialNode as ConditionalNode;
          const conditionValue = updatedContext[conditionalNode.condition];

          console.log('[StartFlow] Processing conditional node:', {
            condition: conditionalNode.condition,
            value: conditionValue,
            cases: conditionalNode.cases,
          });

          // Find matching case
          const nextNodeId =
            conditionalNode.cases[conditionValue] ||
            conditionalNode.cases['default'];

          if (nextNodeId) {
            console.log('[StartFlow] Conditional branch to:', nextNodeId);
            currentNodeId = nextNodeId;
            await updateSessionMetadata(sessionId, {
              current_node_id: currentNodeId,
              context: updatedContext,
            });
            initialNode = flowDefinition.nodes[currentNodeId];

            // If the conditional leads to an action node, execute it immediately
            if (initialNode && initialNode.type === 'action') {
              const actionResult = await this.executeAction({
                actionNode: initialNode as ActionNode,
                sessionId,
                customerId,
                context: updatedContext,
              });
              bootMessages.push(...actionResult.messages);

              // ✅ FIX: Save action messages to database
              for (const message of actionResult.messages) {
                await insertMessage({
                  sessionId,
                  text: message.text,
                  role: message.role,
                  nodeId: currentNodeId,
                });
              }

              // Update context if action provided context updates
              if ('context' in actionResult && actionResult.context) {
                const newUpdatedContext = {
                  ...updatedContext,
                  ...actionResult.context,
                };
                await updateSessionMetadata(sessionId, {
                  current_node_id: currentNodeId,
                  context: newUpdatedContext,
                });
              }

              // Move to next node after action if exists
              if ((initialNode as ActionNode).next) {
                currentNodeId = (initialNode as ActionNode).next as string;
                await updateSessionMetadata(sessionId, {
                  current_node_id: currentNodeId,
                  context: updatedContext,
                });
                initialNode = flowDefinition.nodes[currentNodeId];
              }
            }
          } else {
            console.log(
              '[StartFlow] No matching case found for condition:',
              conditionValue
            );
          }
        }
      }
    }

    // Show the node's message (if any)
    if (
      initialNode.type === 'message' &&
      typeof initialNode.message === 'string' &&
      initialNode.message.trim().length > 0
    ) {
      console.log('📝 Adding initial message:', initialNode.message);
      bootMessages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: initialNode.message,
        ts: Date.now(),
      });
      await insertMessage({
        sessionId,
        text: initialNode.message,
        role: 'printy',
        nodeId: currentNodeId,
      });
    }

    // Auto-advance if initial node has a next and does NOT require input (common for admin flows)
    if (
      initialNode.type === 'message' &&
      initialNode.next &&
      !initialNode.expects_input
    ) {
      currentNodeId = initialNode.next;
      await updateSessionMetadata(sessionId, {
        current_node_id: currentNodeId,
        context: (initialContext || {}) as any,
      });
      let currentNode = flowDefinition.nodes[currentNodeId];
      // Loop through consecutive action nodes and conditional nodes
      while (
        currentNode &&
        (currentNode.type === 'action' || currentNode.type === 'conditional')
      ) {
        if (currentNode.type === 'action') {
          const actionResult = await this.executeAction({
            actionNode: currentNode as ActionNode,
            sessionId,
            customerId,
            context: (initialContext || {}) as any,
          });
          bootMessages.push(...actionResult.messages);

          // ✅ FIX: Save action messages to database
          for (const message of actionResult.messages) {
            await insertMessage({
              sessionId,
              text: message.text,
              role: message.role,
              nodeId: currentNodeId,
            });
          }

          // Update context if action provided context updates
          if ('context' in actionResult && actionResult.context) {
            const updatedContext = {
              ...(initialContext || {}),
              ...actionResult.context,
            };
            await updateSessionMetadata(sessionId, {
              current_node_id: currentNodeId,
              context: updatedContext,
            });
            // Note: initialContext is const, so we can't reassign it
            // The context will be updated in the database
          }

          // Move to next node if exists
          if ((currentNode as ActionNode).next) {
            currentNodeId = (currentNode as ActionNode).next as string;

            // Get the updated context from the database to preserve action context updates
            const { data: updatedSession } = await supabase
              .from('chat_sessions_v2')
              .select('metadata')
              .eq('session_id', sessionId)
              .single();

            const updatedContext =
              updatedSession?.metadata?.context || initialContext || {};

            await updateSessionMetadata(sessionId, {
              current_node_id: currentNodeId,
              context: updatedContext,
            });
            currentNode = flowDefinition.nodes[currentNodeId];
          } else {
            // No next node, break out
            break;
          }
        } else if (currentNode.type === 'conditional') {
          // Handle conditional node
          const conditionalNode = currentNode as ConditionalNode;

          // Get fresh context from database to ensure we have the latest values
          const { data: freshSession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', sessionId)
            .single();

          const freshContext =
            freshSession?.metadata?.context || initialContext || {};
          const conditionValue = freshContext[conditionalNode.condition];

          console.log('[Conditional] Evaluating condition:', {
            condition: conditionalNode.condition,
            value: conditionValue,
            cases: conditionalNode.cases,
          });

          // Find matching case
          const nextNodeId =
            conditionalNode.cases[conditionValue] ||
            conditionalNode.cases['default'];

          if (nextNodeId) {
            console.log('[Conditional] Branching to:', nextNodeId);
            currentNodeId = nextNodeId;
            await updateSessionMetadata(sessionId, {
              current_node_id: currentNodeId,
              context: freshContext,
            });
            currentNode = flowDefinition.nodes[currentNodeId];
          } else {
            console.log('[Conditional] No matching case found, breaking out');
            // No matching case, break out
            break;
          }
        }
      }

      // After action chain, show message if current node is a message node
      if (currentNode) {
        if (
          currentNode.type === 'message' &&
          typeof currentNode.message === 'string' &&
          currentNode.message.trim().length > 0
        ) {
          bootMessages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: currentNode.message,
            ts: Date.now(),
          });
          await insertMessage({
            sessionId,
            text: currentNode.message,
            role: 'printy',
            nodeId: currentNodeId,
          });
        }
      }
    }

    const quickReplies = buildQuickReplies(flowDefinition.nodes[currentNodeId]);

    // Build fallback message if bootMessages is empty and initialNode has a valid string message
    const fallbackMessages =
      bootMessages.length > 0
        ? bootMessages
        : initialNode.type === 'message' &&
            typeof initialNode.message === 'string' &&
            initialNode.message.trim().length > 0
          ? [
              {
                id: crypto.randomUUID(),
                role: 'printy' as const,
                text: initialNode.message,
                ts: Date.now(),
              },
            ]
          : [];

    return {
      messages: fallbackMessages,
      quickReplies,
      sessionId,
      currentNodeId: currentNodeId,
    };
  }

  /**
   * Process user input and advance the flow
   */
  static async processInput(params: {
    sessionId: string;
    userInput: string;
    flowDefinition: FlowDefinition;
    senderRole?: 'customer' | 'admin';
  }) {
    const {
      sessionId,
      userInput,
      flowDefinition,
      senderRole = 'customer',
    } = params;

    // Get current session metadata
    const { data: session, error: sessionError } = await supabase
      .from('chat_sessions_v2')
      .select('metadata, customer_id')
      .eq('session_id', sessionId)
      .single();

    if (sessionError || !session) {
      throw new Error('Session not found');
    }

    const metadata = session.metadata as SessionMetadata;
    const customerId = session.customer_id;
    const currentNode = flowDefinition.nodes[metadata.current_node_id];

    if (!currentNode) {
      throw new Error(`Current node ${metadata.current_node_id} not found`);
    }

    // Insert user message with correct sender role (customer/admin)
    await insertMessage({
      sessionId,
      text: userInput,
      role: senderRole,
      nodeId: metadata.current_node_id,
    });

    const responses: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
    }> = [];

    // Handle input collection if node expects it
    if (
      currentNode.type === 'message' &&
      currentNode.expects_input &&
      currentNode.input_config
    ) {
      // Store user input in context
      metadata.context[currentNode.input_config.store_as] = userInput;

      // Update session metadata
      await updateSessionMetadata(sessionId, metadata);
    }

    // Handle option selection
    if (currentNode.type === 'message' && currentNode.options) {
      console.log('[ProcessInput] Current node options:', currentNode.options);
      console.log('[ProcessInput] User input:', userInput);

      const selectedOption = currentNode.options.find(opt => {
        const labelMatch = opt.label.toLowerCase() === userInput.toLowerCase();
        const valueMatch = opt.value?.toLowerCase() === userInput.toLowerCase();
        console.log(
          `[ProcessInput] Checking option "${opt.label}": labelMatch=${labelMatch}, valueMatch=${valueMatch}`
        );
        return labelMatch || valueMatch;
      });

      console.log('[ProcessInput] Selected option:', selectedOption);

      if (selectedOption) {
        // Store option value if specified
        if (selectedOption.value && selectedOption.store_as) {
          metadata.context[selectedOption.store_as] = selectedOption.value;
          await updateSessionMetadata(sessionId, metadata);
        }

        // Move to next node
        if (selectedOption.next) {
          console.log(
            '[ProcessInput] Moving to next node:',
            selectedOption.next
          );
          metadata.current_node_id = selectedOption.next;
          await updateSessionMetadata(sessionId, metadata);
        }
      } else {
        console.log(
          '[ProcessInput] No matching option found for input:',
          userInput
        );
      }
    }

    // Move to next node if specified (for input nodes)
    if (
      currentNode.type === 'message' &&
      currentNode.next &&
      currentNode.expects_input
    ) {
      metadata.current_node_id = currentNode.next;
      await updateSessionMetadata(sessionId, metadata);
    }

    // Get the new current node after transition
    const nextNode = flowDefinition.nodes[metadata.current_node_id];
    if (!nextNode) {
      throw new Error(`Next node ${metadata.current_node_id} not found`);
    }

    // Execute action if the next node is an action node
    if (nextNode.type === 'action') {
      console.log('Executing action:', nextNode.action);
      const actionResult = await this.executeAction({
        actionNode: nextNode as ActionNode,
        sessionId,
        customerId,
        context: metadata.context,
      });
      console.log('Action result:', actionResult);

      responses.push(...actionResult.messages);

      // Save action messages to database
      for (const message of actionResult.messages) {
        await insertMessage({
          sessionId,
          text: message.text,
          role: message.role,
          nodeId: metadata.current_node_id,
        });
      }

      // Update context if action provided context updates
      if ('context' in actionResult && actionResult.context) {
        metadata.context = { ...metadata.context, ...actionResult.context };
        await updateSessionMetadata(sessionId, metadata);
      }

      // Move to next node after action
      if (nextNode.next) {
        // Get fresh metadata to preserve any context updates made by the action
        const { data: postActionSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', sessionId)
          .single();

        if (postActionSession) {
          const postActionMetadata =
            postActionSession.metadata as SessionMetadata;
          // Update only the current_node_id, preserving the context from the action
          metadata.current_node_id = nextNode.next;
          metadata.context = postActionMetadata.context; // Preserve context updates from action
          await updateSessionMetadata(sessionId, metadata);
        } else {
          // Fallback if fetch fails
          metadata.current_node_id = nextNode.next;
          await updateSessionMetadata(sessionId, metadata);
        }

        // Get the node after the action and display it if it's a message node with text
        const nodeAfterAction = flowDefinition.nodes[nextNode.next];
        if (
          nodeAfterAction &&
          nodeAfterAction.type === 'message' &&
          typeof nodeAfterAction.message === 'string' &&
          nodeAfterAction.message.trim().length > 0
        ) {
          responses.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: nodeAfterAction.message,
            ts: Date.now(),
          });

          await insertMessage({
            sessionId,
            text: nodeAfterAction.message,
            role: 'printy',
            nodeId: metadata.current_node_id,
          });
        }
      }
    } else if (nextNode.type === 'conditional') {
      // Handle conditional node
      console.log('Processing conditional node:', nextNode.condition);
      const conditionalNode = nextNode as ConditionalNode;

      // Get fresh context from database to ensure we have the latest values
      const { data: freshSession } = await supabase
        .from('chat_sessions_v2')
        .select('metadata')
        .eq('session_id', sessionId)
        .single();

      const freshContext = freshSession?.metadata?.context || metadata.context;
      const conditionValue = freshContext[conditionalNode.condition];

      console.log('[Conditional] Evaluating condition:', {
        condition: conditionalNode.condition,
        value: conditionValue,
        cases: conditionalNode.cases,
      });

      // Find matching case
      const nextNodeId =
        conditionalNode.cases[conditionValue] ||
        conditionalNode.cases['default'];

      if (nextNodeId) {
        console.log('[Conditional] Branching to:', nextNodeId);
        metadata.current_node_id = nextNodeId;
        metadata.context = freshContext; // Use fresh context
        await updateSessionMetadata(sessionId, metadata);

        // Process the next node immediately
        const conditionalNextNode = flowDefinition.nodes[nextNodeId];
        if (conditionalNextNode) {
          // If it's an action node, execute it
          if (conditionalNextNode.type === 'action') {
            const actionResult = await this.executeAction({
              actionNode: conditionalNextNode as ActionNode,
              sessionId,
              customerId,
              context: metadata.context,
            });
            responses.push(...actionResult.messages);

            // Save action messages to database
            for (const message of actionResult.messages) {
              await insertMessage({
                sessionId,
                text: message.text,
                role: message.role,
                nodeId: metadata.current_node_id,
              });
            }

            // Update context if action provided context updates
            if ('context' in actionResult && actionResult.context) {
              metadata.context = {
                ...metadata.context,
                ...actionResult.context,
              };
              await updateSessionMetadata(sessionId, metadata);
            }

            // Move to next node after action if exists
            if (conditionalNextNode.next) {
              metadata.current_node_id = conditionalNextNode.next;
              await updateSessionMetadata(sessionId, metadata);
            }
          } else if (conditionalNextNode.type === 'message') {
            // If it's a message node, show the message
            if (
              typeof conditionalNextNode.message === 'string' &&
              conditionalNextNode.message.trim().length > 0
            ) {
              responses.push({
                id: crypto.randomUUID(),
                role: 'printy',
                text: conditionalNextNode.message,
                ts: Date.now(),
              });

              await insertMessage({
                sessionId,
                text: conditionalNextNode.message,
                role: 'printy',
                nodeId: metadata.current_node_id,
              });
            }

            // Move to next node if exists
            if (conditionalNextNode.next) {
              metadata.current_node_id = conditionalNextNode.next;
              await updateSessionMetadata(sessionId, metadata);
            }
          }
        }
      } else {
        console.error(
          '[Conditional] No matching case found for condition:',
          conditionValue
        );
      }
    } else {
      // Regular message node - send the message only if it's not empty (handle both string and array)
      if (
        nextNode.message &&
        typeof nextNode.message === 'string' &&
        nextNode.message.trim().length > 0
      ) {
        responses.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: nextNode.message,
          ts: Date.now(),
        });

        // Insert Printy's message
        await insertMessage({
          sessionId,
          text: nextNode.message,
          role: 'printy',
          nodeId: metadata.current_node_id,
        });
      }
    }

    // Handle end node
    if (nextNode.type === 'end') {
      await endSession(sessionId);
    }

    // Get fresh metadata to check for pending actions (metadata may have been updated by action)
    const { data: freshSession, error: freshSessionError } = await supabase
      .from('chat_sessions_v2')
      .select('metadata')
      .eq('session_id', sessionId)
      .single();

    if (freshSessionError) {
      console.error(
        '[ProcessInput] Error fetching fresh session:',
        freshSessionError
      );
    }

    if (freshSession) {
      const freshMetadata = freshSession.metadata as SessionMetadata;

      // Process pending quote actions when reaching acknowledgement messages
      console.log('[ProcessInput] Checking for pending quote actions:', {
        currentNodeId: freshMetadata.current_node_id,
        hasPendingAction: !!freshMetadata.context?.pending_quote_action,
        hasPendingConversationId:
          !!freshMetadata.context?.pending_conversation_id,
        pendingAction: freshMetadata.context?.pending_quote_action,
        pendingConversationId: freshMetadata.context?.pending_conversation_id,
        fullContext: freshMetadata.context,
      });

      const isAcceptedOrRejectedNode =
        freshMetadata.current_node_id === 'quote_accepted' ||
        freshMetadata.current_node_id === 'quote_rejected';
      console.log(
        '[ProcessInput] Is accepted/rejected node?',
        isAcceptedOrRejectedNode
      );
      console.log(
        '[ProcessInput] Has pending action?',
        !!freshMetadata.context?.pending_quote_action
      );
      console.log(
        '[ProcessInput] Has pending conversation ID?',
        !!freshMetadata.context?.pending_conversation_id
      );

      if (
        isAcceptedOrRejectedNode &&
        freshMetadata.context?.pending_quote_action &&
        freshMetadata.context?.pending_conversation_id
      ) {
        console.log(
          '[ProcessInput] All conditions met! Processing pending quote action...'
        );
        await processPendingQuoteAction(
          freshMetadata.context.pending_quote_action,
          freshMetadata.context.pending_conversation_id
        );
      } else {
        console.log(
          '[ProcessInput] Conditions not met for processing pending action'
        );
      }
    }

    // Get updated node for quick replies
    const finalNode = flowDefinition.nodes[metadata.current_node_id];
    const quickReplies = buildQuickReplies(finalNode);

    return {
      messages: responses,
      quickReplies,
      sessionId,
      currentNodeId: metadata.current_node_id,
    };
  }

  /**
   * Execute an action node (create_quote_conversation, create_inquiry, etc.)
   */
  private static async executeAction(params: {
    actionNode: ActionNode;
    sessionId: string;
    customerId: string;
    context: SessionContext;
  }) {
    const { actionNode, sessionId, customerId, context } = params;
    const messages: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
    }> = [];

    // Show action message only if it's not empty (handle both string and potential array cases)
    if (
      actionNode.message &&
      typeof actionNode.message === 'string' &&
      actionNode.message.trim().length > 0
    ) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: actionNode.message,
        ts: Date.now(),
      });

      await insertMessage({
        sessionId,
        text: actionNode.message,
        role: 'printy',
        nodeId: actionNode.action,
      });
    }

    // Look up the action handler
    const handler = actionHandlers[actionNode.action];

    if (handler) {
      // Execute the handler
      const result = await handler({
        actionNode,
        sessionId,
        customerId,
        context,
      });

      messages.push(...result.messages);

      // ✅ FIX: Return context updates from action results
      // This ensures conditional nodes can evaluate context set by actions
      if (result.context) {
        return { messages, context: result.context };
      }
    } else {
      // Unknown action
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: `Action ${actionNode.action} not yet implemented.`,
        ts: Date.now(),
      });
    }

    return { messages };
  }
}
