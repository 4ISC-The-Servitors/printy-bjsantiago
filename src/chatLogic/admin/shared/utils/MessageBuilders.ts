// Message building utilities for all chat flows

import type { BotMessage } from '../../../types/chatFlow';

export function createEndChatMessage(): BotMessage {
  return { role: 'printy', text: 'Thanks! Chat ended.' };
}

export function createErrorMessage(message: string): BotMessage {
  return { role: 'printy', text: message };
}

export function createSuccessMessage(message: string): BotMessage {
  return { role: 'printy', text: `✅ ${message}` };
}

export function createInfoMessage(message: string): BotMessage {
  return { role: 'printy', text: message };
}

export function createStatusChangeMessage(
  id: string,
  prevStatus: string,
  newStatus: string
): BotMessage {
  return {
    role: 'printy',
    text: `✅ ${id}: ${prevStatus} → ${newStatus}`,
  };
}

export function createQuoteCreatedMessage(
  id: string,
  total: string
): BotMessage {
  return {
    role: 'printy',
    text: `📋 Quote created for ${id}. Set to Pending with total ${total}.`,
  };
}

export function createServiceUpdatedMessage(
  code: string,
  field: string,
  oldValue: string,
  newValue: string
): BotMessage {
  return {
    role: 'printy',
    text: `✅ Updated ${code} ${field}: "${oldValue}" → "${newValue}"`,
  };
}

export function createTicketReplyMessage(ticketId: string): BotMessage {
  return {
    role: 'printy',
    text: `📩 Reply posted to ${ticketId}.`,
  };
}

export function createSelectionListMessage(
  items: Array<{ id: string; name: string; status: string; category?: string }>,
  type: 'order' | 'service' | 'ticket'
): BotMessage[] {
  const msgs: BotMessage[] = [
    { role: 'printy', text: `You selected ${items.length} ${type}(s):` },
  ];

  items.forEach(item => {
    const categoryText = item.category ? ` • ${item.category}` : '';
    msgs.push({
      role: 'printy',
      text: `${item.id} • ${item.name} • ${item.status}${categoryText}`,
    });
  });

  return msgs;
}

export function createRemainingCountMessage(
  remaining: number,
  type: string
): BotMessage {
  return {
    role: 'printy',
    text: `Next ${type} to work on? (${remaining} remaining)`,
  };
}
