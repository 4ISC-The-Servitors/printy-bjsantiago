// Refactored MultipleOrders Flow using shared utilities and base framework

import type { BotMessage } from '../../../types/chatFlow';
// BACKEND_TODO: Remove mockOrders import; rely solely on context-provided orders from Supabase.
import { mockOrders } from '../../../data/orders'; // DELETE when backend is wired
import { FlowBase, ORDER_STATUS_OPTIONS, createSelectionListMessage } from '../shared';
import { normalizeOrderStatus } from '../shared/utils/StatusNormalizers';
import type { FlowState, FlowContext, NodeHandler } from '../shared';
import { extractOrderIds } from '../shared/utils/IdExtractors';
import { createStatusChangeNode as createStatusChangeNodeFactory } from './orders/ChangeOrderStatus';
import { createQuotePriceNode as createQuotePriceNodeFactory } from './orders/Qouting';

type MultipleOrdersNodeId =
  | 'multi_start'
  | 'action'
  | 'choose_id'
  | 'choose_status'
  | 'choose_bulk_status'
  | 'choose_quote_target'
  | 'ask_quote_price'
  | 'verify_payment_pick'
  | 'verify_payment_proof'
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

    // Status change node (shared)
    this.registerNode(
      'choose_status',
      createStatusChangeNodeFactory({
        getCurrentOrder: (_s: FlowState, _c: FlowContext) =>
          this.getCurrentOrder(this.state as MultipleOrdersState),
        updateOrder: (
          id: string,
          updates: Partial<any>,
          _s: FlowState,
          _c: FlowContext
        ) => this.updateOrder(id, updates, this.state as MultipleOrdersState),
        getStatusOptions: () => ORDER_STATUS_OPTIONS,
        normalizeStatus: normalizeOrderStatus,
        nextNodeId: 'choose_id',
      })
    );

    // Bulk status change node
    this.registerNode('choose_bulk_status', this.createBulkStatusChangeNode());

    // Choose quote target node
    this.registerNode(
      'choose_quote_target',
      this.createChooseQuoteTargetNode()
    );

    // Quote price node (shared)
    this.registerNode(
      'ask_quote_price',
      createQuotePriceNodeFactory({
        getCurrentOrder: () =>
          this.getCurrentOrder(this.state as MultipleOrdersState),
        updateOrder: (
          id: string,
          updates: Partial<any>,
          _s: FlowState,
          _c: FlowContext
        ) => this.updateOrder(id, updates, this.state as MultipleOrdersState),
        nextNodeId: 'choose_quote_target',
      })
    );

    // Verify payment nodes (multi)
    this.registerNode('verify_payment_pick', this.createVerifyPickNode());
    this.registerNode('verify_payment_proof', this.createVerifyProofNode());

    // Done node
    this.registerNode('done', this.createDoneNode());
  }

  private createMultiStartNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
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
      quickReplies: (state: FlowState) => {
        const s = state as MultipleOrdersState;
        const hasVerifying = this.getVerifyingSelectedOrders(s).length > 0;
        return hasVerifying
          ? ['Change Status', 'Create Quote', 'Verify Payment', 'End Chat']
          : ['Change Status', 'Create Quote', 'End Chat'];
      },
      handleInput: (input: string) => {
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

        if (lower.includes('verify') && lower.includes('payment')) {
          return { nextNodeId: 'verify_payment_pick' };
        }

        return null;
      },
    };
  }

  private createActionNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
        const orderState = state as MultipleOrdersState;
        return [
          {
            role: 'printy',
            text: `You selected ${orderState.selectedIds.length} orders. What do you want to do with these orders?`,
          },
        ];
      },
      quickReplies: (state: FlowState) => {
        const s = state as MultipleOrdersState;
        const hasVerifying = this.getVerifyingSelectedOrders(s).length > 0;
        return hasVerifying
          ? ['Change Status', 'Create Quote', 'Verify Payment', 'End Chat']
          : ['Change Status', 'Create Quote', 'End Chat'];
      },
      handleInput: (input: string) => {
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

        if (lower.includes('verify') && lower.includes('payment')) {
          return { nextNodeId: 'verify_payment_pick' };
        }

        return null;
      },
    };
  }

  private createChooseIdNode(): NodeHandler {
    return {
      messages: () => {
        // const orderState = state as MultipleOrdersState;
        // const remaining = this.getRemainingOrders(orderState);
        return [
          { role: 'printy', text: 'Which order ID would you like to change?' },
        ];
      },
      quickReplies: (state: FlowState) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingOrders(orderState);
        return [
          ...remaining.map(o => o.id),
          'Change to All in One instead',
          'End Chat',
        ];
      },
      handleInput: (input: string, state: FlowState) => {
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

  

  private createBulkStatusChangeNode(): NodeHandler {
    return {
      messages: () => {
        return [
          {
            role: 'printy',
            text: 'Okay, apply one status to all selected. What status?',
          },
        ];
      },
      quickReplies: () => [...ORDER_STATUS_OPTIONS, 'End Chat'],
      handleInput: (input: string, state: FlowState) => {
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
      messages: () => {
        // const orderState = state as MultipleOrdersState;
        // const remaining = this.getRemainingQuoteOrders(orderState);
        return [
          {
            role: 'printy',
            text: 'Which order ID would you like to create a quote for?',
          },
        ];
      },
      quickReplies: (state: FlowState) => {
        const orderState = state as MultipleOrdersState;
        const remaining = this.getRemainingQuoteOrders(orderState);
        return [...remaining.map(o => o.id), 'End Chat'];
      },
      handleInput: (input: string, state: FlowState) => {
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

  

  private createVerifyPickNode(): NodeHandler {
    return {
      messages: () => [
        {
          role: 'printy',
          text: 'Please choose order ID you want to verify first',
        },
      ],
      quickReplies: (state: FlowState) => {
        const s = state as MultipleOrdersState;
        return this.getVerifyingSelectedOrders(s)
          .map(o => o.id)
          .concat(['End Chat']);
      },
      handleInput: (input: string, state: FlowState) => {
        const s = state as MultipleOrdersState;
        const options = this.getVerifyingSelectedOrders(s);
        const pick = options.find(
          o => o.id.toLowerCase() === input.trim().toLowerCase()
        );
        if (!pick) return null;
        return {
          nextNodeId: 'verify_payment_proof',
          stateUpdates: { currentTargetId: pick.id },
        };
      },
    };
  }

  private createVerifyProofNode(): NodeHandler {
    return {
      messages: (state: FlowState) => {
        const s = state as MultipleOrdersState;
        const order = this.getCurrentOrder(s);
        if (!order) return [{ role: 'printy', text: 'Order not found.' }];
        const uploadedAt = order.proofUploadedAt || '—';
        const img = order.proofOfPaymentUrl
          ? `(${order.proofOfPaymentUrl})`
          : '';
        const lines = [
          `Here is the proof of payment of customer ${order.customer} ${order.id}. Uploaded on ${uploadedAt}. Their total balance is ${order.total}.`,
          img,
        ].filter(Boolean);
        return lines.map(m => ({ role: 'printy' as const, text: m }));
      },
      quickReplies: () => ['Confirm Payment', 'Deny Payment', 'End Chat'],
      handleInput: (input: string, state: FlowState) => {
        const s = state as MultipleOrdersState;
        const lower = input.trim().toLowerCase();
        const order = this.getCurrentOrder(s);
        if (!order) return null;
        (s as any).__verifyLock = (s as any).__verifyLock || {};
        const lock = (s as any).__verifyLock as Record<string, boolean>;
        if (lower.startsWith('confirm')) {
          if (lock[order.id]) return { nextNodeId: 'verify_payment_pick' };
          lock[order.id] = true;
          this.updateOrder(order.id, { status: 'For Delivery/Pick-up' }, s);
        } else if (lower.startsWith('deny')) {
          if (lock[order.id]) return { nextNodeId: 'verify_payment_pick' };
          lock[order.id] = true;
          this.updateOrder(order.id, { status: 'Awaiting Payment' }, s);
        } else {
          return null;
        }

        // Move to next remaining verifying order (if any)
        const remaining = this.getVerifyingSelectedOrders(s).filter(
          o => o.id !== order.id
        );
        if (remaining.length > 0) {
          return {
            nextNodeId: 'verify_payment_pick',
            stateUpdates: { currentTargetId: null },
          };
        }
        return { nextNodeId: 'done', stateUpdates: { currentTargetId: null } };
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

  private getVerifyingSelectedOrders(state: MultipleOrdersState): any[] {
    return this.getSelectedOrders(state).filter(
      o => String(o.status).toLowerCase() === 'verifying payment'
    );
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
