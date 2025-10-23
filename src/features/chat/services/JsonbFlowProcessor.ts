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
  endSession,
  processPendingQuoteAction,
  fetchSessionMessages,
} from '@features/chat/helpers/flowHelpers';
import { SessionStateManager } from '@features/chat/services/SessionStateManager';

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

    console.log('[JsonbFlowProcessor.startFlow] Starting flow:', {
      flowId,
      customerId,
      initialContext,
      initial_node: flowDefinition.initial_node,
    });

    // ✅ PHASE 3 OPTIMIZATION: Create SessionStateManager for batched metadata updates
    // This reduces 5-8 sequential database writes to 1 batched write at the end
    const stateManager = new SessionStateManager(sessionId, {
      current_node_id: flowDefinition.initial_node,
      context: {
        ...(initialContext || {}),
        flow_owner: (flowDefinition as any).owner || 'customer',
      },
    });

    console.log(
      '[JsonbFlowProcessor.startFlow] StateManager context initialized:',
      stateManager.getContext()
    );

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
      stateManager.setCurrentNode(currentNodeId);
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
        stateManager.updateContext(actionResult.context);
      }

      // Advance after action if next exists
      if ((initialNode as ActionNode).next) {
        currentNodeId = (initialNode as ActionNode).next as string;

        // ✅ OPTIMIZED: Use context from action result instead of fetching from database
        // This saves 50-100ms per operation by eliminating redundant query
        const updatedContext = actionResult.context
          ? { ...stateManager.getContext(), ...actionResult.context }
          : stateManager.getContext();

        stateManager.setCurrentNode(currentNodeId);
        if (actionResult.context) {
          stateManager.updateContext(actionResult.context);
        }
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
            stateManager.setCurrentNode(currentNodeId);
            initialNode = flowDefinition.nodes[currentNodeId];

            // If the conditional leads to an action node, execute it immediately
            if (initialNode && initialNode.type === 'action') {
              console.log(
                '[JsonbFlowProcessor.startFlow] Executing action from conditional:',
                {
                  actionNode: (initialNode as ActionNode).action,
                  context: updatedContext,
                }
              );
              const actionResult = await this.executeAction({
                actionNode: initialNode as ActionNode,
                sessionId,
                customerId,
                context: updatedContext,
              });
              console.log(
                '[JsonbFlowProcessor.startFlow] Action result:',
                actionResult
              );
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
                stateManager.updateContext(actionResult.context);
              }

              // Move to next node after action if exists
              if ((initialNode as ActionNode).next) {
                currentNodeId = (initialNode as ActionNode).next as string;
                stateManager.setCurrentNode(currentNodeId);
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
        // If the next node is an action, execute it immediately
        else if (initialNode && initialNode.type === 'action') {
          console.log(
            '[StartFlow] Processing action node after advance:',
            currentNodeId
          );
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
            stateManager.updateContext(actionResult.context);
          }

          // Move to next node after action if exists
          if ((initialNode as ActionNode).next) {
            currentNodeId = (initialNode as ActionNode).next as string;
            stateManager.setCurrentNode(currentNodeId);
            initialNode = flowDefinition.nodes[currentNodeId];
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
      stateManager.setCurrentNode(currentNodeId);
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
            stateManager.updateContext(actionResult.context);
          }

          // Move to next node if exists
          if ((currentNode as ActionNode).next) {
            currentNodeId = (currentNode as ActionNode).next as string;
            stateManager.setCurrentNode(currentNodeId);
            currentNode = flowDefinition.nodes[currentNodeId];
          } else {
            // No next node, break out
            break;
          }
        } else if (currentNode.type === 'conditional') {
          // Handle conditional node
          const conditionalNode = currentNode as ConditionalNode;

          // ✅ PHASE 3 OPTIMIZATION: Use in-memory context from stateManager
          // No need to fetch from database as stateManager has latest values
          const freshContext = stateManager.getContext();
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
            stateManager.setCurrentNode(currentNodeId);
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

    // ✅ PHASE 3 OPTIMIZATION: Flush all batched metadata updates to database
    // This single write replaces 5-8 sequential writes throughout the method
    await stateManager.flush();

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

    // ✅ PHASE 3 OPTIMIZATION: Load session with SessionStateManager for batched updates
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

    // Create state manager for batched metadata updates
    const stateManager = new SessionStateManager(sessionId, metadata);
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
      stateManager.updateContext({
        [currentNode.input_config.store_as]: userInput,
      });
    }

    // Handle option selection
    if (
      (currentNode.type === 'message' || currentNode.type === 'action') &&
      currentNode.options
    ) {
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
          stateManager.updateContext({
            [selectedOption.store_as]: selectedOption.value,
          });
        }

        // Move to next node
        if (selectedOption.next) {
          console.log(
            '[ProcessInput] Moving to next node:',
            selectedOption.next
          );
          stateManager.setCurrentNode(selectedOption.next);
        }
      } else {
        console.log(
          '[ProcessInput] No matching option found for input:',
          userInput
        );
      }
    }

    // ✅ FIX: Handle quick reply selections from action results
    // This handles cases where actions return dynamic quick replies (like show_customer_orders)
    if (currentNode.type === 'action' && userInput) {
      console.log(
        '[ProcessInput] Checking for action quick reply selection:',
        userInput
      );

      // Check if this input matches any quick reply that would have been returned by an action
      // We look for order IDs in the format ORD-XXXXXX or special values like 'no_order'
      const isOrderSelection =
        /^ORD-\d+$/.test(userInput) || userInput === 'no_order';

      if (isOrderSelection) {
        console.log(
          '[ProcessInput] Detected order quick reply selection:',
          userInput
        );

        // Store the order selection in context
        stateManager.updateContext({
          order_id: userInput,
        });

        // Move to create_ticket node
        stateManager.setCurrentNode('create_ticket');
        console.log(
          '[ProcessInput] Moving to create_ticket node for order:',
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
      stateManager.setCurrentNode(currentNode.next);
    }

    // Get the new current node after transition
    const currentNodeId = stateManager.getCurrentNodeId();
    const nextNode = flowDefinition.nodes[currentNodeId];
    if (!nextNode) {
      throw new Error(`Next node ${currentNodeId} not found`);
    }

    // Execute action if the next node is an action node
    let actionResult: any = null;
    if (nextNode.type === 'action') {
      actionResult = await this.executeAction({
        actionNode: nextNode as ActionNode,
        sessionId,
        customerId,
        context: stateManager.getContext(),
      });

      responses.push(...actionResult.messages);

      // Save action messages to database
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
        stateManager.updateContext(actionResult.context);
      }

      // Move to next node after action, but only if action was successful
      // Check if any error messages indicate validation failure that should prevent advancement
      const hasValidationErrors = actionResult.messages.some(
        (msg: any) =>
          msg.text.includes('was not found') ||
          msg.text.includes('Please provide a valid') ||
          msg.text.includes('Try again later') ||
          msg.text.includes("Couldn't create")
      );

      if (nextNode.next && !hasValidationErrors) {
        // ✅ OPTIMIZED: Use context from action result via stateManager
        // The action result already contains any context updates, no need for additional query
        stateManager.setCurrentNode(nextNode.next);

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
            nodeId: stateManager.getCurrentNodeId(),
          });
        }
      } else if (hasValidationErrors) {
        // ✅ FIX: If validation failed, go back to the previous input node for retry
        // The current node was the input node before advancing to the action
        stateManager.setCurrentNode(currentNodeId);
      }
    } else if (nextNode.type === 'conditional') {
      // Handle conditional node
      console.log('Processing conditional node:', nextNode.condition);
      const conditionalNode = nextNode as ConditionalNode;

      // ✅ PHASE 3 OPTIMIZATION: Use in-memory context from stateManager
      // No need to fetch from database as stateManager has latest values
      const freshContext = stateManager.getContext();
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
        stateManager.setCurrentNode(nextNodeId);

        // Process the next node immediately
        const conditionalNextNode = flowDefinition.nodes[nextNodeId];
        if (conditionalNextNode) {
          // If it's an action node, execute it
          if (conditionalNextNode.type === 'action') {
            const actionResult = await this.executeAction({
              actionNode: conditionalNextNode as ActionNode,
              sessionId,
              customerId,
              context: stateManager.getContext(),
            });
            responses.push(...actionResult.messages);

            // Save action messages to database
            for (const message of actionResult.messages) {
              await insertMessage({
                sessionId,
                text: message.text,
                role: message.role,
                nodeId: stateManager.getCurrentNodeId(),
              });
            }

            // Update context if action provided context updates
            if ('context' in actionResult && actionResult.context) {
              stateManager.updateContext(actionResult.context);
            }

            // Move to next node after action if exists
            if (conditionalNextNode.next) {
              stateManager.setCurrentNode(conditionalNextNode.next);
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
                nodeId: stateManager.getCurrentNodeId(),
              });
            }

            // Move to next node if exists
            if (conditionalNextNode.next) {
              stateManager.setCurrentNode(conditionalNextNode.next);
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
          nodeId: stateManager.getCurrentNodeId(),
        });
      }
    }

    // ✅ PHASE 3 OPTIMIZATION: Flush batched metadata updates before handling end node
    await stateManager.flush();

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
    const finalNodeId = stateManager.getCurrentNodeId();
    const finalNode = flowDefinition.nodes[finalNodeId];
    let quickReplies = buildQuickReplies(finalNode);

    // ✅ FIX: Include quick replies from action results if available
    // This allows actions to provide dynamic quick replies (like order selection)
    if (
      nextNode.type === 'action' &&
      actionResult &&
      actionResult.quickReplies
    ) {
      // Use action quick replies if available
      // Check if action has validation errors or if the action is designed to provide quick replies
      const hasValidationErrors = actionResult.messages.some(
        (msg: any) =>
          msg.text.includes('was not found') ||
          msg.text.includes('Please provide a valid') ||
          msg.text.includes('Try again later') ||
          msg.text.includes("Couldn't create")
      );

      // Use action quick replies if:
      // 1. There are validation errors (stay on same node for retry)
      // 2. Action has no next node (designed for interaction)
      // 3. Action is specifically designed to show quick replies (like show_customer_orders)
      const shouldUseActionQuickReplies =
        hasValidationErrors ||
        !nextNode.next ||
        nextNode.action === 'show_customer_orders';

      if (shouldUseActionQuickReplies) {
        quickReplies = actionResult.quickReplies;
      }
    }

    return {
      messages: responses,
      quickReplies,
      sessionId,
      currentNodeId: finalNodeId,
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

    console.log('[JsonbFlowProcessor.executeAction] Starting:', {
      action: actionNode.action,
      sessionId,
      customerId,
      context,
      action_config: actionNode.action_config,
    });

    const messages: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
    }> = [];

    // ✅ FIX: Add action node message to messages array but DON'T insert to DB here
    // The caller (processInput/startFlow) will handle DB insertion to avoid duplicates
    if (
      actionNode.message &&
      typeof actionNode.message === 'string' &&
      actionNode.message.trim().length > 0
    ) {
      console.log('[JsonbFlowProcessor] Node message:', actionNode.message);
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: actionNode.message,
        ts: Date.now(),
      });
    } else {
      console.log('[JsonbFlowProcessor] No node message (empty or not string)');
    }

    // Look up the action handler
    const handler = actionHandlers[actionNode.action];

    if (handler) {
      console.log(
        '[JsonbFlowProcessor] Executing action handler:',
        actionNode.action
      );
      console.log('[JsonbFlowProcessor] Handler params:', {
        actionNode,
        sessionId,
        customerId,
        context,
      });

      try {
        // Execute the handler
        const result = await handler({
          actionNode,
          sessionId,
          customerId,
          context,
        });

        console.log(
          '[JsonbFlowProcessor] Action result messages:',
          result.messages.length
        );
        console.log(
          '[JsonbFlowProcessor] Action result context:',
          result.context
        );
        messages.push(...result.messages);

        // ✅ FIX: Return context updates and quick replies from action results
        // This ensures conditional nodes can evaluate context set by actions
        // and quick replies from actions are displayed to the user
        if (result.context || result.quickReplies) {
          const returnData: any = { messages };
          if (result.context) {
            returnData.context = result.context;
          }
          if (result.quickReplies) {
            returnData.quickReplies = result.quickReplies;
          }
          return returnData;
        }
      } catch (error) {
        console.error(
          '[JsonbFlowProcessor] Error executing action handler:',
          actionNode.action,
          error
        );
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `An error occurred while processing your request. Please try again.`,
          ts: Date.now(),
        });
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
