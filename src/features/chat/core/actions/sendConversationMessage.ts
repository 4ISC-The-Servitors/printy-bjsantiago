/**
 * sendConversationMessage
 * Sends user input through the appropriate driver and returns UI-ready updates.
 */
import { ChatDatabaseService } from '../services/ChatDatabaseService';
import type { DbFlowNode } from '../../../api/chatFlowApi';
import { supabase } from '../../../../lib/supabase';
import type { FlowDriver } from '../adapters/FlowDriver';

type Params = {
  driver: FlowDriver;
  sessionId: string | null;
  activeNodeId?: string | null;
  input: string;
};

export async function sendConversationMessage({
  driver,
  sessionId,
  activeNodeId,
  input,
}: Params) {
  // DB-backed path (About Us, Ask Assistance, Track Ticket)
  if (sessionId) {
    const sid = sessionId;
    const ephemeral: Array<{
      id: string;
      role: 'customer' | 'printy';
      text: string;
      ts: number;
    }> = [];
    ephemeral.push({
      id: crypto.randomUUID(),
      role: 'customer',
      text: input,
      ts: Date.now(),
    });

    // Check if this session is linked to a quote conversation for dual-write
    const quoteConvIdForCustomer =
      await ChatDatabaseService.getQuoteConversationIdFromSession(sid);
    const customerIdForDualWrite =
      await ChatDatabaseService.fetchSessionCustomerId(sid);

    // Persist user's message with correct sender role and node context
    const current = activeNodeId
      ? { node_id: activeNodeId }
      : await ChatDatabaseService.fetchCurrentNode(sid);
    await ChatDatabaseService.insertMessage({
      sessionId: sid,
      text: input,
      role: 'customer',
      nodeId: (current as any)?.node_id || undefined,
    });

    // Dual-write customer message to quote_messages if in quote flow
    if (quoteConvIdForCustomer && customerIdForDualWrite) {
      await ChatDatabaseService.insertQuoteMessage({
        conversationId: quoteConvIdForCustomer,
        senderId: customerIdForDualWrite,
        senderRole: 'customer',
        messageText: input,
        messageType: 'chat',
      });
    }
    // Resolve transition from current node with support for node_action
    const node = (await ChatDatabaseService.fetchCurrentNode(sid)) as
      | (DbFlowNode & { action_config?: any })
      | null;
    const options = node
      ? await ChatDatabaseService.fetchOptions(node.node_id)
      : [];

    const normalized = input.trim();

    // Check if this session is linked to a quote conversation for dual-write
    const quoteConvId =
      await ChatDatabaseService.getQuoteConversationIdFromSession(sid);
    const customerId = await ChatDatabaseService.fetchSessionCustomerId(sid);

    // Helper: push a bot message (with dual-write to quote_messages if in quote flow)
    const say = async (
      text: string,
      nodeId?: string | null,
      messageType: 'chat' | 'system' = 'chat'
    ) => {
      await ChatDatabaseService.insertMessage({
        sessionId: sid,
        text,
        role: 'printy',
        nodeId: nodeId ?? node?.node_id,
      });

      // Dual-write to quote_messages if this session is linked to a quote conversation
      if (quoteConvId && customerId) {
        await ChatDatabaseService.insertQuoteMessage({
          conversationId: quoteConvId,
          senderId: customerId,
          senderRole: 'printy',
          messageText: text,
          messageType,
        });
      }

      ephemeral.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text,
        ts: Date.now(),
      });
    };

    let handledByAction = false;
    let dynamicQuickReplies: Array<{
      id: string;
      label: string;
      value: string;
    }> | null = null;

    // First, prefer matching an option (quick reply). If no match, fall back to node_action.
    const match = options.find(
      (o: any) => o.label.toLowerCase() === normalized.toLowerCase()
    );

    if (!match && node) {
      const action = (node.node_action as string) || 'none';
      const cfg = (node.action_config as any) || {};

      switch (action) {
        case 'expects_input': {
          const inputKey = String(cfg?.input_key || 'details');
          const append = Boolean(cfg?.append ?? true);
          const autoTransition = String(cfg?.auto_transition || '');
          const flow = await ChatDatabaseService.fetchSessionFlow(sid);
          if (flow) {
            const nextCtx: Record<string, unknown> = {
              ...(flow.context || {}),
            };
            if (append) {
              const prev = String((nextCtx[inputKey] as string) || '');
              nextCtx[inputKey] = prev ? `${prev}\n${normalized}` : normalized;
            } else {
              nextCtx[inputKey] = normalized;
            }
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }

          // If auto_transition is specified, move to that node instead of showing confirmation
          if (autoTransition) {
            await ChatDatabaseService.updateCurrentNode(sid, autoTransition);
            const nextNode = (await ChatDatabaseService.fetchCurrentNode(
              sid
            )) as (DbFlowNode & { action_config?: any }) | null;
            if (nextNode) {
              // Execute the next node's action immediately
              const nextAction = (nextNode.node_action as string) || 'none';
              const nextCfg = (nextNode.action_config as any) || {};

              if (nextAction === 'create_quote_conversation') {
                // Execute create_quote_conversation action
                const detailsKey = String(
                  nextCfg?.details_key || 'quote_details'
                );
                const flowData =
                  await ChatDatabaseService.fetchSessionFlow(sid);
                const quoteDetails = String(
                  (flowData?.context?.[detailsKey] as string) || ''
                );

                if (!quoteDetails) {
                  await say(
                    "No quote details found. Please describe what you'd like to print.",
                    nextNode.node_id
                  );
                  handledByAction = true;
                  break;
                }

                const customerId =
                  await ChatDatabaseService.fetchSessionCustomerId(sid);
                if (!customerId) {
                  await say(
                    'Sorry, there was an error identifying your account. Please try again.',
                    nextNode.node_id
                  );
                  handledByAction = true;
                  break;
                }

                // Create quote conversation
                const { conversationId, displayId } =
                  await ChatDatabaseService.createQuoteConversation({
                    customerId,
                  });

                if (!conversationId) {
                  await say(
                    'Sorry, there was an error creating your quote request. Please try again.',
                    nextNode.node_id
                  );
                  dynamicQuickReplies = [
                    { id: 'qr-try', label: 'Try again', value: 'Try again' },
                    { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
                  ];
                  handledByAction = true;
                  break;
                }

                // Link chat session to quote conversation
                await ChatDatabaseService.linkSessionToQuoteConversation({
                  sessionId: sid,
                  conversationId,
                });

                // Dual-write: Add customer's quote details to quote_messages table
                await ChatDatabaseService.insertQuoteMessage({
                  conversationId,
                  senderId: customerId,
                  senderRole: 'customer',
                  messageText: quoteDetails,
                  messageType: 'chat',
                });

                // Send success messages
                const successText = displayId
                  ? `Thank you for providing those details! I've created your quote request.\n\nQuote Request: ${displayId}\n\nAdmin will review your request and get back to you with pricing and details.`
                  : "Thank you for providing those details! I've created your quote request.\n\nAdmin will review your request and get back to you with pricing and details.";

                await say(successText, nextNode.node_id, 'system');

                // Dual-write: Also add Printy's success message to quote_messages
                await ChatDatabaseService.insertQuoteMessage({
                  conversationId,
                  senderId: customerId,
                  senderRole: 'printy',
                  messageText: successText,
                  messageType: 'system',
                });

                // Reset context after submission
                if (flowData) {
                  const nextCtx = { ...(flowData.context || {}) } as Record<
                    string,
                    unknown
                  >;
                  delete (nextCtx as any)[detailsKey];
                  await ChatDatabaseService.setSessionContext(sid, nextCtx);
                }
              }
            }
            handledByAction = true;
            break;
          }

          // Default behavior for expects_input without auto_transition
          await say(
            "Got it. I've added that to your ticket notes. You can add more details or choose 'Submit ticket' when ready.",
            node.node_id
          );
          handledByAction = true;
          break;
        }
        case 'lookup_order': {
          const sanitizer = String(cfg?.input_sanitizer || 'alnumdash');
          let orderId = normalized;
          if (sanitizer === 'alnumdash') {
            orderId = orderId.replace(/[^a-zA-Z0-9-]/g, '');
          }
          if (!orderId) {
            await say(
              String(
                cfg?.error_message || 'Please enter a valid order number.'
              ),
              node.node_id
            );
            handledByAction = true;
            break;
          }
          const customerCtxId =
            await ChatDatabaseService.fetchSessionCustomerId(sid);
          const summary =
            await ChatDatabaseService.fetchOrderSummaryForCustomer(
              orderId,
              customerCtxId || ''
            );
          if (!summary) {
            await say(
              `Order ${orderId} not found or you are not authorized to view it.`,
              node.node_id
            );
            handledByAction = true;
            break;
          }
          const lines = [
            `Order ${summary.order_id} — Status: ${summary.order_status ?? 'N/A'}`,
            `Placed: ${summary.order_datetime ? new Date(summary.order_datetime).toLocaleString() : 'N/A'}`,
          ];
          await say(lines.join('\n'), node.node_id);
          // Optionally update context with order id
          const orderIdKey = String(cfg?.order_id_context_key || 'order_id');
          const flow2 = await ChatDatabaseService.fetchSessionFlow(sid);
          if (flow2) {
            const nextCtx = {
              ...(flow2.context || {}),
              [orderIdKey]: summary.order_id,
            } as Record<string, unknown>;
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }
          // Transition to next node if configured
          const nextOnFound = String(cfg?.next_on_found || '');
          if (nextOnFound) {
            await ChatDatabaseService.updateCurrentNode(sid, nextOnFound);
            const next = await ChatDatabaseService.fetchCurrentNode(sid);
            if (next) {
              await say(next.text, next.node_id);
              const nextCfg = (next.action_config as any) || {};
              const nextAction = (next.node_action as string) || 'none';
              if (
                nextCfg?.set_on_enter &&
                typeof nextCfg.set_on_enter === 'object'
              ) {
                const flow = await ChatDatabaseService.fetchSessionFlow(sid);
                if (flow) {
                  const nextCtx = {
                    ...(flow.context || {}),
                    ...nextCfg.set_on_enter,
                  };
                  await ChatDatabaseService.setSessionContext(sid, nextCtx);
                }
              }
              if (nextAction === 'list_recent_orders') {
                const limit = Number(nextCfg?.limit ?? 10);
                const customerCtxId =
                  await ChatDatabaseService.fetchSessionCustomerId(sid);
                const orders = customerCtxId
                  ? await ChatDatabaseService.listRecentOrdersForCustomer(
                      customerCtxId,
                      limit
                    )
                  : [];
                if (!orders || orders.length === 0) {
                  await say(
                    "I couldn't find any past orders for your account.",
                    next.node_id
                  );
                } else {
                  const lines: string[] = [
                    String(nextCfg?.prompt || 'Here are your recent orders:'),
                    '',
                  ];
                  for (const o of orders) {
                    lines.push(
                      `${new Date(o.order_datetime).toLocaleDateString()} — ${o.order_id}`
                    );
                  }
                  await say(lines.join('\n'), next.node_id);
                  dynamicQuickReplies = orders.map((o, i) => ({
                    id: `qr-${i}`,
                    label: o.order_id,
                    value: o.order_id,
                  }));
                }
              }
            }
          }
          handledByAction = true;
          break;
        }
        case 'list_recent_orders': {
          const limit = Number(cfg?.limit ?? 10);
          const customerCtxId =
            await ChatDatabaseService.fetchSessionCustomerId(sid);
          const orders = customerCtxId
            ? await ChatDatabaseService.listRecentOrdersForCustomer(
                customerCtxId,
                limit
              )
            : [];
          // If user typed or clicked an order id, attempt to select it
          const typedId = normalized.replace(/[^a-zA-Z0-9-]/g, '');
          if (typedId && customerCtxId) {
            const summary =
              await ChatDatabaseService.fetchOrderSummaryForCustomer(
                typedId,
                customerCtxId
              );
            if (summary) {
              const lines = [
                `Order ${summary.order_id} — Status: ${summary.order_status ?? 'N/A'}`,
                `Placed: ${summary.order_datetime ? new Date(summary.order_datetime).toLocaleString() : 'N/A'}`,
              ];
              await say(lines.join('\n'), node.node_id);
              // Save chosen order_id in context
              const flow2 = await ChatDatabaseService.fetchSessionFlow(sid);
              if (flow2) {
                const nextCtx = {
                  ...(flow2.context || {}),
                  order_id: summary.order_id,
                } as Record<string, unknown>;
                await ChatDatabaseService.setSessionContext(sid, nextCtx);
              }
              // Move to issue menu
              const nextOnSelect = String(
                cfg?.next_on_select || 'order_issue_menu'
              );
              await ChatDatabaseService.updateCurrentNode(sid, nextOnSelect);
              const nextNode = await ChatDatabaseService.fetchCurrentNode(sid);
              if (nextNode) await say(nextNode.text, nextNode.node_id);
              handledByAction = true;
              break;
            }
          }
          // Otherwise, re-list recent orders
          if (!orders || orders.length === 0) {
            await say(
              "I couldn't find any past orders for your account.",
              node.node_id
            );
          } else {
            const lines: string[] = [
              String(cfg?.prompt || 'Here are your recent orders:'),
              '',
            ];
            for (const o of orders) {
              lines.push(
                `${new Date(o.order_datetime).toLocaleDateString()} — ${o.order_id}`
              );
            }
            await say(lines.join('\n'), node.node_id);
            dynamicQuickReplies = orders.map((o, i) => ({
              id: `qr-${i}`,
              label: o.order_id,
              value: o.order_id,
            }));
          }
          handledByAction = true;
          break;
        }
        case 'ticket_status_query': {
          const sanitizer = String(cfg?.input_sanitizer || 'alnumdash');
          let inquiryId = normalized;
          if (sanitizer === 'alnumdash') {
            inquiryId = inquiryId.replace(/[^a-zA-Z0-9-]/g, '');
          }
          if (!inquiryId) {
            await say(
              String(
                cfg?.error_message ||
                  'Please enter a valid ticket number (inquiry ID).'
              ),
              node.node_id
            );
            handledByAction = true;
            break;
          }
          const inquiry = await ChatDatabaseService.fetchInquiryById(inquiryId);
          if (!inquiry) {
            await say(
              `I couldn't find a ticket with ID "${inquiryId}". Please check and try again.`,
              node.node_id
            );
            handledByAction = true;
            break;
          }
          const lines = [
            `Ticket ID: ${inquiry.inquiry_id}`,
            `Issue submitted: ${inquiry.inquiry_message || '(no message provided)'}`,
            `Issue type: ${inquiry.inquiry_type || '(not specified)'}`,
            `Received: ${new Date(inquiry.received_at).toLocaleString()}`,
            `Status: ${inquiry.inquiry_status}`,
            inquiry.resolution_comments
              ? `Resolution: ${inquiry.resolution_comments}`
              : 'Resolution: (not yet provided)',
          ];
          await say(lines.join('\n'), node.node_id);
          handledByAction = true;
          break;
        }
        case 'create_inquiry': {
          const detailsKey = String(cfg?.details_key || 'details');
          const typeKey = String(cfg?.type_key || 'inquiry_type');
          const flow = await ChatDatabaseService.fetchSessionFlow(sid);
          const message = String(
            (flow?.context?.[detailsKey] as string) || '(no details provided)'
          );
          const inquiryType = String(
            (flow?.context?.[typeKey] as string) || 'other'
          );
          const created = await ChatDatabaseService.createInquiryWithTurnstile({
            message,
            inquiry_type: inquiryType,
          });
          if (!created.ok) {
            await say(
              "Couldn't create the ticket. Try again later.",
              node.node_id
            );
            // Offer a Try again quick reply so the user can re-attempt without refreshing
            dynamicQuickReplies = [
              { id: 'qr-try', label: 'Try again', value: 'Try again' },
              { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
            ];
            handledByAction = true;
            break;
          }
          await say(
            String(cfg?.success_message || 'Ticket submitted successfully!'),
            node.node_id
          );
          if (cfg?.show_inquiry_id && created.inquiry_id) {
            await say(
              `Your ticket number is: ${created.inquiry_id}`,
              node.node_id
            );
          }
          // Reset relevant context after submission
          if (flow) {
            const nextCtx = { ...(flow.context || {}) } as Record<
              string,
              unknown
            >;
            delete (nextCtx as any)[detailsKey];
            delete (nextCtx as any)[typeKey];
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }
          handledByAction = true;
          break;
        }
        case 'set_context': {
          const kv = (cfg?.set || {}) as Record<string, unknown>;
          const flow = await ChatDatabaseService.fetchSessionFlow(sid);
          if (flow) {
            const nextCtx = { ...(flow.context || {}), ...kv };
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }
          handledByAction = false; // allow normal option transition
          break;
        }
        case 'create_quote_conversation': {
          const detailsKey = String(cfg?.details_key || 'quote_details');
          const flow = await ChatDatabaseService.fetchSessionFlow(sid);
          const quoteDetails = String(
            (flow?.context?.[detailsKey] as string) || ''
          );

          if (!quoteDetails) {
            await say(
              "No quote details found. Please describe what you'd like to print.",
              node.node_id
            );
            handledByAction = true;
            break;
          }

          const customerId =
            await ChatDatabaseService.fetchSessionCustomerId(sid);
          if (!customerId) {
            await say(
              'Sorry, there was an error identifying your account. Please try again.',
              node.node_id
            );
            handledByAction = true;
            break;
          }

          // Create quote conversation
          const { conversationId, displayId } =
            await ChatDatabaseService.createQuoteConversation({
              customerId,
            });

          if (!conversationId) {
            await say(
              'Sorry, there was an error creating your quote request. Please try again.',
              node.node_id
            );
            dynamicQuickReplies = [
              { id: 'qr-try', label: 'Try again', value: 'Try again' },
              { id: 'qr-end', label: 'End Chat', value: 'End Chat' },
            ];
            handledByAction = true;
            break;
          }

          // Link chat session to quote conversation
          await ChatDatabaseService.linkSessionToQuoteConversation({
            sessionId: sid,
            conversationId,
          });

          // Dual-write: Add customer's quote details to quote_messages table
          await ChatDatabaseService.insertQuoteMessage({
            conversationId,
            senderId: customerId,
            senderRole: 'customer',
            messageText: quoteDetails,
            messageType: 'chat',
          });

          // Send success messages
          const successText = displayId
            ? `Thank you for providing those details! I've created your quote request.\n\nQuote Request: ${displayId}\n\nAdmin will review your request and get back to you with pricing and details.`
            : "Thank you for providing those details! I've created your quote request.\n\nAdmin will review your request and get back to you with pricing and details.";

          await say(successText, node.node_id);

          // Dual-write: Also add Printy's success message to quote_messages
          await ChatDatabaseService.insertQuoteMessage({
            conversationId,
            senderId: customerId, // System messages attributed to customer context
            senderRole: 'printy',
            messageText: successText,
            messageType: 'system',
          });

          // Reset context after submission
          if (flow) {
            const nextCtx = { ...(flow.context || {}) } as Record<
              string,
              unknown
            >;
            delete (nextCtx as any)[detailsKey];
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }

          handledByAction = true;
          break;
        }
        default:
          break;
      }
    }

    if (!handledByAction) {
      if (normalized.toLowerCase() === 'try again') {
        // re-run the current node action (if any) using the last known context
        // add a small hint
        await say('Retrying...', node?.node_id);
        handledByAction = false; // fall through to option resolution to re-trigger flow
      }
      if (!match) {
        await ChatDatabaseService.insertMessage({
          sessionId: sid,
          text: 'Please choose one of the options.',
          role: 'printy',
          nodeId: activeNodeId || node?.node_id,
        });
      } else {
        await ChatDatabaseService.updateCurrentNode(sid, match.to_node_id);
        const next = (await ChatDatabaseService.fetchCurrentNode(sid)) as
          | (DbFlowNode & { action_config?: any })
          | null;
        if (next) {
          await say(next.text, next.node_id);
          const nextCfg = (next.action_config as any) || {};
          const nextAction = (next.node_action as string) || 'none';
          // Apply on-enter set_on_enter when arriving to next node
          if (
            nextCfg?.set_on_enter &&
            typeof nextCfg.set_on_enter === 'object'
          ) {
            const flow = await ChatDatabaseService.fetchSessionFlow(sid);
            if (flow) {
              const nextCtx = {
                ...(flow.context || {}),
                ...nextCfg.set_on_enter,
              };
              await ChatDatabaseService.setSessionContext(sid, nextCtx);
            }
          }
          switch (nextAction) {
            case 'list_recent_orders': {
              const limit = Number(nextCfg?.limit ?? 10);
              const customerCtxId =
                await ChatDatabaseService.fetchSessionCustomerId(sid);
              const orders = customerCtxId
                ? await ChatDatabaseService.listRecentOrdersForCustomer(
                    customerCtxId,
                    limit
                  )
                : [];
              // If the last input is an order id, select it and move forward
              const typedId = normalized.replace(/[^a-zA-Z0-9-]/g, '');
              if (typedId && customerCtxId) {
                const summary =
                  await ChatDatabaseService.fetchOrderSummaryForCustomer(
                    typedId,
                    customerCtxId
                  );
                if (summary) {
                  const lines = [
                    `Order ${summary.order_id} — Status: ${summary.order_status ?? 'N/A'}`,
                    `Placed: ${summary.order_datetime ? new Date(summary.order_datetime).toLocaleString() : 'N/A'}`,
                  ];
                  await say(lines.join('\n'), next.node_id);
                  const flow2 = await ChatDatabaseService.fetchSessionFlow(sid);
                  if (flow2) {
                    const nextCtx = {
                      ...(flow2.context || {}),
                      order_id: summary.order_id,
                    } as Record<string, unknown>;
                    await ChatDatabaseService.setSessionContext(sid, nextCtx);
                  }
                  const nextOnSelect = String(
                    nextCfg?.next_on_select || 'order_issue_menu'
                  );
                  await ChatDatabaseService.updateCurrentNode(
                    sid,
                    nextOnSelect
                  );
                  const after = await ChatDatabaseService.fetchCurrentNode(sid);
                  if (after) await say(after.text, after.node_id);
                  break;
                }
              }
              if (!orders || orders.length === 0) {
                await say(
                  "I couldn't find any past orders for your account.",
                  next.node_id
                );
              } else {
                const lines: string[] = [
                  String(nextCfg?.prompt || 'Here are your recent orders:'),
                  '',
                ];
                for (const o of orders) {
                  lines.push(
                    `${new Date(o.order_datetime).toLocaleDateString()} — ${o.order_id}`
                  );
                }
                await say(lines.join('\n'), next.node_id);
                dynamicQuickReplies = orders.map((o, i) => ({
                  id: `qr-${i}`,
                  label: o.order_id,
                  value: o.order_id,
                }));
              }
              break;
            }
            case 'create_inquiry': {
              const detailsKey = String(nextCfg?.details_key || 'details');
              const typeKey = String(nextCfg?.type_key || 'inquiry_type');
              const flow = await ChatDatabaseService.fetchSessionFlow(sid);
              const message = String(
                (flow?.context?.[detailsKey] as string) ||
                  '(no details provided)'
              );
              const inquiryType = String(
                (flow?.context?.[typeKey] as string) || 'other'
              );
              const created =
                await ChatDatabaseService.createInquiryWithTurnstile({
                  message,
                  inquiry_type: inquiryType,
                });
              if (!created.ok) {
                await say(
                  "Couldn't create the ticket. Try again later.",
                  next.node_id
                );
                break;
              }
              await say(
                String(
                  nextCfg?.success_message || 'Ticket submitted successfully!'
                ),
                next.node_id
              );
              if (nextCfg?.show_inquiry_id && created.inquiry_id) {
                await say(
                  `Your ticket number is: ${created.inquiry_id}`,
                  next.node_id
                );
              }
              // Reset context
              if (flow) {
                const nextCtx = { ...(flow.context || {}) } as Record<
                  string,
                  unknown
                >;
                delete (nextCtx as any)[detailsKey];
                delete (nextCtx as any)[typeKey];
                await ChatDatabaseService.setSessionContext(sid, nextCtx);
              }
              break;
            }
            case 'set_context': {
              const kv = (nextCfg?.set || {}) as Record<string, unknown>;
              const flow = await ChatDatabaseService.fetchSessionFlow(sid);
              if (flow) {
                const nextCtx = { ...(flow.context || {}), ...kv };
                await ChatDatabaseService.setSessionContext(sid, nextCtx);
              }
              break;
            }
            default:
              break;
          }
        }
      }
    }
    const messages = await ChatDatabaseService.fetchSessionMessages(sid);
    const now = await ChatDatabaseService.fetchCurrentNode(sid);
    const newOptions = now
      ? await ChatDatabaseService.fetchOptions(now.node_id)
      : [];
    const quickReplies =
      dynamicQuickReplies && dynamicQuickReplies.length
        ? dynamicQuickReplies
        : (newOptions.length ? newOptions : [{ label: 'End Chat' }]).map(
            (o: any, i: number) => ({
              id: `qr-${i}`,
              label: o.label,
              value: o.label,
            })
          );
    const usedFallback = !messages || messages.length === 0;
    const outgoing = usedFallback
      ? ephemeral.filter(m => m.role === 'printy')
      : messages;
    return {
      messages: outgoing,
      quickReplies,
      activeNodeId: now?.node_id || null,
      mergeMode: usedFallback ? 'append' : 'replace',
    } as const;
  }

  // Scripted path (including QuoteFlowDriver)
  // Get customer context for quote flows
  let ctx = {};
  if (driver.id === 'ask-quote') {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const customerId = sessionData?.session?.user?.id;
      if (customerId) {
        ctx = {
          customerId,
          sessionId: sessionId || crypto.randomUUID(), // Generate session ID for quote flows
        };
      }
    } catch (e) {
      console.warn('Could not get customer context for quote flow:', e);
    }
  }

  const resp = await driver.respond(ctx, input);
  const botMessages = (resp.messages || []).map(m => ({
    id: crypto.randomUUID(),
    role: 'printy' as const,
    text: m.text,
    ts: Date.now(),
  }));
  const quickReplies = (resp.quickReplies || []).map(
    (l: string, i: number) => ({ id: `qr-${i}`, label: l, value: l })
  );
  return { messages: botMessages, quickReplies, activeNodeId: null } as const;
}
