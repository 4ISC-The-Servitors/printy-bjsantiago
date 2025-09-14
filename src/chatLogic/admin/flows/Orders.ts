// Refactored Orders Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
import { mockOrders } from '../../../data/orders';
import {
  FlowBase,
  ORDER_STATUS_OPTIONS,
  createStatusChangeMessage,
  createQuoteCreatedMessage,
  createInfoMessage,
} from '../shared';
import { normalizeOrderStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';

type OrderNodeId =
  | 'start'
  | 'action'
  | 'details'
  | 'choose_status'
  | 'ask_quote_price'
  | 'done';

interface OrdersState extends FlowState {
  currentNodeId: OrderNodeId;
  currentOrderId: string | null;
  currentOrders: any[];
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
    this.state.currentNodeId = 'action';
  }

  private registerNodes(): void {
    // Action node
    this.registerNode('action', this.createActionNode());

    // Details node
    this.registerNode('details', this.createDetailsNode());

    // Status change node
    this.registerNode('choose_status', this.createStatusChangeNode());

    // Quote price node
    this.registerNode('ask_quote_price', this.createQuotePriceNode());

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
        return order
          ? ['View Details', 'Change Status', 'Create Quote', 'End Chat']
          : ['Change Status', 'Create Quote', 'End Chat'];
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

  private createStatusChangeNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) return [{ role: 'printy', text: 'Order not found.' }];
        return [
          {
            role: 'printy',
            text: `What status would you like to set for ${order.id}?`,
          },
        ];
      },
      quickReplies: () => [...ORDER_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) {
          return {
            messages: [{ role: 'printy', text: 'Order not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const next = normalizeOrderStatus(input);

        if (!next) {
          return {
            messages: [
              {
                role: 'printy',
                text: `Valid statuses: ${ORDER_STATUS_OPTIONS.join(', ')}`,
              },
            ],
            quickReplies: [...ORDER_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const prev = order.status;
        this.updateOrder(order.id, { status: next }, orderState);

        return {
          nextNodeId: 'action',
          messages: [createStatusChangeMessage(order.id, prev, next)],
        };
      },
    };
  }

  private createQuotePriceNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) return [{ role: 'printy', text: 'Order not found.' }];
        return [
          {
            role: 'printy',
            text: `Creating quote for ${order.id} (${order.customer}).`,
          },
          {
            role: 'printy',
            text: 'Please enter the quote amount (e.g., 3800, 3,800, or ₱3,800).',
          },
        ];
      },
      quickReplies: () => ['End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const orderState = state as OrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) {
          return {
            messages: [{ role: 'printy', text: 'Order not found.' }],
            quickReplies: ['End Chat'],
          };
        }

        const {
          formatPriceInput,
          isValidPriceInput,
        } = require('../../../utils/shared');

        const priceValid = isValidPriceInput(input) || /\d/.test(input);
        if (!priceValid) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please enter a valid price amount (e.g., 3800, 3,800, or ₱3,800).',
              },
            ],
            quickReplies: ['End Chat'],
          };
        }

        const formatted = formatPriceInput(input);
        this.updateOrder(
          order.id,
          { status: 'Pending', total: formatted },
          orderState
        );

        return {
          nextNodeId: 'action',
          messages: [createQuoteCreatedMessage(order.id, formatted)],
        };
      },
    };
  }

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
    return order
      ? ['View Details', 'Change Status', 'Create Quote', 'End Chat']
      : ['Change Status', 'Create Quote', 'End Chat'];
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
