/**
 * JsonbFlowProcessor
 * Executes JSONB-based chat flows similar to how the old AskQuote.ts worked
 * but using the new FlowDefinition structure from chatFlows/
 */

import type { FlowDefinition, FlowNode, ActionNode, SessionMetadata, SessionContext } from '../../../../chatFlows/types';
import { supabase } from '../../../../lib/supabase';

export interface FlowExecutionResult {
  messages: Array<{
    id: string;
    role: 'customer' | 'admin' | 'printy';
    text: string;
    ts: number;
  }>;
  quickReplies: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  sessionId: string;
  currentNodeId: string;
}

export class JsonbFlowProcessor {
  /**
   * Start a new flow conversation
   */
  static async startFlow(params: {
    flowId: string;
    customerId: string;
    flowDefinition: FlowDefinition;
    initialContext?: Partial<SessionContext> & { order_id?: string; display_id?: string; total_amount?: string };
  }): Promise<FlowExecutionResult> {
    const { flowId, customerId, flowDefinition, initialContext } = params;

    // Create chat session
    const sessionId = crypto.randomUUID();
    const { error: sessionError } = await supabase
      .from('chat_sessions_v2')
      .insert({
        session_id: sessionId,
        flow_id: flowId,
        customer_id: customerId,
        status: 'active',
        metadata: {
          current_node_id: flowDefinition.initial_node,
          context: initialContext || {},
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

    const bootMessages: Array<{ id: string; role: 'printy'; text: string; ts: number; }> = [];

    // If initial node expects input and initialContext already has it, skip to next node
    if (
      initialNode.type === 'message' &&
      initialNode.expects_input &&
      initialNode.input_config?.store_as &&
      initialContext &&
      typeof initialContext[initialNode.input_config.store_as] === 'string' &&
      String(initialContext[initialNode.input_config.store_as]).trim().length > 0 &&
      initialNode.next
    ) {
      // Personalized greeting when order context exists
      const orderInput = String(
        (initialContext.display_id || initialContext.order_id || '')
      ).trim();

      if (orderInput) {
        const greet = `Hi! I'm Printy. I see you'd like to pay for your ${orderInput}.`;
        bootMessages.push({ id: crypto.randomUUID(), role: 'printy', text: greet, ts: Date.now() });
        await this.insertMessage({ sessionId, text: greet, role: 'printy', nodeId: currentNodeId });
      }

      // Move to next
      currentNodeId = initialNode.next;
      await this.updateSessionMetadata(sessionId, {
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

      // Advance after action if next exists
      if ((initialNode as ActionNode).next) {
        currentNodeId = (initialNode as ActionNode).next as string;
        await this.updateSessionMetadata(sessionId, {
          current_node_id: currentNodeId,
          context: (initialContext || {}) as any,
        });
        initialNode = flowDefinition.nodes[currentNodeId];
      }
    }

    // Show the node's message only for message nodes (not action nodes, which handle their own messages)
    if (initialNode.type === 'message' && initialNode.message) {
      bootMessages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: initialNode.message,
        ts: Date.now(),
      });
      await this.insertMessage({
        sessionId,
        text: initialNode.message,
        role: 'printy',
        nodeId: currentNodeId,
      });
    }

    const quickReplies = this.buildQuickReplies(initialNode);

    return {
      messages: bootMessages.length > 0 ? bootMessages : [
        {
          id: crypto.randomUUID(),
          role: 'printy',
          text: initialNode.message,
          ts: Date.now(),
        },
      ],
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
  }): Promise<FlowExecutionResult> {
    const { sessionId, userInput, flowDefinition } = params;

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

    // Insert user message
    await this.insertMessage({
      sessionId,
      text: userInput,
      role: 'customer',
      nodeId: metadata.current_node_id,
    });

    const responses: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
    }> = [];

    // Handle input collection if node expects it
    if (currentNode.type === 'message' && currentNode.expects_input && currentNode.input_config) {
      // Store user input in context
      metadata.context[currentNode.input_config.store_as] = userInput;
      
      // Update session metadata
      await this.updateSessionMetadata(sessionId, metadata);
    }

    // Handle option selection
    if (currentNode.type === 'message' && currentNode.options) {
      console.log('[ProcessInput] Current node options:', currentNode.options);
      console.log('[ProcessInput] User input:', userInput);
      
      const selectedOption = currentNode.options.find(
        opt => opt.label.toLowerCase() === userInput.toLowerCase()
      );

      console.log('[ProcessInput] Selected option:', selectedOption);

      if (selectedOption) {
        // Store option value if specified
        if (selectedOption.value && selectedOption.store_as) {
          metadata.context[selectedOption.store_as] = selectedOption.value;
          await this.updateSessionMetadata(sessionId, metadata);
        }

        // Move to next node
        if (selectedOption.next) {
          console.log('[ProcessInput] Moving to next node:', selectedOption.next);
          metadata.current_node_id = selectedOption.next;
          await this.updateSessionMetadata(sessionId, metadata);
        }
      } else {
        console.log('[ProcessInput] No matching option found for input:', userInput);
      }
    }

    // Move to next node if specified (for input nodes)
    if (currentNode.type === 'message' && currentNode.next && currentNode.expects_input) {
      metadata.current_node_id = currentNode.next;
      await this.updateSessionMetadata(sessionId, metadata);
    }

    // Get the new current node after transition
    const nextNode = flowDefinition.nodes[metadata.current_node_id];
    if (!nextNode) {
      throw new Error(`Next node ${metadata.current_node_id} not found`);
    }

    // Execute action if the next node is an action node
    if (nextNode.type === 'action') {
      const actionResult = await this.executeAction({
        actionNode: nextNode as ActionNode,
        sessionId,
        customerId,
        context: metadata.context,
      });

      responses.push(...actionResult.messages);

      // Move to next node after action
      if (nextNode.next) {
        // Get fresh metadata to preserve any context updates made by the action
        const { data: postActionSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', sessionId)
          .single();

        if (postActionSession) {
          const postActionMetadata = postActionSession.metadata as SessionMetadata;
          // Update only the current_node_id, preserving the context from the action
          metadata.current_node_id = nextNode.next;
          metadata.context = postActionMetadata.context; // Preserve context updates from action
          await this.updateSessionMetadata(sessionId, metadata);
        } else {
          // Fallback if fetch fails
          metadata.current_node_id = nextNode.next;
          await this.updateSessionMetadata(sessionId, metadata);
        }

        // Get the node after the action and display it if it's a message node
        const nodeAfterAction = flowDefinition.nodes[nextNode.next];
        if (nodeAfterAction && nodeAfterAction.type === 'message' && nodeAfterAction.message && nodeAfterAction.message.trim().length > 0) {
          responses.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: nodeAfterAction.message,
            ts: Date.now(),
          });

          await this.insertMessage({
            sessionId,
            text: nodeAfterAction.message,
            role: 'printy',
            nodeId: metadata.current_node_id,
          });
        }
      }
    } else {
      // Regular message node - send the message only if it's not empty
      if (nextNode.message && nextNode.message.trim().length > 0) {
        responses.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: nextNode.message,
          ts: Date.now(),
        });

        // Insert Printy's message
        await this.insertMessage({
          sessionId,
          text: nextNode.message,
          role: 'printy',
          nodeId: metadata.current_node_id,
        });
      }
    }

