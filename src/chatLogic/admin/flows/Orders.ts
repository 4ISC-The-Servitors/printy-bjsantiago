// Refactored Orders Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
// BACKEND_TODO: Remove mockOrders import; rely solely on context-provided orders from Supabase.
import { mockOrders } from '../../../data/orders'; // DELETE when backend is wired
import { FlowBase, ORDER_STATUS_OPTIONS, createInfoMessage } from '../shared';
import { normalizeOrderStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { createVerifyPaymentNodes } from './orders/VerifyPayment';
import { createStatusChangeNode as createStatusChangeNodeFactory } from './orders/ChangeOrderStatus';
import { createQuotePriceNode as createQuotePriceNodeFactory } from './orders/Qouting';

type OrderNodeId =
  | 'start'
  | 'action'
  | 'details'
  | 'choose_status'
  | 'ask_quote_price'
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
    this.state.currentOrders = (context?.orders as any[]) || mockOrders;
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
        updateOrder: (
          id: string,
          updates: Partial<any>,
          _s: FlowState,
          _c: FlowContext
        ) => this.updateOrder(id, updates, this.state as OrdersState),
        getStatusOptions: () => ORDER_STATUS_OPTIONS,
        normalizeStatus: normalizeOrderStatus,
        nextNodeId: 'action',
      })
    );

    // Quote price node (shared)
    this.registerNode(
      'ask_quote_price',
      createQuotePriceNodeFactory({
        getCurrentOrder: () => this.getCurrentOrder(this.state as OrdersState),
        updateOrder: (
          id: string,
          updates: Partial<any>,
          _s: FlowState,
          _c: FlowContext
        ) => this.updateOrder(id, updates, this.state as OrdersState),
        nextNodeId: 'action',
      })
    );

    // Verify payment nodes (conditionally used)
    const verifyNodes = createVerifyPaymentNodes({
      getOrders: (_s, _c) => (this.state as OrdersState).currentOrders,
      getOrderById: (_s, id) =>
        (this.state as OrdersState).currentOrders.find(o => o.id === id) ||
        mockOrders.find(o => o.id === id) ||
        null,
      setCurrentOrderId: (_s, id) => {
        (this.state as OrdersState).currentOrderId = id;
      },
      updateOrder: (id, updates, _s) => {
        this.updateOrder(id, updates, this.state as OrdersState);
      },
    });
    this.registerNode('verify_payment_start', verifyNodes.verify_payment_start);
    this.registerNode('verify_payment_proof', verifyNodes.verify_payment_proof);

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
        return { nextNodeId: 'verify_payment_proof' };
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
              text: `Looking at order ${order.id} for ${order.customer}. Current status: ${order.status}. What would you like to do?`,
            },
          ];
        }
        return [
          {
            role: 'printy',
            text: 'Orders assistant ready. What would you like to do?',
          },
        ];
      },
      quickReplies: (state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        const base = order
          ? ['View Details', 'Change Status', 'Create Quote']
          : ['Change Status', 'Create Quote'];
        const showVerify = order
          ? String(order.status).toLowerCase() === 'verifying payment'
          : (this.state as OrdersState).currentOrders.some(
              o => String(o.status).toLowerCase() === 'verifying payment'
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

        if (
          lower.includes('create quote') ||
          lower === 'create quote' ||
          lower === 'quote'
        ) {
          const orderState = state as OrdersState;
          const order = this.getCurrentOrder(orderState);
          if (
            order &&
            (order.status === 'Needs Quote' ||
              String(order.total || '').toUpperCase() === 'TBD')
          ) {
            return { nextNodeId: 'ask_quote_price' };
          }

          // Already has a quote or not eligible yet
          const msg = order
            ? `${order.id} already has a quote (${order.total}). Status: ${order.status}`
            : 'Please specify an order first.';
          return {
            messages: [createInfoMessage(msg)],
            quickReplies: this.getActionQuickReplies(orderState),
          };
        }

        if (lower.includes('verify') && lower.includes('payment')) {
          const s = state as OrdersState;
          const order = this.getCurrentOrder(s);
          const selected = (s.selectedIds || []).filter(Boolean);
          // If viewing a specific order
          if (order) {
            if (String(order.status).toLowerCase() !== 'verifying payment') {
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
                  String(o.status).toLowerCase() === 'verifying payment'
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
            return { nextNodeId: 'verify_payment_proof' };
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

        const statusIndicator = this.getStatusIndicator(order.status);
        const msgs: BotMessage[] = [
          { role: 'printy', text: '📋 Order Details' },
          { role: 'printy', text: `ID: ${order.id}` },
          { role: 'printy', text: `Customer: ${order.customer}` },
          { role: 'printy', text: `Status: ${order.status}` },
        ];

        if (order.priority)
          msgs.push({ role: 'printy', text: `Priority: ${order.priority}` });

        msgs.push(
          { role: 'printy', text: `Date: ${order.date}` },
          { role: 'printy', text: `Total: ${order.total}` },
          { role: 'printy', text: '🖨️ Service Details' },
          { role: 'printy', text: 'Premium Business Cards' },
          { role: 'printy', text: 'Qty: 500 pieces' },
          { role: 'printy', text: 'Size: 3.5" x 2"' },
          { role: 'printy', text: 'Paper: 16pt Matte' },
          { role: 'printy', text: 'Print: Full Color' },
          { role: 'printy', text: 'Finish: Matte Lamination' },
          { role: 'printy', text: 'Design: Customer Logo' },
          { role: 'printy', text: 'Time: 3-5 days' },
          { role: 'printy', text: '💰 Pricing Breakdown' },
          { role: 'printy', text: 'Base: ₱2,500' },
          { role: 'printy', text: 'Paper: +₱800' },
          { role: 'printy', text: 'Lamination: +₱500' },
          { role: 'printy', text: `Total: ${order.total}` },
          { role: 'printy', text: statusIndicator }
        );

        return msgs;
      },
      quickReplies: () => ['Change Status', 'Create Quote', 'End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const lower = input.toLowerCase();

        if (lower === 'change status' || lower === 'status') {
          return { nextNodeId: 'choose_status' };
        }

        if (
          lower.includes('create quote') ||
          lower === 'create quote' ||
          lower === 'quote'
        ) {
          const orderState = state as OrdersState;
          const order = this.getCurrentOrder(orderState);
          if (
            order &&
            (order.status === 'Needs Quote' ||
              String(order.total || '').toUpperCase() === 'TBD')
          ) {
            return { nextNodeId: 'ask_quote_price' };
          }

          const msg = order
            ? `${order.id} already has a quote (${order.total}). Status: ${order.status}`
            : 'Please specify an order first.';
          return {
            messages: [createInfoMessage(msg)],
            quickReplies: ['Change Status', 'Create Quote', 'End Chat'],
          };
        }

        return null;
      },
    };
  }

  // removed unused private method createStatusChangeNode()

  // removed unused private method createQuotePriceNode()

  private createDoneNode(): NodeHandler {
    return {
      messages: () => [{ role: 'printy', text: 'Done. Anything else?' }],
      quickReplies: () => [
        'View Details',
        'Change Status',
        'Create Quote',
        'End Chat',
      ],
    };
  }

  private getCurrentOrder(state: OrdersState): any {
    if (!state.currentOrderId) return null;
    const up = state.currentOrderId.toUpperCase();
    return (
      state.currentOrders.find(o => (o.id || '').toUpperCase() === up) ||
      mockOrders.find(o => (o.id || '').toUpperCase() === up)
    );
  }

  private getStatusIndicator(status: string): string {
    switch (status) {
      case 'Pending':
        return '⏳ Currently pending approval';
      case 'Processing':
        return '🔄 Currently being processed';
      case 'Awaiting Payment':
        return '💰 Awaiting payment from customer';
      case 'For Delivery/Pick-up':
        return '🚚 Ready for delivery/pickup';
      case 'Completed':
        return '✅ Order completed';
      case 'Cancelled':
        return '❌ Order cancelled';
      default:
        return '⏳ Status unknown';
    }
  }

  private getActionQuickReplies(state: OrdersState): string[] {
    const order = this.getCurrentOrder(state);
    const base = order
      ? ['View Details', 'Change Status', 'Create Quote']
      : ['Change Status', 'Create Quote'];
    const hasVerifying = (this.state as OrdersState).currentOrders.some(
      o => String(o.status).toLowerCase() === 'verifying payment'
    );
    return hasVerifying
      ? [...base, 'Verify Payment', 'End Chat']
      : [...base, 'End Chat'];
  }

  private updateOrder(
    orderId: string,
    updates: Partial<any>,
    state: OrdersState
  ): void {
    // Update via context if available
    if (this.context.updateOrder) {
      this.context.updateOrder(orderId, updates);
    }

    // Update mock data
    const mi = mockOrders.findIndex(o => o.id === orderId);
    if (mi !== -1) {
      mockOrders[mi] = { ...mockOrders[mi], ...updates };
    }

    // Update local state
    state.currentOrders = state.currentOrders.map(o =>
      o.id === orderId ? { ...o, ...updates } : o
    );

    // Refresh if available
    if (this.context.refreshOrders) {
      this.context.refreshOrders();
    }
  }
}

export const ordersFlow = new OrdersFlow();
