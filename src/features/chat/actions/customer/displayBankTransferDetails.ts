import { supabase } from '@lib/supabase';
import type { ActionHandler } from '@features/chat/types';

export const displayBankTransferDetails: ActionHandler = async () => {
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Fetch bank transfer payment methods
    const { data: bankTransferMethods, error } = await supabase
      .from('payment_methods')
      .select('method_id, method_type, image_url, label, display_order')
      .eq('method_type', 'bank_transfer')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error(
        '[displayBankTransferDetails] Error fetching bank transfer methods:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Sorry, there was an error loading bank transfer details. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!bankTransferMethods || bankTransferMethods.length === 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No bank transfer methods are currently available. Please contact support.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Create message with bank transfer details
    let messageText = 'Here are our bank transfer details:\n\n';

    bankTransferMethods.forEach((method, idx) => {
      // Put the URL on the same line as the label to avoid blank gaps after URL removal
      messageText += `• ${method.label} ${method.image_url}`;
      if (idx < bankTransferMethods.length - 1) messageText += `\n`;
    });

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: messageText,
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('[displayBankTransferDetails] Error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error loading bank transfer details. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
};
