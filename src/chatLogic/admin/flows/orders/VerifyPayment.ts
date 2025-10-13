import type { FlowState, FlowContext, NodeHandler } from '../../shared';
import { supabase } from '../../../../lib/supabase';

type Getter<T> = (state: FlowState, context: FlowContext) => T;
type Updater = (id: string, updates: Partial<any>, state: FlowState) => Promise<void>;

// Helper function to fetch detailed order information
async function fetchOrderDetails(orderId: string) {
  try {
    // Fetch order with customer info - try both display_id and order_id
    let { data: order, error: orderError } = await supabase
      .from('orders_duplicate')
      .select(`
        *,
        customer:customer_id (
          first_name,
          last_name
        )
      `)
      .eq('display_id', orderId)
      .single();

    // If not found by display_id, try order_id (UUID)
    if (orderError || !order) {
      const { data: orderByUuid, error: uuidError } = await supabase
        .from('orders_duplicate')
        .select(`
          *,
          customer:customer_id (
            first_name,
            last_name
          )
        `)
        .eq('order_id', orderId)
        .single();
      
      if (uuidError || !orderByUuid) {
        console.error('Error fetching order by both display_id and order_id:', orderError, uuidError);
        return null;
      }
      
      order = orderByUuid;
    }

    // Try to get quote details if this order was created from a quote
    let quoteDetails = null;
    try {
      const { data: quoteOrder } = await supabase
        .from('quote_orders')
        .select('conversation_id')
        .eq('order_id', order.order_id)  // Use the actual order_id from the fetched order
        .single();

      if (quoteOrder) {
        // Fetch the accepted proposal with specs
        const { data: proposal } = await supabase
          .from('quote_proposals')
          .select('*')
          .eq('conversation_id', quoteOrder.conversation_id)
          .eq('status', 'accepted')
          .single();

        if (proposal) {
          quoteDetails = proposal;
        }
      }
    } catch (error) {
      console.log('No quote details found for order:', orderId);
    }

    return { order, quoteDetails };
  } catch (error) {
    console.error('Error fetching order details:', error);
    return null;
  }
}