    // Handle end node
    if (nextNode.type === 'end') {
      await this.endSession(sessionId);
    }

    // Get fresh metadata to check for pending actions (metadata may have been updated by action)
    const { data: freshSession, error: freshSessionError } = await supabase
      .from('chat_sessions_v2')
      .select('metadata')
      .eq('session_id', sessionId)
      .single();

    if (freshSessionError) {
      console.error('[ProcessInput] Error fetching fresh session:', freshSessionError);
    }

    if (freshSession) {
      const freshMetadata = freshSession.metadata as SessionMetadata;
      
      // Process pending quote actions when reaching acknowledgement messages
      console.log('[ProcessInput] Checking for pending quote actions:', {
        currentNodeId: freshMetadata.current_node_id,
        hasPendingAction: !!freshMetadata.context?.pending_quote_action,
        hasPendingConversationId: !!freshMetadata.context?.pending_conversation_id,
        pendingAction: freshMetadata.context?.pending_quote_action,
        pendingConversationId: freshMetadata.context?.pending_conversation_id,
        fullContext: freshMetadata.context,
      });

      const isAcceptedOrRejectedNode = freshMetadata.current_node_id === 'quote_accepted' || freshMetadata.current_node_id === 'quote_rejected';
      console.log('[ProcessInput] Is accepted/rejected node?', isAcceptedOrRejectedNode);
      console.log('[ProcessInput] Has pending action?', !!freshMetadata.context?.pending_quote_action);
      console.log('[ProcessInput] Has pending conversation ID?', !!freshMetadata.context?.pending_conversation_id);

      if (isAcceptedOrRejectedNode &&
          freshMetadata.context?.pending_quote_action && freshMetadata.context?.pending_conversation_id) {
        console.log('[ProcessInput] ✅ All conditions met! Processing pending quote action...');
        await this.processPendingQuoteAction(freshMetadata.context.pending_quote_action, freshMetadata.context.pending_conversation_id);
      } else {
        console.log('[ProcessInput] ❌ Conditions not met for processing pending action');
      }
    }

