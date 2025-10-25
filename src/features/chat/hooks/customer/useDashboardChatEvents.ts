/**
 * useDashboardChatEvents
 * Wires dashboard-level events: pay now, open session.
 */
import { useEffect } from 'react';
import { getSessionTitle } from '@features/chat/config/sessionTitleConfig';

export function useDashboardChatEvents(
  initializeFlow: (flowId: string, title: string, ctx?: any) => void,
  switchConversation: (id: string) => void,
  getRecentOrderId: () => string | undefined,
  getRecentTotal: () => string | undefined
) {
  // Pay Now
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        displayId?: string;
        total?: string;
      };
      const orderId = detail?.orderId || getRecentOrderId();
      const displayId = detail?.displayId || orderId;

      // Use centralized title generation with context
      const title = getSessionTitle({
        flowId: 'pay-order',
        metadata: {
          context: {
            display_id: displayId,
          },
        },
        order: { display_id: displayId },
      });

      initializeFlow('pay-order', title, {
        order_id: orderId,
        display_id: displayId,
        total_amount: detail?.total || getRecentTotal(),
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

  // Reupload Payment
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        orderId?: string;
        total?: string;
        displayId?: string;
      };
      const orderId = detail?.orderId || getRecentOrderId();
      const displayId = detail?.displayId || orderId;

      // Use centralized title generation with context
      const title = getSessionTitle({
        flowId: 'reupload-payment',
        metadata: {
          context: {
            display_id: displayId,
          },
        },
        order: { display_id: displayId },
      });

      initializeFlow('reupload-payment', title, {
        order_id: orderId,
        total_amount: detail?.total || getRecentTotal(),
        display_id: displayId,
      });
    };
    window.addEventListener(
      'customer-open-reupload-payment-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-reupload-payment-chat',
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

  // Track Ticket - Open ticket conversation
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        inquiryId: string;
        subject: string;
        displayId?: string;
      };
      const { inquiryId, subject, displayId } = detail;

      if (!inquiryId) return;

      // Use centralized title generation with context
      const title = getSessionTitle({
        flowId: 'track-ticket',
        metadata: {
          context: {
            display_id: displayId,
          },
        },
        inquiry: { display_id: displayId },
      });

      initializeFlow('track-ticket', title, {
        inquiryId,
        subject,
        display_id: displayId,
      });
    };

    window.addEventListener(
      'customer-open-ticket-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-ticket-chat',
        handler as EventListener
      );
  }, [initializeFlow]);

  // Track Quote - Open quote conversation
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail as {
        conversationId: string;
        subject: string;
        displayId?: string;
      };
      const { conversationId, subject, displayId } = detail;

      if (!conversationId) return;

      // Use centralized title generation with context
      const title = getSessionTitle({
        flowId: 'track-quote',
        metadata: {
          context: {
            display_id: displayId,
          },
        },
        quote: { display_id: displayId },
      });

      initializeFlow('track-quote', title, {
        conversation_id: conversationId,
        conversationId,
        subject,
        display_id: displayId,
      });
    };

    window.addEventListener(
      'customer-open-quote-chat',
      handler as EventListener
    );
    return () =>
      window.removeEventListener(
        'customer-open-quote-chat',
        handler as EventListener
      );
  }, [initializeFlow]);
}

export default useDashboardChatEvents;
