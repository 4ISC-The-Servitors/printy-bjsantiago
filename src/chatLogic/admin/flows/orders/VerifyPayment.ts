import type { FlowState, FlowContext, NodeHandler } from '../../shared';

type Getter<T> = (state: FlowState, context: FlowContext) => T;
type Updater = (id: string, updates: Partial<any>, state: FlowState) => void;

export function createVerifyPaymentNodes(opts: {
  getOrders: Getter<any[]>;
  getOrderById: (state: FlowState, id: string) => any | null;
  setCurrentOrderId: (state: FlowState, id: string) => void;
  updateOrder: Updater;
}): Record<string, NodeHandler> {
  const { getOrders, getOrderById, setCurrentOrderId, updateOrder } = opts;

  const start: NodeHandler = {
    messages: (state, context) => {
      const orders = (getOrders(state, context) || []).filter(
        o => String(o.status).toLowerCase() === 'verifying payment'
      );

      // If a subject order is already selected, focus exclusively on it
      const currentId = (state as any).currentOrderId as string | null;
      if (currentId) {
        const ord = (orders || []).find(o => (o.id || '').toLowerCase() === currentId.toLowerCase());
        if (!ord) {
          return [
            {
              role: 'printy',
              text: `${currentId} is not in Verifying Payment. This flow only works for Verifying Payment orders.`,
            },
          ];
        }
        setCurrentOrderId(state, ord.id);
        const uploadedAt = ord.proofUploadedAt || '—';
        const img = ord.proofOfPaymentUrl ? `(${ord.proofOfPaymentUrl})` : '';
        const lines = [
          `Here is the proof of payment of customer ${ord.customer} ${ord.id}. Uploaded on ${uploadedAt}. Their total balance is ${ord.total}.`,
          img,
        ].filter(Boolean);
        return lines.map(text => ({ role: 'printy' as const, text }));
      }

      if (orders.length === 0) {
        return [
          {
            role: 'printy',
            text: 'There are no orders with Verifying Payment status right now.',
          },
        ];
      }

      if (orders.length === 1) {
        // No selected subject; auto-pick the only verifying order
        const ord = orders[0];
        setCurrentOrderId(state, ord.id);
        const uploadedAt = ord.proofUploadedAt || '—';
        const img = ord.proofOfPaymentUrl ? `(${ord.proofOfPaymentUrl})` : '';
        const lines = [
          `Here is the proof of payment of customer ${ord.customer} ${ord.id}. Uploaded on ${uploadedAt}. Their total balance is ${ord.total}.`,
          img,
        ].filter(Boolean);
        return lines.map(text => ({ role: 'printy' as const, text }));
      }

      // Multiple verifying orders but no selected subject — pick the first to keep scope singular
      const ord = orders[0];
      setCurrentOrderId(state, ord.id);
      const uploadedAt = ord.proofUploadedAt || '—';
      const img = ord.proofOfPaymentUrl ? `(${ord.proofOfPaymentUrl})` : '';
      const lines = [
        `Here is the proof of payment of customer ${ord.customer} ${ord.id}. Uploaded on ${uploadedAt}. Their total balance is ${ord.total}.`,
        img,
      ].filter(Boolean);
      return lines.map(text => ({ role: 'printy' as const, text }));
    },
    quickReplies: (state, context) => {
      // Always operate on a single subject in this flow
      return ['Confirm Payment', 'Deny Payment', 'End Chat'];
    },
    handleInput: (input, state, context) => {
      const lower = input.trim().toLowerCase();
      const currentId = (state as any).currentOrderId as string | null;
      if (!currentId) return null;

      // Lightweight idempotency lock
      (state as any).__verifyLock = (state as any).__verifyLock || {};
      const lock = (state as any).__verifyLock as Record<string, boolean>;

      if (lower.startsWith('confirm')) {
        if (lock[currentId]) return { nextNodeId: 'done' };
        lock[currentId] = true;
        updateOrder(currentId, { status: 'For Delivery/Pick-up' }, state);
        return {
          nextNodeId: 'done',
          messages: [
            {
              role: 'printy',
              text: `✅ ${currentId}: Verifying Payment → For Delivery/Pick-up`,
            },
          ],
        };
      }

      if (lower.startsWith('deny')) {
        if (lock[currentId]) return { nextNodeId: 'done' };
        lock[currentId] = true;
        updateOrder(currentId, { status: 'Awaiting Payment' }, state);
        return {
          nextNodeId: 'done',
          messages: [
            {
              role: 'printy',
              text: `⏪ ${currentId}: Set back to Awaiting Payment. Customer will be asked to re-upload proof.`,
            },
          ],
        };
      }

      return null;
    },
  };

  const proof: NodeHandler = {
    messages: (state, context) => {
      // Current order should be set
      const currentId = (state as any).currentOrderId as string | null;
      if (!currentId) return [{ role: 'printy', text: 'Order not found.' }];
      const order = getOrderById(state, currentId);
      if (!order) return [{ role: 'printy', text: 'Order not found.' }];

      const uploadedAt = order.proofUploadedAt || '—';
      const img = order.proofOfPaymentUrl ? `(${order.proofOfPaymentUrl})` : '';
      const lines = [
        `Here is the proof of payment of customer ${order.customer} ${order.id}. Uploaded on ${uploadedAt}. Their total balance is ${order.total}.`,
        img,
      ].filter(Boolean);

      return lines.map(text => ({ role: 'printy' as const, text }));
    },
    quickReplies: () => ['Confirm Payment', 'Deny Payment', 'End Chat'],
    handleInput: (input, state, context) => {
      const lower = input.trim().toLowerCase();
      const currentId = (state as any).currentOrderId as string | null;
      if (!currentId) return null;

      // Lightweight idempotency lock for multi-order path
      (state as any).__verifyLock = (state as any).__verifyLock || {};
      const lock = (state as any).__verifyLock as Record<string, boolean>;

      if (lower.startsWith('confirm')) {
        if (lock[currentId]) return { nextNodeId: 'done' };
        lock[currentId] = true;
        updateOrder(currentId, { status: 'For Delivery/Pick-up' }, state);
        return {
          nextNodeId: 'done',
          messages: [
            {
              role: 'printy',
              text: `✅ ${currentId}: Verifying Payment → For Delivery/Pick-up`,
            },
          ],
        };
      }

      if (lower.startsWith('deny')) {
        if (lock[currentId]) return { nextNodeId: 'done' };
        lock[currentId] = true;
        updateOrder(currentId, { status: 'Awaiting Payment' }, state);
        return {
          nextNodeId: 'done',
          messages: [
            {
              role: 'printy',
              text: `⏪ ${currentId}: Set back to Awaiting Payment. Customer will be asked to re-upload proof.`,
            },
          ],
        };
      }

      return null;
    },
  };

  return {
    verify_payment_start: start,
    verify_payment_proof: proof,
  };
}


