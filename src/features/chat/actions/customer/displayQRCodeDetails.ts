import { supabase } from '@lib/supabase';
import type { ActionHandler } from '@features/chat/types';

export const displayQRCodeDetails: ActionHandler = async () => {
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  try {
    // Fetch QR code payment methods
    const { data: qrMethods, error } = await supabase
      .from('payment_methods')
      .select('method_id, method_type, image_url, label, display_order')
      .eq('method_type', 'qrph')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error(
        '[displayQRCodeDetails] Error fetching QR code methods:',
        error
      );
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'Sorry, there was an error loading QR code details. Please try again.',
        ts: Date.now(),
      });
      return { messages };
    }

    if (!qrMethods || qrMethods.length === 0) {
      messages.push({
        id: crypto.randomUUID(),
        role: 'printy',
        text: 'No QR code methods are currently available. Please contact support.',
        ts: Date.now(),
      });
      return { messages };
    }

    // Create message with QR code details
    let messageText = 'Here are our QR codes for payment:\n\n';

    qrMethods.forEach((method, idx) => {
      // Put the URL on the same line as the label to avoid blank gaps after URL removal
      messageText += `• ${method.label} ${method.image_url}`;
      if (idx < qrMethods.length - 1) messageText += `\n`;
    });

    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: messageText,
      ts: Date.now(),
    });

    return { messages };
  } catch (error) {
    console.error('[displayQRCodeDetails] Error:', error);
    messages.push({
      id: crypto.randomUUID(),
      role: 'printy',
      text: 'Sorry, there was an error loading QR code details. Please try again.',
      ts: Date.now(),
    });
    return { messages };
  }
};