    // Get updated node for quick replies
    const finalNode = flowDefinition.nodes[metadata.current_node_id];
    const quickReplies = this.buildQuickReplies(finalNode);

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
  }): Promise<{
    messages: Array<{
      id: string;
      role: 'printy';
      text: string;
      ts: number;
    }>;
  }> {
    const { actionNode, sessionId, customerId, context } = params;
    const messages: Array<{ id: string; role: 'printy'; text: string; ts: number }> = [];

    // Show action message only if it's not empty
    if (actionNode.message && actionNode.message.trim().length > 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: actionNode.message,
        ts: Date.now(),
      });

      await this.insertMessage({
        sessionId,
        text: actionNode.message,
        role: 'printy',
        nodeId: actionNode.action,
      });
    }

    switch (actionNode.action) {
      case 'verify_order': {
        const config = actionNode.action_config as any;
        const orderIdKey = config?.order_id_key || 'order_id';
        const orderId = String(context[orderIdKey] || '').trim();

        if (!orderId) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Please provide your Order ID to continue (e.g., ORD-12345).',
            ts: Date.now(),
          });
          break;
        }

        // Lookup order by display_id or order_id UUID belonging to the customer
        let orderRow: any | null = null;
        try {
          // Try match by display_id first (human-friendly like ORD-12345)
          const { data: byDisplay, error: errDisplay } = await supabase
            .from('orders_duplicate')
            .select('order_id, customer_id, status, payment_proof')
            .eq('display_id', orderId)
            .eq('customer_id', customerId)
            .maybeSingle?.() ?? { data: null, error: null } as any;

          if (!errDisplay && byDisplay) {
            orderRow = byDisplay;
          }

          if (!orderRow) {
            // Try match by UUID order_id if user pasted raw UUID
            const { data: byUuid, error: errUuid } = await supabase
              .from('orders_duplicate')
              .select('order_id, customer_id, status, payment_proof')
              .eq('order_id', orderId)
              .eq('customer_id', customerId)
              .maybeSingle?.() ?? { data: null, error: null } as any;

            if (!errUuid && byUuid) {
              orderRow = byUuid;
            }
          }
        } catch (e) {
          // fallthrough
        }

        if (!orderRow) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: "I couldn't find that order under your account. Please double-check the ID or open your Dashboard to copy the Order ID.",
            ts: Date.now(),
          });
          break;
        }

        // Save into session metadata context
        await supabase
          .from('chat_sessions_v2')
          .update({ metadata: { ...context, verified_order_id: orderRow.order_id } as any })
          .eq('session_id', sessionId);

        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Order verified. You can now upload your payment proof.',
          ts: Date.now(),
        });
        break;
      }

      case 'upload_payment_proof': {
        const config = actionNode.action_config as any;
        const orderIdKey = config?.order_id_key || 'order_id';
        const fileKey = config?.file_key || 'payment_proof_file';
        const orderIdInput = String(context[orderIdKey] || '').trim();
        const fileRef = String(context[fileKey] || '').trim();

        // We expect the chat UI to upload to Supabase Storage first and pass a storage URL reference
        // Example formats we support:
        // - supabase://payment-proofs/<customerId>/<filename>
        // - https://<project>.supabase.co/storage/v1/object/sign/payment-proofs/<path>
        const looksLikeProof = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp|pdf)/i.test(fileRef)
          || /^https?:\/\/.*supabase\.co.*payment-proofs/i.test(fileRef)
          || /^supabase:\/\/payment-proofs\//i.test(fileRef);

        if (!looksLikeProof) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Please upload a valid payment proof file before continuing.',
            ts: Date.now(),
          });
          break;
        }

        // Resolve the order to update
        let resolvedOrderId: string | null = null;
        if ((context as any).verified_order_id) {
          resolvedOrderId = String((context as any).verified_order_id);
        }

        if (!resolvedOrderId && orderIdInput) {
          // Try to resolve using provided order input (display_id or UUID)
          try {
            const { data: byDisplay } = await supabase
              .from('orders_duplicate')
              .select('order_id')
              .eq('display_id', orderIdInput)
              .eq('customer_id', customerId)
              .maybeSingle?.() as any;
            if (byDisplay?.order_id) resolvedOrderId = byDisplay.order_id;
          } catch {}

          if (!resolvedOrderId) {
            try {
              const { data: byUuid } = await supabase
                .from('orders_duplicate')
                .select('order_id')
                .eq('order_id', orderIdInput)
                .eq('customer_id', customerId)
                .maybeSingle?.() as any;
              if (byUuid?.order_id) resolvedOrderId = byUuid.order_id;
            } catch {}
          }
        }

        if (!resolvedOrderId) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'I could not resolve your order. Please provide the correct Order ID first.',
            ts: Date.now(),
          });
          break;
        }

        // Update order with payment proof reference and set status to verifying
        const { error: updateError } = await supabase
          .from('orders_duplicate')
          .update({
            payment_proof: fileRef,
            payment_proof_uploaded_at: new Date().toISOString(),
            status: 'verifying_payment',
          })
          .eq('order_id', resolvedOrderId)
          .eq('customer_id', customerId);

        if (updateError) {
          console.error('Error updating order with payment proof:', updateError);
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Failed to record your payment proof. Please try again.',
            ts: Date.now(),
          });
          break;
        }

        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: 'Your payment proof has been received. Our team will verify it shortly. You will get an update once confirmed.',
          ts: Date.now(),
        });
        break;
      }
      case 'create_quote_conversation': {
        const config = actionNode.action_config as any;
        const detailsKey = config.details_key || 'quote_details';
        const quoteDetails = String(context[detailsKey] || '');

        if (!quoteDetails) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: "No quote details found. Please describe what you'd like to print.",
            ts: Date.now(),
          });
          break;
        }

        // Create quote conversation (matching old AskQuote.ts logic)
        const { data: conversationId, error: convError } = await supabase.rpc(
          'create_quote_conversation',
          { p_customer_id: customerId }
        );

        if (convError || !conversationId) {
          console.error('Failed to create quote conversation:', convError);
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Sorry, there was an error creating your quote request. Please try again.',
            ts: Date.now(),
          });
          break;
        }

        // Fetch the display_id
        const { data: quoteData, error: quoteError } = await supabase
          .from('quote_conversations')
          .select('display_id')
          .eq('conversation_id', conversationId)
          .single();

        if (quoteError || !quoteData?.display_id) {
          console.error('Failed to fetch quote display_id:', quoteError);
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Sorry, there was an error creating your quote request. Please try again.',
            ts: Date.now(),
          });
          break;
        }

        // Add the quote details message to quote_messages
        await supabase.rpc('add_quote_message', {
          p_conversation_id: conversationId,
          p_sender_id: customerId,
          p_sender_role: 'customer',
          p_message_text: quoteDetails,
          p_message_type: 'chat',
        });

        // Link session to quote conversation
        await supabase
          .from('chat_sessions_v2')
          .update({
            metadata: {
              ...context,
              quote_conversation_id: conversationId,
            } as any,
          })
          .eq('session_id', sessionId);

        // Success message matching askQuoteFlow.ts
        const successText = `Your quote request has been submitted successfully! Here is your Quote ID: ${quoteData.display_id}\n\nOur team will review your requirements and send you a detailed proposal with pricing soon. You can track your quote status in your dashboard.\n\nWe'll notify you as soon as we have an update!`;

        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: successText,
          ts: Date.now(),
        });

        await this.insertMessage({
          sessionId,
          text: successText,
          role: 'printy',
          nodeId: actionNode.action,
        });

        break;
      }

      case 'create_inquiry': {
        const config = actionNode.action_config as any;
        const typeKey = config.type_key || 'inquiry_type';
        const detailsKey = config.details_key || 'issue_details';

        const inquiryType = String(context[typeKey] || 'other');
        const issueDetails = String(context[detailsKey] || '');

        if (!issueDetails) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Please provide issue details.',
            ts: Date.now(),
          });
          break;
        }

        // Create inquiry directly - let database auto-generate display_id
        const { data: inquiryData, error } = await supabase
          .from('inquiries')
          .insert({
            customer_id: customerId,
            inquiry_type: inquiryType,
            inquiry_message_enc: issueDetails, // Store as plain text for now
            inquiry_status: 'new',
          })
          .select('inquiry_id, display_id')
          .single();

        if (error) {
          console.error('Failed to create inquiry:', error);
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: "Couldn't create the ticket. Try again later.",
            ts: Date.now(),
          });
          break;
        }

        const inquiryId = inquiryData?.inquiry_id;
        let displayId = inquiryData?.display_id;

        if (!inquiryId) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: "Couldn't create the ticket. Try again later.",
            ts: Date.now(),
          });
          break;
        }

        // Fallback: use inquiry_id if display_id is not available
        if (!displayId) {
          displayId = inquiryId;
        }
        
        // Update session metadata to store inquiry_id
        await supabase
          .from('chat_sessions_v2')
          .update({
            metadata: {
              ...context,
              inquiry_id: inquiryId,
            } as any,
          })
          .eq('session_id', sessionId);

        // Success message matching issueTicketFlow.ts
        let successText = `Your support ticket has been created! Here is your Ticket ID: ${displayId}\n\nOur team will review your issue and get back to you as soon as possible. You can track the status of your ticket in your dashboard.\n\nWe appreciate your patience!`;

        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: successText,
          ts: Date.now(),
        });

        await this.insertMessage({
          sessionId,
          text: successText,
          role: 'printy',
          nodeId: actionNode.action,
        });

        break;
      }

      case 'display_quote_details': {
        const config = actionNode.action_config as any;
        const conversationIdKey = config.conversation_id_key || 'conversation_id';
        const conversationId = String(context[conversationIdKey] || '').trim();

        if (!conversationId) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Quote conversation not found. Please try again.',
            ts: Date.now(),
          });
          break;
        }

        try {
          // Fetch quote conversation details
          const { data: conversation, error: convError } = await supabase
            .from('quote_conversations')
            .select(`
              quote_id,
              display_id,
              status,
              customer_id
            `)
            .eq('conversation_id', conversationId)
            .single();

          if (convError || !conversation) {
            throw new Error('Quote conversation not found');
          }

          // Load customer's original description
          const { data: customerMessages, error: msgError } = await supabase
            .from('quote_messages')
            .select('message_text, sent_at')
            .eq('conversation_id', conversationId)
            .eq('sender_role', 'customer')
            .order('sent_at', { ascending: true });

          if (msgError) {
            throw new Error('Failed to load customer messages');
          }

          let quoteDetailsText = `Your Original Request:\n\n`;
          if (customerMessages && customerMessages.length > 0) {
            const originalRequestText = customerMessages.map(msg => msg.message_text).join('\n');
            quoteDetailsText += originalRequestText;
          } else {
            quoteDetailsText += 'No original request found.';
          }

          // Check for proposals
          const { data: proposals } = await supabase
            .from('quote_proposals')
            .select(`
              proposal_id,
              spec_final,
              quoted_price,
              status,
              notes,
              created_at
            `)
            .eq('conversation_id', conversationId)
            .order('created_at', { ascending: false })
            .limit(1);

          if (proposals && proposals.length > 0) {
            const proposal = proposals[0];
            const specData = proposal.spec_final;

            // Build proposal details
            const proposalDetails = ['Admin Proposal:\n'];
            proposalDetails.push(`• Product: ${specData.product_name || 'Not specified'}`);
            
            if (specData.category) proposalDetails.push(`• Category: ${specData.category}`);
            if (specData.description) proposalDetails.push(`• Description: ${specData.description}`);
            if (specData.size) proposalDetails.push(`• Size: ${specData.size}`);
            if (specData.materials && specData.materials.length > 0) {
              proposalDetails.push(`• Materials: ${specData.materials.join(', ')}`);
            }
            if (specData.color) proposalDetails.push(`• Color: ${specData.color}`);
            if (specData.finishing && specData.finishing.length > 0) {
              proposalDetails.push(`• Finishing: ${specData.finishing.join(', ')}`);
            }
            if (specData.quantity) proposalDetails.push(`• Quantity: ${specData.quantity}`);
            if (specData.deadline) proposalDetails.push(`• Deadline: ${specData.deadline}`);
            if (specData.notes) proposalDetails.push(`• Notes: ${specData.notes}`);
            if (proposal.notes) proposalDetails.push(`• Admin Notes: ${proposal.notes}`);

            quoteDetailsText += '\n\n' + proposalDetails.join('\n');
            quoteDetailsText += `\n\nQuoted Price: ₱${proposal.quoted_price}`;
          } else {
            quoteDetailsText += '\n\nYour quote request is being reviewed by our admin team. We will send you a detailed proposal with pricing soon.';
          }

          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: quoteDetailsText,
            ts: Date.now(),
          });

          // Save the quote details message to the database
          await this.insertMessage({
            sessionId,
            text: quoteDetailsText,
            role: 'printy',
            nodeId: actionNode.action,
          });

          // Store proposal status in context for dynamic options
          const hasProposal = proposals && proposals.length > 0;
          
          // Get current session metadata to update
          const { data: currentSession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', sessionId)
            .single();
            
          if (currentSession) {
            const currentMetadata = currentSession.metadata as SessionMetadata;
            await this.updateSessionMetadata(sessionId, {
              ...currentMetadata,
              context: {
                ...context,
                has_proposal: hasProposal,
                proposal_status: hasProposal ? proposals[0].status : null,
              } as any,
            });
          }

        } catch (error) {
          console.error('Error displaying quote details:', error);
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Error loading quote details. Please try again.',
            ts: Date.now(),
          });
        }

        break;
      }

      case 'accept_quote_proposal': {
        // Store the conversation ID for later database update
        const config = actionNode.action_config as any;
        const conversationIdKey = config.conversation_id_key || 'conversation_id';
        const conversationId = String(context[conversationIdKey] || '').trim();

        if (!conversationId) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Quote conversation not found. Please try again.',
            ts: Date.now(),
          });
          break;
        }

        // Get current metadata and update context
        const { data: currentSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', sessionId)
          .single();

        console.log('[AcceptQuote] Current session metadata before update:', currentSession?.metadata);

        if (currentSession) {
          const currentMetadata = currentSession.metadata as SessionMetadata;
          const updatedMetadata = {
            ...currentMetadata,
            context: {
              ...currentMetadata.context,
              ...context,
              pending_quote_action: 'accept',
              pending_conversation_id: conversationId,
            },
          };
          
          console.log('[AcceptQuote] Updated metadata to save:', updatedMetadata);
          
          await this.updateSessionMetadata(sessionId, updatedMetadata);
          
          // Verify the update
          const { data: verifySession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', sessionId)
            .single();
          console.log('[AcceptQuote] Metadata after update:', verifySession?.metadata);
        }

        console.log('[AcceptQuote] Quote acceptance queued for conversation:', conversationId);
        break;
      }

      case 'reject_quote_proposal': {
        // Store the conversation ID for later database update
        const config = actionNode.action_config as any;
        const conversationIdKey = config.conversation_id_key || 'conversation_id';
        const conversationId = String(context[conversationIdKey] || '').trim();

        if (!conversationId) {
          messages.push({
            id: crypto.randomUUID(),
            role: 'printy',
            text: 'Quote conversation not found. Please try again.',
            ts: Date.now(),
          });
          break;
        }

        // Get current metadata and update context
        const { data: currentSession } = await supabase
          .from('chat_sessions_v2')
          .select('metadata')
          .eq('session_id', sessionId)
          .single();

        console.log('[RejectQuote] Current session metadata before update:', currentSession?.metadata);

        if (currentSession) {
          const currentMetadata = currentSession.metadata as SessionMetadata;
          const updatedMetadata = {
            ...currentMetadata,
            context: {
              ...currentMetadata.context,
              ...context,
              pending_quote_action: 'reject',
              pending_conversation_id: conversationId,
            },
          };
          
          console.log('[RejectQuote] Updated metadata to save:', updatedMetadata);
          
          await this.updateSessionMetadata(sessionId, updatedMetadata);
          
          // Verify the update
          const { data: verifySession } = await supabase
            .from('chat_sessions_v2')
            .select('metadata')
            .eq('session_id', sessionId)
            .single();
          console.log('[RejectQuote] Metadata after update:', verifySession?.metadata);
        }

        console.log('[RejectQuote] Quote rejection queued for conversation:', conversationId);
        break;
      }

      default:
        messages.push({
          id: crypto.randomUUID(),
          role: 'printy',
          text: `Action ${actionNode.action} not yet implemented.`,
          ts: Date.now(),
        });
    }

    return { messages };
  }

  /**
   * Build quick replies from node
   */
  private static buildQuickReplies(node: FlowNode): Array<{
    id: string;
    label: string;
    value: string;
  }> {
    if (node.type === 'message' && node.options) {
      return node.options.map((opt, i) => ({
        id: `qr-${i}`,
        label: opt.label,
        value: opt.label,
      }));
    }

    if (node.type === 'action' && node.options) {
      return node.options.map((opt, i) => ({
        id: `qr-${i}`,
        label: opt.label,
        value: opt.label,
      }));
    }

    // Default quick reply
    return [{ id: 'qr-end', label: 'End Chat', value: 'End Chat' }];
  }

  /**
   * Insert a message to chat_messages_v2
   */
  private static async insertMessage(params: {
    sessionId: string;
    text: string;
    role: 'customer' | 'admin' | 'printy';
    nodeId?: string;
  }): Promise<void> {
    // Note: This should use the RPC function to encrypt the message
    // For now, using a placeholder - you'll need to implement api_insert_chat_message_v2
    const { error } = await supabase.rpc('api_insert_chat_message_v2', {
      p_session_id: params.sessionId,
      p_text: params.text,
      p_role: params.role,
      p_node_id: params.nodeId || null,
    });

    if (error) {
      console.error('Failed to insert message:', error);
    }
  }

  /**
   * Update session metadata
   */
  private static async updateSessionMetadata(
    sessionId: string,
    metadata: SessionMetadata
  ): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions_v2')
      .update({ metadata })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to update session metadata:', error);
    }
  }

  /**
   * End a session
   */
  private static async endSession(sessionId: string): Promise<void> {
    const { error } = await supabase
      .from('chat_sessions_v2')
      .update({
        status: 'ended',
        ended_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Process pending quote actions (accept/reject) after conversation ends
   */
  private static async processPendingQuoteAction(action: string, conversationId: string): Promise<void> {
    try {
      console.log(`[ProcessPendingQuote] Processing ${action} for conversation:`, conversationId);

      // Get the latest proposal
      const { data: proposals, error: fetchError } = await supabase
        .from('quote_proposals')
        .select('proposal_id, status')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) {
        console.error(`[ProcessPendingQuote] Error fetching proposal:`, fetchError);
        return;
      }

      if (!proposals || proposals.length === 0) {
        console.error(`[ProcessPendingQuote] No proposals found for conversation:`, conversationId);
        return;
      }

      const proposal = proposals[0];
      const newStatus = action === 'accept' ? 'accepted' : 'rejected';

      // Update the proposal status
      const { error: proposalError } = await supabase
        .from('quote_proposals')
        .update({ status: newStatus })
        .eq('proposal_id', proposal.proposal_id);

      if (proposalError) {
        console.error(`[ProcessPendingQuote] Error updating proposal status:`, proposalError);
        return;
      }

      console.log(`[ProcessPendingQuote] Proposal status updated to ${newStatus}`);

      // Update conversation status
      console.log(`[ProcessPendingQuote] Attempting to update conversation status to ${newStatus} for conversation_id:`, conversationId);
      
      const { data: updateResult, error: conversationError } = await supabase
        .from('quote_conversations')
        .update({ status: newStatus })
        .eq('conversation_id', conversationId)
        .select();

      if (conversationError) {
        console.error(`[ProcessPendingQuote] Error updating conversation status:`, conversationError);
      } else {
        console.log(`[ProcessPendingQuote] Conversation status update result:`, updateResult);
        console.log(`[ProcessPendingQuote] Conversation status updated to ${newStatus}`);
      }

    } catch (error) {
      console.error(`[ProcessPendingQuote] Unexpected error processing ${action}:`, error);
    }
  }

  /**
   * Fetch all messages for a session
   */
  static async fetchSessionMessages(sessionId: string): Promise<
    Array<{
      id: string;
      role: 'customer' | 'admin' | 'printy';
      text: string;
      ts: number;
    }>
  > {
    // Note: This should use the RPC function to decrypt messages
    // For now, using a placeholder - you'll need to implement api_fetch_chat_messages_v2
    const { data, error } = await supabase.rpc('api_fetch_chat_messages_v2', {
      p_session_id: sessionId,
    });

    if (error) {
      console.error('Failed to fetch messages:', error);
      return [];
    }

    return (data as any[]).map((msg: any) => ({
      id: msg.message_id,
      role: msg.sender_role,
      text: msg.message_text,
      ts: new Date(msg.sent_at).getTime(),
    }));
  }
}

