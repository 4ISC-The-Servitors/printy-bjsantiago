// Refactored MultipleOrders Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
import { mockOrders } from '../../../data/orders';
import {
  FlowBase,
  ORDER_STATUS_OPTIONS,
  createStatusChangeMessage,
  createQuoteCreatedMessage,
  createSelectionListMessage,
} from '../shared';
import { normalizeOrderStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { extractOrderIds } from '../shared/utils/IdExtractors';
import { formatPriceInput, isValidPriceInput } from '../../../utils/shared';

type MultipleOrdersNodeId =
  | 'multi_start'
  | 'action'
  | 'choose_id'
  | 'choose_status'
  | 'choose_bulk_status'
  | 'choose_quote_target'
  | 'ask_quote_price'
  | 'done';

interface MultipleOrdersState extends FlowState {
  currentNodeId: MultipleOrdersNodeId;
  selectedIds: string[];
  ordersRef: any[];
  currentTargetId: string | null;
  changedIds: Set<string>;
  quotedIds: Set<string>;
}

class MultipleOrdersFlow extends FlowBase {
  id = 'admin-multiple-orders';
  title = 'Admin Multiple Orders';

  constructor() {
    super({
      currentNodeId: 'multi_start',
      selectedIds: [],
      ordersRef: [],
      currentTargetId: null,
      changedIds: new Set(),
      quotedIds: new Set(),
    });
    this.registerNodes();
  }

  protected initializeState(context: FlowContext): void {
    this.state.selectedIds = Array.isArray(context?.orderIds)
      ? (context?.orderIds as string[]).map(x => x.toUpperCase())
      : [];
    this.state.ordersRef = (context?.orders as any[]) || mockOrders;
    this.state.changedIds = new Set<string>();
    this.state.quotedIds = new Set<string>();
    this.state.currentTargetId = null;
    this.state.currentNodeId =
      this.state.selectedIds.length > 1 ? 'multi_start' : 'action';
  }

  private registerNodes(): void {
    // Multi start node
    this.registerNode('multi_start', this.createMultiStartNode());

    // Action node
    this.registerNode('action', this.createActionNode());

    // Choose ID node
    this.registerNode('choose_id', this.createChooseIdNode());

    // Status change node
    this.registerNode('choose_status', this.createStatusChangeNode());

    // Bulk status change node
    this.registerNode('choose_bulk_status', this.createBulkStatusChangeNode());

    // Choose quote target node
    this.registerNode(
      'choose_quote_target',
      this.createChooseQuoteTargetNode()
    );

    // Quote price node
    this.registerNode('ask_quote_price', this.createQuotePriceNode());

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private createMultiStartNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const selected = this.getSelectedOrders(orderState);
        const msgs: BotMessage[] = [
          {
            role: 'printy',
            text: `Multiple orders assistant ready (${selected.length} selected).`,
          },
          { role: 'printy', text: 'You selected:' },
        ];
        msgs.push(...createSelectionListMessage(selected, 'order'));
        msgs.push({
          role: 'printy',
          text: 'What do you want to do with these orders?',
        });
        return msgs;
      },
      quickReplies: () => ['Change Status', 'Create Quote', 'End Chat'],
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const lower = input.toLowerCase();

        if (lower === 'change status') {
          return { nextNodeId: 'choose_id' };
        }

        if (
          lower.includes('create quote') ||
          lower === 'create quote' ||
          lower === 'quote'
        ) {
          return { nextNodeId: 'choose_quote_target' };
        }

        return null;
      },
    };
  }

  private createActionNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        return [
          {
            role: 'printy',
            text: `You selected ${orderState.selectedIds.length} orders. What do you want to do with these orders?`,
          },
        ];
      },
      quickReplies: () => ['Change Status', 'Create Quote', 'End Chat'],
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const lower = input.toLowerCase();

        if (lower === 'change status') {
          return { nextNodeId: 'choose_id' };
        }

        if (
          lower.includes('create quote') ||
          lower === 'create quote' ||
          lower === 'quote'
        ) {
          return { nextNodeId: 'choose_quote_target' };
        }

        return null;
      },
    };
  }

  private createChooseIdNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingOrders(orderState);
        return [
          { role: 'printy', text: 'Which order ID would you like to change?' },
        ];
      },
      quickReplies: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingOrders(orderState);
        return [
          ...remaining.map(o => o.id),
          'Change to All in One instead',
          'End Chat',
        ];
      },
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const lower = input.toLowerCase();

        if (lower === 'change to all in one instead') {
          return { nextNodeId: 'choose_bulk_status' };
        }

        const remaining = this.getRemainingOrders(orderState);
        const ids = extractOrderIds(input);
        const pick =
          ids[0] || remaining.find(o => o.id.toLowerCase() === lower)?.id;

        if (!pick || !remaining.find(o => o.id === pick)) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please pick one of the selected order IDs.',
              },
            ],
            quickReplies: [
              ...remaining.map(o => o.id),
              'Change to All in One instead',
              'End Chat',
            ],
          };
        }

        return {
          nextNodeId: 'choose_status',
          stateUpdates: { currentTargetId: pick },
        };
      },
    };
  }

  private createStatusChangeNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) return [{ role: 'printy', text: 'Order not found.' }];
        return [
          {
            role: 'printy',
            text: `Current status of ${order.id} is ${order.status}. Choose new status.`,
          },
        ];
      },
      quickReplies: () => [...ORDER_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
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
                text: `What status should I set for ${order.id}?`,
              },
            ],
            quickReplies: [...ORDER_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const prev = order.status;
        this.updateOrder(order.id, { status: next }, orderState);

        const changedIds = new Set(orderState.changedIds);
        changedIds.add(order.id);

        const remaining = this.getRemainingOrders({
          ...orderState,
          changedIds,
        });
        const msgs: BotMessage[] = [
          createStatusChangeMessage(order.id, prev, next),
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_id',
            stateUpdates: { changedIds, currentTargetId: null },
            messages: [
              ...msgs,
              { role: 'printy', text: 'Pick another order to update.' },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'choose_status',
            stateUpdates: { changedIds, currentTargetId: remaining[0].id },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { changedIds, currentTargetId: null },
          messages: msgs,
        };
      },
    };
  }

  private createBulkStatusChangeNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        return [
          {
            role: 'printy',
            text: 'Okay, apply one status to all selected. What status?',
          },
        ];
      },
      quickReplies: () => [...ORDER_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const next = normalizeOrderStatus(input);

        if (!next) {
          return {
            messages: [
              { role: 'printy', text: 'Please choose a valid status.' },
            ],
            quickReplies: [...ORDER_STATUS_OPTIONS, 'End Chat'],
          };
        }

        const selected = this.getSelectedOrders(orderState);
        const msgs: BotMessage[] = [
          {
            role: 'printy',
            text: `✅ Applying ${next} to ${selected.length} order(s):`,
          },
        ];

        selected.forEach(order => {
          const prev = order.status;
          this.updateOrder(order.id, { status: next }, orderState);
          msgs.push({ role: 'printy', text: `${order.id}: ${prev} → ${next}` });
        });

        return {
          nextNodeId: 'done',
          stateUpdates: { changedIds: new Set(orderState.selectedIds) },
          messages: msgs,
        };
      },
    };
  }

  private createChooseQuoteTargetNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingQuoteOrders(orderState);
        return [
          {
            role: 'printy',
            text: 'Which order ID would you like to create a quote for?',
          },
        ];
      },
      quickReplies: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingQuoteOrders(orderState);
        return [...remaining.map(o => o.id), 'End Chat'];
      },
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingQuoteOrders(orderState);
        const ids = extractOrderIds(input);
        const pick =
          ids[0] ||
          remaining.find(o => o.id.toLowerCase() === input.toLowerCase())?.id;

        if (!pick || !remaining.find(o => o.id === pick)) {
          return {
            messages: [
              {
                role: 'printy',
                text: 'Please pick one of the selected order IDs.',
              },
            ],
            quickReplies: [...remaining.map(o => o.id), 'End Chat'],
          };
        }

        return {
          nextNodeId: 'ask_quote_price',
          stateUpdates: { currentTargetId: pick },
        };
      },
    };
  }

  private createQuotePriceNode(): NodeHandler {
    return {
      messages: (state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
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
      handleInput: (input: string, state: FlowState, context: FlowContext) => {
        const orderState = state as MultipleOrdersState;
        const order = this.getCurrentOrder(orderState);
        if (!order) {
          return {
            messages: [{ role: 'printy', text: 'Order not found.' }],
            quickReplies: ['End Chat'],
          };
        }

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

        const quotedIds = new Set(orderState.quotedIds);
        quotedIds.add(order.id);

        const remaining = this.getRemainingQuoteOrders({
          ...orderState,
          quotedIds,
        });
        const msgs: BotMessage[] = [
          createQuoteCreatedMessage(order.id, formatted),
        ];

        if (remaining.length > 1) {
          return {
            nextNodeId: 'choose_quote_target',
            stateUpdates: { quotedIds, currentTargetId: null },
            messages: [
              ...msgs,
              {
                role: 'printy',
                text: 'Pick another order to create a quote for.',
              },
            ],
          };
        }

        if (remaining.length === 1) {
          return {
            nextNodeId: 'ask_quote_price',
            stateUpdates: { quotedIds, currentTargetId: remaining[0].id },
            messages: msgs,
          };
        }

        return {
          nextNodeId: 'done',
          stateUpdates: { quotedIds, currentTargetId: null },
          messages: msgs,
        };
      },
    };
  }

  private createDoneNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'All selected orders have been updated. Anything else?',
        },
      ],
      quickReplies: () => ['Change Status', 'End Chat'],
    };
  }

  private getSelectedOrders(state: MultipleOrdersState): any[] {
    return state.selectedIds
      .map(id => this.findOrder(id, state))
      .filter(Boolean);
  }

  private getRemainingOrders(state: MultipleOrdersState): any[] {
    return state.selectedIds
      .filter(id => !state.changedIds.has(id))
      .map(id => this.findOrder(id, state))
      .filter(Boolean);
  }

  private getRemainingQuoteOrders(state: MultipleOrdersState): any[] {
    return state.selectedIds
      .filter(id => !state.quotedIds.has(id))
      .map(id => this.findOrder(id, state))
      .filter(Boolean);
  }

  private getCurrentOrder(state: MultipleOrdersState): any {
    if (!state.currentTargetId) return null;
    return this.findOrder(state.currentTargetId, state);
  }

  private findOrder(id: string, state: MultipleOrdersState): any {
    const up = id.toUpperCase();
    return (
      state.ordersRef.find(o => (o.id || '').toUpperCase() === up) ||
      mockOrders.find(o => (o.id || '').toUpperCase() === up)
    );
  }

  private updateOrder(
    orderId: string,
    updates: Partial<any>,
    state: MultipleOrdersState
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
    state.ordersRef = state.ordersRef.map(o =>
      o.id === orderId ? { ...o, ...updates } : o
    );

    // Refresh if available
    if (this.context.refreshOrders) {
      this.context.refreshOrders();
    }
  }
}

export const multipleOrdersFlow = new MultipleOrdersFlow();