export function createVerifyPaymentNodes(opts: {
  getOrders: Getter<any[]>;
  setCurrentOrderId: (state: FlowState, id: string) => void;
  updateOrder: Updater;
}): Record<string, NodeHandler> {
  const { getOrders, setCurrentOrderId, updateOrder } = opts;

  const start: NodeHandler = {
    messages: async (state, context) => {
      const orders = (getOrders(state, context) || []).filter(
        o => String(o.status).toLowerCase() === 'verifying_payment'
      );

      if (orders.length === 0) {
        return [
          {
            role: 'printy',
            text: 'There are no orders with Verifying Payment status right now.',
          },
        ];
      }

      // Get the first order (or selected order)
      const currentId = (state as any).currentOrderId as string | null;
      let orderToProcess;

      if (currentId) {
        orderToProcess = orders.find(
          o => (o.id || '').toLowerCase() === currentId.toLowerCase()
        );
      } else {
        orderToProcess = orders[0];
        setCurrentOrderId(state, orderToProcess.id);
      }

      if (!orderToProcess) {
        return [
          {
            role: 'printy',
            text: 'Order not found in verifying payment status.',
          },
        ];
      }

      // Fetch and display full order details immediately
      try {
        const orderDetails = await fetchOrderDetails(currentId || orderToProcess.id);

        if (!orderDetails) {
          return [
            { role: 'printy', text: `Could not fetch details for order ${currentId || orderToProcess.id}` }
          ];
        }

        const { order, quoteDetails } = orderDetails;
        const uploadedAt = order.payment_proof_uploaded_at ? new Date(order.payment_proof_uploaded_at).toLocaleString() : 'Not provided';
        const img = order.payment_proof || '';
        console.log('Payment proof URL from database:', img);

        const customerName = order.customer?.first_name
          ? `${order.customer.first_name} ${order.customer.last_name}`
          : 'Unknown Customer';

        const messages = [
          {
            role: 'printy' as const,
            text: `Complete Order Details - ${order.display_id || order.order_id}\n\nCustomer: ${customerName}\nProof Upload Date: ${uploadedAt}`
          },
        ];

        // Add detailed specifications if available from quote
        if (quoteDetails && quoteDetails.spec_final) {
          const spec = quoteDetails.spec_final;
          let specsText = 'Order Specifications:\n\n';

          if (spec.product_name) specsText += `• Product: ${spec.product_name}\n`;
          if (spec.category) specsText += `• Category: ${spec.category}\n`;
          if (spec.description) specsText += `• Description: ${spec.description}\n`;
          if (spec.size) specsText += `• Size: ${spec.size}\n`;
          if (spec.materials && spec.materials.length > 0) specsText += `• Materials: ${spec.materials.join(', ')}\n`;
          if (spec.color) specsText += `• Color: ${spec.color}\n`;
          if (spec.finishing && spec.finishing.length > 0) specsText += `• Finishing: ${spec.finishing.join(', ')}\n`;
          if (spec.quantity) specsText += `• Quantity: ${spec.quantity}\n`;
          if (spec.deadline) specsText += `• Deadline: ${spec.deadline}\n`;
          if (spec.notes) specsText += `• Notes: ${spec.notes}\n`;

          messages.push({ role: 'printy' as const, text: specsText.trim() });
          
          messages.push({ 
            role: 'printy' as const, 
            text: `Agreed Price: ₱${quoteDetails.quoted_price}` 
          });
        } else {
          // Fallback to basic order specs if no quote details
          const orderSpecs = order.order_specs;

          if (orderSpecs && typeof orderSpecs === 'object' && Object.keys(orderSpecs).length > 0) {
            // If order_specs is a JSONB object with content, format it nicely
            let specsText = 'Order Specifications:\n\n';
            Object.entries(orderSpecs).forEach(([key, value]) => {
              if (value !== null && value !== undefined && value !== '') {
                specsText += `• ${key}: ${value}\n`;
              }
            });

            if (specsText.trim() !== 'Order Specifications:') {
              messages.push({ role: 'printy' as const, text: specsText.trim() });
            } else {
              messages.push({ role: 'printy' as const, text: 'Order Specifications:\n\nNo detailed specifications available' });
            }
          } else if (typeof orderSpecs === 'string' && orderSpecs.trim()) {
            messages.push({ role: 'printy' as const, text: `Order Specifications:\n\n${orderSpecs}` });
          } else {
            messages.push({ role: 'printy' as const, text: 'Order Specifications:\n\nNo detailed specifications available' });
          }
        }

        if (img) {
          messages.push({ role: 'printy' as const, text: `Payment Proof:\n\n${img}` });
        }

        messages.push({ role: 'printy' as const, text: 'Review the payment proof above and decide:' });

        return messages;

      } catch (error) {
        console.error('Error fetching order details:', error);
        return [
          { role: 'printy', text: `Error loading order details for ${currentId || orderToProcess.id}` }
        ];
      }
    },
    quickReplies: (_state, _context) => {
      return ['Accept Payment', 'Deny Payment', 'End Chat'];
    },
    handleInput: async (input, state, _context) => {
      const lower = input.trim().toLowerCase();
      const currentId = (state as any).currentOrderId as string | null;
      if (!currentId) return null;

      if (lower.startsWith('accept')) {
        try {
          await updateOrder(currentId, { status: 'processing' }, state);
          return {
            nextNodeId: 'done',
            messages: [
              {
                role: 'printy',
                text: `${currentId}: Payment accepted and status updated to Processing`,
              },
            ],
          };
        } catch (error) {
          console.error('Error accepting payment:', error);
          return {
            messages: [
              {
                role: 'printy',
                text: `Error updating order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            quickReplies: ['End Chat']
          };
        }
      }

      if (lower.startsWith('deny')) {
        try {
          await updateOrder(currentId, { status: 'reupload_payment_proof' }, state);
          return {
            nextNodeId: 'done',
            messages: [
              {
                role: 'printy',
                text: `${currentId}: Payment proof rejected. Customer will be asked to upload a new proof.`,
              },
            ],
          };
        } catch (error) {
          console.error('Error denying payment:', error);
          return {
            messages: [
              {
                role: 'printy',
                text: `Error updating order status: ${error instanceof Error ? error.message : 'Unknown error'}`,
              },
            ],
            quickReplies: ['End Chat']
          };
        }
      }

      return null;
    },
  };

  const done: NodeHandler = {
    messages: () => [{ role: 'printy', text: 'Payment verification completed.' }],
    quickReplies: () => ['End Chat'],
  };

  return {
    verify_payment_start: start,
    verify_payment_done: done,
  };
}