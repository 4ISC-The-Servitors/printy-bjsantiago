import type { ActionHandler } from '@features/chat/types';

export const displayPaymentMethods: ActionHandler = async () => {
  console.log('[displayPaymentMethods] Action called');
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  // The node's message "How would you like to pay for your order?" will be shown by JsonbFlowProcessor
  // This action doesn't need to show payment method images automatically
  // Images will be shown only after user selects a specific payment method type

  console.log(
    '[displayPaymentMethods] Payment methods action completed - no additional messages needed'
  );

  console.log('[displayPaymentMethods] Returning messages:', messages.length);
  return { messages };
};
