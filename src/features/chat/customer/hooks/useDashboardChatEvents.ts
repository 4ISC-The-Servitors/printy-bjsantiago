/**
 * useDashboardChatEvents
 * Wires dashboard-level events: cancel order, pay now, open session.
 */
import { useEffect } from 'react';

export function useDashboardChatEvents(
  initializeFlow: (flowId: string, title: string, ctx?: any) => void,
  switchConversation: (id: string) => void,
  getRecentOrderId: () => string | undefined,
  getRecentTotal: () => string | undefined
) {
  // Cancel Order
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        orderStatus?: string;
      };
      const orderId = detail?.orderId || getRecentOrderId();
      const title = `Cancel Order ${orderId ?? ''}`;
      initializeFlow('cancel-order', title, {
        orderId,
        orderStatus: detail?.orderStatus,
      });
    };
    window.addEventListener(
      'customer-open-cancel-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-cancel-chat',
        handler as EventListener
      );
  }, [initializeFlow, getRecentOrderId]);

  // Pay Now
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        total?: string;
      };
      const orderId = detail?.orderId || getRecentOrderId();
      const title = `Payment for Order ${orderId ?? ''}`;
      initializeFlow('payment', title, {
        orderId,
        total: detail?.total || getRecentTotal(),
      });
    };
    window.addEventListener(
      'customer-open-payment-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-payment-chat',
        handler as EventListener
      );
  }, [initializeFlow, getRecentOrderId, getRecentTotal]);

  // Open specific session from Chat History
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { sessionId: string };
      const sessionId = detail?.sessionId;
      if (!sessionId) return;
      switchConversation(sessionId);
    };
    window.addEventListener('customer-open-session', handler as EventListener);
    return () =>
      window.removeEventListener(
        'customer-open-session',
        handler as EventListener
      );
  }, [switchConversation]);
}

export default useDashboardChatEvents;
