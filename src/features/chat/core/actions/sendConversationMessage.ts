/**
 * sendConversationMessage
 * Sends user input through the appropriate driver and returns UI-ready updates.
 */
import { ChatDatabaseService } from '../services/ChatDatabaseService';
import type { DbFlowNode } from '../../../api/chatFlowApi';
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
  // DB-backed path (About Us, Issue Ticket)
  if (sessionId) {
    const sid = sessionId;
    await ChatDatabaseService.insertMessage({
      sessionId: sid,
      text: input,
      role: 'user',
    });
    // Resolve transition from current node with support for node_action
    const node = (await ChatDatabaseService.fetchCurrentNode(sid)) as
      | (DbFlowNode & { action_config?: any })
      | null;
    const options = node
      ? await ChatDatabaseService.fetchOptions(node.node_id)
      : [];

    const normalized = input.trim();

    // Helper: push a bot message
    const say = async (text: string, nodeId?: string | null) => {
      await ChatDatabaseService.insertMessage({
        sessionId: sid,
        text,
        role: 'printy',
        nodeId: nodeId ?? node?.node_id,
      });
    };

    let handledByAction = false;
    let dynamicQuickReplies: Array<{ id: string; label: string; value: string }> | null = null;

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
          const flow = await ChatDatabaseService.fetchSessionFlow(sid);
          if (flow) {
            const nextCtx: Record<string, unknown> = { ...(flow.context || {}) };
            if (append) {
              const prev = String((nextCtx[inputKey] as string) || '');
              nextCtx[inputKey] = prev ? `${prev}\n${normalized}` : normalized;
            } else {
              nextCtx[inputKey] = normalized;
            }
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }
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
            await say(String(cfg?.error_message || 'Please enter a valid order number.'), node.node_id);
            handledByAction = true;
            break;
          }
          const customerCtxId = await ChatDatabaseService.fetchSessionCustomerId(sid);
          const summary = await ChatDatabaseService.fetchOrderSummaryForCustomer(
            orderId,
            customerCtxId || ''
          );
          if (!summary) {
            await say(`Order ${orderId} not found or you are not authorized to view it.`, node.node_id);
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
            const nextCtx = { ...(flow2.context || {}), [orderIdKey]: summary.order_id } as Record<string, unknown>;
            await ChatDatabaseService.setSessionContext(sid, nextCtx);
          }
          // Transition to next node if configured
          const nextOnFound = String(cfg?.next_on_found || '');
          if (nextOnFound) {
            await ChatDatabaseService.updateCurrentNode(sid, nextOnFound);
            const next = await ChatDatabaseService.fetchCurrentNode(sid);
            if (next) {
              await say(next.text, next.node_id);
            }
          }
          handledByAction = true;
          break;
        }
        case 'list_recent_orders': {
          const limit = Number(cfg?.limit ?? 10);
          const customerCtxId = await ChatDatabaseService.fetchSessionCustomerId(sid);
          const orders = customerCtxId
            ? await ChatDatabaseService.listRecentOrdersForCustomer(customerCtxId, limit)
            : [];
          if (!orders || orders.length === 0) {
            await say("I couldn't find any past orders for your account.", node.node_id);
          } else {
            const lines: string[] = [
              String(cfg?.prompt || 'Here are your recent orders:'),
              '',
            ];
            for (const o of orders) {
              lines.push(`${new Date(o.order_datetime).toLocaleDateString()} — ${o.order_id}`);
            }
            await say(lines.join('\n'), node.node_id);
            dynamicQuickReplies = orders.map((o, i) => ({ id: `qr-${i}`, label: o.order_id, value: o.order_id }));
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
            await say(String(cfg?.error_message || 'Please enter a valid ticket number (inquiry ID).'), node.node_id);
            handledByAction = true;
            break;
          }
          const inquiry = await ChatDatabaseService.fetchInquiryById(inquiryId);
          if (!inquiry) {
            await say(`I couldn't find a ticket with ID "${inquiryId}". Please check and try again.`, node.node_id);
            handledByAction = true;
            break;
          }
          const lines = [
            `Ticket ID: ${inquiry.inquiry_id}`,
            `Issue submitted: ${inquiry.inquiry_message || '(no message provided)'}`,
            `Issue type: ${inquiry.inquiry_type || '(not specified)'}`,
            `Received: ${new Date(inquiry.received_at).toLocaleString()}`,
            `Status: ${inquiry.inquiry_status}`,
            inquiry.resolution_comments ? `Resolution: ${inquiry.resolution_comments}` : 'Resolution: (not yet provided)',
          ];
          await say(lines.join('\n'), node.node_id);
          handledByAction = true;
          break;
        }
        case 'create_inquiry': {
          const detailsKey = String(cfg?.details_key || 'details');
          const typeKey = String(cfg?.type_key || 'inquiry_type');
          const flow = await ChatDatabaseService.fetchSessionFlow(sid);
          const message = String((flow?.context?.[detailsKey] as string) || '(no details provided)');
          const inquiryType = String((flow?.context?.[typeKey] as string) || 'other');
          const created = await ChatDatabaseService.createInquiryWithTurnstile({
            message,
            inquiry_type: inquiryType,
          });
          if (!created.ok) {
            await say("Couldn't create the ticket. Try again later.", node.node_id);
            handledByAction = true;
            break;
          }
          await say(String(cfg?.success_message || 'Ticket submitted successfully!'), node.node_id);
          if (cfg?.show_inquiry_id && created.inquiry_id) {
            await say(`Your ticket number is: ${created.inquiry_id}`, node.node_id);
          }
          // Reset relevant context after submission
          if (flow) {
            const nextCtx = { ...(flow.context || {}) } as Record<string, unknown>;
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
        default:
          break;
      }
    }

    if (!handledByAction) {
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
          await ChatDatabaseService.insertMessage({
            sessionId: sid,
            text: next.text,
            role: 'printy',
            nodeId: next.node_id,
          });
          const nextCfg = (next.action_config as any) || {};
          const nextAction = (next.node_action as string) || 'none';
          // Apply on-enter set_on_enter when arriving to next node
          if (nextCfg?.set_on_enter && typeof nextCfg.set_on_enter === 'object') {
            const flow = await ChatDatabaseService.fetchSessionFlow(sid);
            if (flow) {
              const nextCtx = { ...(flow.context || {}), ...nextCfg.set_on_enter };
              await ChatDatabaseService.setSessionContext(sid, nextCtx);
            }
          }
          switch (nextAction) {
            case 'list_recent_orders': {
              const limit = Number(nextCfg?.limit ?? 10);
              const customerCtxId = await ChatDatabaseService.fetchSessionCustomerId(sid);
              const orders = customerCtxId
                ? await ChatDatabaseService.listRecentOrdersForCustomer(customerCtxId, limit)
                : [];
              if (!orders || orders.length === 0) {
                await say("I couldn't find any past orders for your account.", next.node_id);
              } else {
                const lines: string[] = [
                  String(nextCfg?.prompt || 'Here are your recent orders:'),
                  '',
                ];
                for (const o of orders) {
                  lines.push(`${new Date(o.order_datetime).toLocaleDateString()} — ${o.order_id}`);
                }
                await say(lines.join('\n'), next.node_id);
                dynamicQuickReplies = orders.map((o, i) => ({ id: `qr-${i}`, label: o.order_id, value: o.order_id }));
              }
              break;
            }
            case 'create_inquiry': {
              const detailsKey = String(nextCfg?.details_key || 'details');
              const typeKey = String(nextCfg?.type_key || 'inquiry_type');
              const flow = await ChatDatabaseService.fetchSessionFlow(sid);
              const message = String((flow?.context?.[detailsKey] as string) || '(no details provided)');
              const inquiryType = String((flow?.context?.[typeKey] as string) || 'other');
              const created = await ChatDatabaseService.createInquiryWithTurnstile({
                message,
                inquiry_type: inquiryType,
              });
              if (!created.ok) {
                await say("Couldn't create the ticket. Try again later.", next.node_id);
                break;
              }
              await say(String(nextCfg?.success_message || 'Ticket submitted successfully!'), next.node_id);
              if (nextCfg?.show_inquiry_id && created.inquiry_id) {
                await say(`Your ticket number is: ${created.inquiry_id}`, next.node_id);
              }
              // Reset context
              if (flow) {
                const nextCtx = { ...(flow.context || {}) } as Record<string, unknown>;
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
    const quickReplies = (dynamicQuickReplies && dynamicQuickReplies.length
      ? dynamicQuickReplies
      : (newOptions.length ? newOptions : [{ label: 'End Chat' }]).map((o: any, i: number) => ({
          id: `qr-${i}`,
          label: o.label,
          value: o.label,
        }))
    );
    return {
      messages,
      quickReplies,
      activeNodeId: now?.node_id || null,
    } as const;
  }

  // Scripted path
  const resp = await driver.respond({}, input);
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
