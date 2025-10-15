import type { BotMessage, ChatFlow } from '../../../types/chatFlow';
import { supabase } from '../../../lib/supabase';

interface PaymentMethod {
  method_id: string;
  method_type: 'bank_transfer' | 'qrph';
  image_url: string;
  label: string;
  is_active: boolean;
  display_order: number;
}

interface PaymentFlowState {
  currentStep: 'start' | 'select_method' | 'upload_proof' | 'verifying' | 'end';
  selectedMethodType?: 'bank_transfer' | 'qrph';
  paymentMethods: PaymentMethod[];
  orderId?: string;
  total?: string;
}

export const paymentFlow: ChatFlow = {
  id: 'payment',
  title: 'Payment',
  initial: async (ctx?: { orderId?: string; total?: string }) => {
    const state: PaymentFlowState = {
      currentStep: 'start',
      paymentMethods: [],
      orderId: ctx?.orderId,
      total: ctx?.total,
    };

    // Fetch payment methods in real-time
    try {
      const { data: paymentMethods, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching payment methods:', error);
        state.paymentMethods = [];
      } else {
        state.paymentMethods = paymentMethods || [];
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      state.paymentMethods = [];
    }

    // Store state in context for subsequent calls
    (ctx as any).paymentState = state;

    const introMessage = ctx?.orderId && ctx?.total
      ? `Your total balance for ${ctx.orderId} is ${ctx.total}. How would you like to pay for your order?`
      : 'How would you like to pay for your order?';

    return [
      { role: 'printy', text: introMessage }
    ] as BotMessage[];
  },

  quickReplies: (ctx) => {
    const state: PaymentFlowState = (ctx as any).paymentState || { currentStep: 'start', paymentMethods: [] };
    
    switch (state.currentStep) {
      case 'start':
        // Generate options based on available payment methods
        const options = [];
        const hasBankTransfer = state.paymentMethods.some(m => m.method_type === 'bank_transfer');
        const hasQRPH = state.paymentMethods.some(m => m.method_type === 'qrph');
        
        if (hasBankTransfer) options.push('Online Bank Transfer');
        if (hasQRPH) options.push('QRPH Codes');
        options.push('End Chat');
        
        return options;
        
      case 'select_method':
        return ['Upload Payment Proof', 'Back to Payment Options', 'End Chat'];
        
      case 'upload_proof':
        return ['Back to Payment Options', 'End Chat'];
        
      case 'verifying':
        return ['Pay Another Order', 'End Chat'];
        
      case 'end':
        return ['End Chat'];
        
      default:
        return ['End Chat'];
    }
  },

  respond: async (ctx, input) => {
    const state: PaymentFlowState = (ctx as any).paymentState || { currentStep: 'start', paymentMethods: [] };
    const normalized = input.trim().toLowerCase();

    // Debug logging
    console.log('Payment flow input:', input);
    console.log('Payment flow state:', state);

    // Handle payment proof upload (file URLs from chat system)
    const looksLikeProof = /^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)/i.test(input) || 
                           /^https?:\/\/.*supabase\.co.*payment-proofs/i.test(input) ||
                           /^supabase:\/\/payment-proofs\//i.test(input);
    
    console.log('Looks like proof:', looksLikeProof);
    
    if (looksLikeProof) {
      // File has already been uploaded by the chat system and database updated
      // Just acknowledge the upload and move to verifying state
      console.log('Processing payment proof upload');
      state.currentStep = 'verifying';
      (ctx as any).paymentState = state;
      
      return {
        messages: [{
          role: 'printy',
          text: 'Thank you for sending your proof of payment! Our team will confirm your payment shortly. You will be updated once payment has been confirmed and will be ready for pick up or delivery.'
        }],
        quickReplies: ['Pay Another Order', 'End Chat']
      };
    }

    // Handle navigation based on current step
    switch (state.currentStep) {
      case 'start':
        if (normalized.includes('bank transfer') || normalized.includes('bank')) {
          const bankMethods = state.paymentMethods.filter(m => m.method_type === 'bank_transfer');
          if (bankMethods.length > 0) {
            state.currentStep = 'select_method';
            state.selectedMethodType = 'bank_transfer';
            (ctx as any).paymentState = state;
            
            const bankImages = bankMethods.map(m => `(${m.image_url})`).join('\n');
            return {
              messages: [
                {
                  role: 'printy',
                  text: `Here are our bank details for online transfers:\n\n${bankImages}`
                },
                {
                  role: 'printy',
                  text: `Click 'Upload Payment Proof' below to upload your file. Make sure the TRANSACTION ID and DATE & TIME are clearly visible.`
                }
              ],
              quickReplies: ['Upload Payment Proof', 'Back to Payment Options', 'End Chat']
            };
          } else {
            return {
              messages: [{
                role: 'printy',
                text: 'Bank transfer options are currently unavailable. Please try QRPH codes instead.'
              }],
              quickReplies: ['QRPH Codes', 'End Chat']
            };
          }
        }
        
        if (normalized.includes('qrph') || normalized.includes('qr')) {
          const qrMethods = state.paymentMethods.filter(m => m.method_type === 'qrph');
          if (qrMethods.length > 0) {
            state.currentStep = 'select_method';
            state.selectedMethodType = 'qrph';
            (ctx as any).paymentState = state;
            
            const qrImages = qrMethods.map(m => `(${m.image_url})`).join('\n');
            return {
              messages: [
                {
                  role: 'printy',
                  text: `Here are our QRPH codes:\n\n${qrImages}`
                },
                {
                  role: 'printy',
                  text: `Click 'Upload Payment Proof' below to upload your file. Make sure the TRANSACTION ID and DATE & TIME are clearly visible.`
                }
              ],
              quickReplies: ['Upload Payment Proof', 'Back to Payment Options', 'End Chat']
            };
          } else {
            return {
              messages: [{
                role: 'printy',
                text: 'QRPH codes are currently unavailable. Please try bank transfer instead.'
              }],
              quickReplies: ['Online Bank Transfer', 'End Chat']
            };
          }
        }
        
        if (normalized.includes('end')) {
          state.currentStep = 'end';
          (ctx as any).paymentState = state;
          return {
            messages: [{
              role: 'printy',
              text: 'Thank you for chatting with Printy! Have a great day.'
            }],
            quickReplies: ['End Chat']
          };
        }
        break;

      case 'select_method':
        if (normalized.includes('back') || normalized.includes('payment options')) {
          state.currentStep = 'start';
          state.selectedMethodType = undefined;
          (ctx as any).paymentState = state;
          
          return {
            messages: [{
              role: 'printy',
              text: 'How would you like to pay for your order?'
            }],
            quickReplies: ['Online Bank Transfer', 'QRPH Codes', 'End Chat']
          };
        }
        
        if (normalized.includes('upload') || normalized.includes('proof')) {
          state.currentStep = 'upload_proof';
          (ctx as any).paymentState = state;
          
          return {
            messages: [{
              role: 'printy',
              text: 'Please upload your proof of payment using the file upload button beside the typing area.'
            }],
            quickReplies: ['Back to Payment Options', 'End Chat']
          };
        }
        
        if (normalized.includes('end')) {
          state.currentStep = 'end';
          (ctx as any).paymentState = state;
          return {
            messages: [{
              role: 'printy',
              text: 'Thank you for chatting with Printy! Have a great day.'
            }],
            quickReplies: ['End Chat']
          };
        }
        break;

      case 'verifying':
        if (normalized.includes('another order')) {
          state.currentStep = 'start';
          state.selectedMethodType = undefined;
          (ctx as any).paymentState = state;
          
          return {
            messages: [{
              role: 'printy',
              text: 'Please provide/select another Order ID that is awaiting payment (e.g., ORD-12350).'
            }],
            quickReplies: ['End Chat']
          };
        }
        
        if (normalized.includes('end')) {
          state.currentStep = 'end';
          (ctx as any).paymentState = state;
          return {
            messages: [{
              role: 'printy',
              text: 'Thank you for chatting with Printy! Have a great day.'
            }],
            quickReplies: ['End Chat']
          };
        }
        break;

      default:
        return {
          messages: [{
            role: 'printy',
            text: 'Please choose one of the available options.'
          }],
          quickReplies: ['End Chat']
        };
    }

    // Default response for unrecognized input
    return {
      messages: [{
        role: 'printy',
        text: 'Please choose one of the available options.'
      }],
      quickReplies: ['End Chat']
    };
  },
};