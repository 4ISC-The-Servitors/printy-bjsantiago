import type { ActionHandler } from '@features/chat/types';

export const uploadPaymentProofImage: ActionHandler = async () => {
  console.log('[uploadPaymentProofImage] Action called');
  const messages: Array<{
    id: string;
    role: 'printy';
    text: string;
    ts: number;
  }> = [];

  // This action is triggered when user clicks "Upload Payment Proof"
  // The actual file upload will be handled by the UI, so we just show instructions
  messages.push({
    id: crypto.randomUUID(),
    role: 'printy',
    text: 'Please click the attachment button (📎) below to upload your payment proof image. You can upload a screenshot of your transaction, receipt, or any proof of payment.',
    ts: Date.now(),
  });

  console.log('[uploadPaymentProofImage] Returning instructions message');
  return { messages };
};
