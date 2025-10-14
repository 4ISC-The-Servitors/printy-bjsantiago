// Refactored Orders Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
import { FlowBase, ORDER_STATUS_OPTIONS, createInfoMessage } from '../shared';
import { normalizeOrderStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { createVerifyPaymentNodes } from './orders/VerifyPayment';
import { createStatusChangeNode as createStatusChangeNodeFactory } from './orders/ChangeOrderStatus';
import { supabase } from '../../../lib/supabase';

type OrderNodeId =
  | 'start'
  | 'action'
  | 'details'
  | 'choose_status'
  | 'verify_payment_pick'
  | 'done';

interface OrdersState extends FlowState {
  currentNodeId: OrderNodeId;
  currentOrderId: string | null;
  currentOrders: any[];
  selectedIds?: string[];
}

class OrdersFlow extends FlowBase {
  id = 'admin-orders';
  title = 'Admin Orders';

  constructor() {
    super({ currentNodeId: 'action', currentOrderId: null, currentOrders: [] });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.currentOrderId = (context?.orderId as string) || null;
    this.state.currentOrders = (context?.orders as any[]) || [];
    this.state.selectedIds = Array.isArray(context?.orderIds)
      ? ((context?.orderIds as string[]) || []).map(x => x.toUpperCase())
      : [];
    this.state.currentNodeId = 'action';
  }

  private registerNodes(): void {
    // Action node
    this.registerNode('action', this.createActionNode());

    // Details node
    this.registerNode('details', this.createDetailsNode());

    // Status change node (shared)
    this.registerNode(
      'choose_status',
      createStatusChangeNodeFactory({
        getCurrentOrder: (_s: FlowState, _c: FlowContext) =>
          this.getCurrentOrder(this.state as OrdersState),
        updateOrder: async (
          id: string,
          updates: Partial<any>,
          _s: FlowState,
          _c: FlowContext
        ) => await this.updateOrder(id, updates, this.state as OrdersState),
        getStatusOptions: () => ORDER_STATUS_OPTIONS,
        normalizeStatus: normalizeOrderStatus,
        nextNodeId: 'action',
      })
    );


    // Verify payment nodes (conditionally used)
    const verifyNodes = createVerifyPaymentNodes({
      getOrders: (_s, _c) => (this.state as OrdersState).currentOrders,
      setCurrentOrderId: (_s, id) => {
        (this.state as OrdersState).currentOrderId = id;
      },
      updateOrder: async (id, updates, _s) => {
        await this.updateOrder(id, updates, this.state as OrdersState);
      },
    });
    this.registerNode('verify_payment_start', verifyNodes.verify_payment_start);
    this.registerNode('verify_payment_done', verifyNodes.verify_payment_done);

    // Multi-verify picker node (when 2+ selected)
    this.registerNode('verify_payment_pick', {
      messages: () => [
        {
          role: 'printy',
          text: 'Please choose order ID you want to verify first',
        },
      ],
      quickReplies: (_state: FlowState) => {
        const queue: string[] =
          (((_state as any).__verifyQueue as string[]) || []);
        return (queue.length > 0 ? queue : []) as any;
      },
      handleInput: (input: string, state: FlowState) => {
        const s = state as OrdersState;
        const queue: string[] =
          ((state as any).__verifyQueue as string[]) || [];
        const pick = queue.find(
          id => id.toLowerCase() === input.trim().toLowerCase()
        );
        if (!pick) return null;
        // Remove from queue and set current subject
        (state as any).__verifyQueue = queue.filter(id => id !== pick);
        s.currentOrderId = pick;
        return { nextNodeId: 'verify_payment_start' };
      },
    });

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private createActionNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        if (order) {
          return [
            {
              role: 'printy',
              text: `Order ${order.id} selected.`,
            },
          ];
        }
        return [
          {
            role: 'printy',
            text: 'Orders assistant ready.',
          },
        ];
      },
      quickReplies: (state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        const base = order
          ? ['View Details', 'Change Status']
          : ['Change Status'];
        const showVerify = order
          ? String(order.status).toLowerCase() === 'verifying_payment'
          : (this.state as OrdersState).currentOrders.some(
              o => String(o.status).toLowerCase() === 'verifying_payment'
            );
        return showVerify
          ? [...base, 'Verify Payment', 'End Chat']
          : [...base, 'End Chat'];
      },
      handleInput: (input: string, state: FlowState) => {
        const lower = input.toLowerCase();

        if (lower === 'view details') {
          return { nextNodeId: 'details' };
        }

        if (lower === 'change status' || lower === 'status') {
          return { nextNodeId: 'choose_status' };
        }


        if (lower.includes('verify') && lower.includes('payment')) {
          const s = state as OrdersState;
          const order = this.getCurrentOrder(s);
          const selected = (s.selectedIds || []).filter(Boolean);
          // If viewing a specific order
          if (order) {
            if (String(order.status).toLowerCase() !== 'verifying_payment') {
              return {
                messages: [
                  createInfoMessage(
                    `${order.id} is ${order.status}. Verify Payment is only available for Verifying Payment.`
                  ),
                ],
                quickReplies: this.getActionQuickReplies(s),
              };
            }
            return { nextNodeId: 'verify_payment_start' };
          }

          // Multi-selection path: build queue from selected verifying orders
          const verifyingIds = (
            selected.length > 0
              ? selected
              : (this.state as OrdersState).currentOrders.map(o => o.id)
          )
            .map(id => id.toUpperCase())
            .filter(id =>
              (this.state as OrdersState).currentOrders.some(
                o =>
                  o.id.toUpperCase() === id &&
                  String(o.status).toLowerCase() === 'verifying_payment'
              )
            );

          if (verifyingIds.length === 0) {
            return {
              messages: [
                createInfoMessage(
                  'None of the selected orders are in Verifying Payment.'
                ),
              ],
              quickReplies: this.getActionQuickReplies(s),
            };
          }

          if (verifyingIds.length === 1) {
            (state as any).__verifyQueue = [];
            s.currentOrderId = verifyingIds[0];
            return { nextNodeId: 'verify_payment_start' };
          }

          (state as any).__verifyQueue = verifyingIds;
          s.currentOrderId = null;
          return { nextNodeId: 'verify_payment_pick' };
        }

        return null;
      },
    };
  }

  private createDetailsNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) return [];

        // Show basic order info immediately, then fetch details when user clicks "View Details"
        return [
          { role: 'printy', text: 'Order Details' },
          { role: 'printy', text: `ID: ${order.id}` },
          { role: 'printy', text: `Customer: ${order.customer}` },
          { role: 'printy', text: `Status: ${order.status}` },
          { role: 'printy', text: `Date: ${order.date}` },
          { role: 'printy', text: `Total: ${order.total}` },
          { role: 'printy', text: 'Click "View Details" to see full order information with specifications.' },
        ];
      },
      quickReplies: () => ['View Details', 'Change Status', 'End Chat'],
      handleInput: async (input: string, state: FlowState, _context: FlowContext) => {
        const lower = input.toLowerCase();

        if (lower === 'view details') {
          const orderState = state as OrdersState;
          const order = this.getCurrentOrder(orderState);
          if (!order) return null;

          try {
            // Fetch detailed order information from Supabase
            const { data: orderDetails, error: orderError } = await supabase
              .from('orders_duplicate')
              .select(`
                *,
                customer:customer_id (
                  first_name,
                  last_name
                )
              `)
              .eq('display_id', order.id)
              .single();

            if (orderError || !orderDetails) {
              return {
                messages: [
                  { role: 'printy', text: `Could not fetch details for order ${order.id}` }
                ],
                quickReplies: ['Change Status', 'End Chat']
              };
            }

            // Try to get quote details if this order was created from a quote
            let quoteDetails = null;
            try {
            const { data: quoteOrder } = await supabase
              .from('quote_orders')
              .select('conversation_id')
              .eq('order_id', order.id)
              .single();

              if (quoteOrder) {
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
              console.log('No quote details found for order:', order.id);
            }

            const customerName = orderDetails.customer?.first_name 
              ? `${orderDetails.customer.first_name} ${orderDetails.customer.last_name}`
              : 'Unknown Customer';

            const msgs: BotMessage[] = [
              { role: 'printy', text: 'Detailed Order Information' },
              { role: 'printy', text: `ID: ${orderDetails.display_id || orderDetails.order_id}` },
              { role: 'printy', text: `Customer: ${customerName}` },
              { role: 'printy', text: `Status: ${orderDetails.status}` },
              { role: 'printy', text: `Date: ${new Date(orderDetails.created_at).toLocaleDateString()}` },
              { role: 'printy', text: `Total: ₱${orderDetails.total_amount || orderDetails.total || 'N/A'}` },
            ];

            // Add detailed specifications if available from quote
            if (quoteDetails && quoteDetails.spec_final) {
              const spec = quoteDetails.spec_final;
              let specsText = 'Service Details:\n\n';
              
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
              
              specsText += `\nAgreed Price: ₱${quoteDetails.quoted_price}`;
              msgs.push({ role: 'printy', text: specsText.trim() });
            } else {
              // Fallback to basic order specs if no quote details
              const orderSpecs = orderDetails.order_specs;
              
              if (orderSpecs && typeof orderSpecs === 'object' && Object.keys(orderSpecs).length > 0) {
                // If order_specs is a JSONB object with content, format it nicely
                let specsText = 'Service Details:\n\n';
                Object.entries(orderSpecs).forEach(([key, value]) => {
                  if (value !== null && value !== undefined && value !== '') {
                    specsText += `• ${key}: ${value}\n`;
                  }
                });
                
                if (specsText.trim() !== 'Service Details:') {
                  msgs.push({ role: 'printy', text: specsText.trim() });
                } else {
                  msgs.push({ role: 'printy', text: 'Service Details:\n\nNo detailed specifications available' });
                }
              } else if (typeof orderSpecs === 'string' && orderSpecs.trim()) {
                msgs.push({ role: 'printy', text: `Service Details:\n\n${orderSpecs}` });
              } else {
                msgs.push({ role: 'printy', text: 'Service Details:\n\nNo detailed specifications available' });
              }
            }

            return {
              messages: msgs,
              quickReplies: ['Change Status', 'End Chat']
            };

          } catch (error) {
            console.error('Error fetching order details:', error);
            return {
              messages: [
                { role: 'printy', text: `Error loading order details for ${order.id}` }
              ],
              quickReplies: ['Change Status', 'End Chat']
            };
          }
        }

        if (lower === 'change status' || lower === 'status') {
          return { nextNodeId: 'choose_status' };
        }

        return null;
      },
    };
  }



  private createDoneNode(): NodeHandler {
    return {
      messages: () => [{ role: 'printy', text: 'Done. Anything else?' }],
      quickReplies: () => [
        'View Details',
        'Change Status',
        'End Chat',
      ],
    };
  }

  private getCurrentOrder(state: OrdersState): any {
    if (!state.currentOrderId) return null;
    const up = state.currentOrderId.toUpperCase();
    return state.currentOrders.find(o => (o.id || '').toUpperCase() === up);
  }


  private getActionQuickReplies(state: OrdersState): string[] {
    const order = this.getCurrentOrder(state);
    const base = order
      ? ['View Details', 'Change Status']
      : ['Change Status'];
    const hasVerifying = (this.state as OrdersState).currentOrders.some(
      o => String(o.status).toLowerCase() === 'verifying_payment'
    );
    return hasVerifying
      ? [...base, 'Verify Payment', 'End Chat']
      : [...base, 'End Chat'];
  }

  private async updateOrder(
    orderId: string,
    updates: Partial<any>,
    state: OrdersState
  ): Promise<void> {
    try {
      console.log('Updating order in database:', { orderId, updates });
      
      // Update the database
      const { error } = await supabase
        .from('orders_duplicate')
        .update(updates)
        .eq('display_id', orderId);

      if (error) {
        console.error('Error updating order in database:', error);
        throw new Error(`Failed to update order: ${error.message}`);
      }

      console.log('Order updated successfully in database');

      // Update local state
      state.currentOrders = state.currentOrders.map(o =>
        o.id === orderId ? { ...o, ...updates } : o
      );

      // Update via context if available
      if (this.context.updateOrder) {
        this.context.updateOrder(orderId, updates);
      }

      // Refresh if available
      if (this.context.refreshOrders) {
        this.context.refreshOrders();
      }

    } catch (error) {
      console.error('Error in updateOrder:', error);
      throw error;
    }
  }
}

export const ordersFlow = new OrdersFlow();
