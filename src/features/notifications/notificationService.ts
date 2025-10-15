import { supabase } from '../../lib/supabase';
import type { ToastMethods } from '../../lib/useToast';

type Cleanup = () => void;

function msgOrderUpdated(orderId: string) {
  return { title: 'Order updated', message: `Your order ${orderId} has been updated.` };
}
function msgOrderNewRequest(orderId: string) {
  return { title: 'New order request', message: `You have a new order request ${orderId}.` };
}
function msgTicketUpdated(displayId: string) {
  return { title: 'Ticket updated', message: `Your ticket ${displayId} has a new update.` };
}
function msgTicketReply(displayId: string) {
  return { title: 'New ticket reply', message: `Your ticket ${displayId} has a new reply.` };
}
function msgTicketNew(displayId: string) {
  return { title: 'New ticket', message: `New ticket created ${displayId}.` };
}
function msgTicketSubmitted(displayId: string) {
  return { title: 'Ticket submitted', message: `Your ticket ${displayId} has been sent successfully.` };
}
function msgQuoteUpdated(quoteId: string) {
  return { title: 'Quote updated', message: `Quote ${quoteId} status has been updated.` };
}

function safeEq(v?: string | null) {
  return (v ?? '').replace(/[^a-zA-Z0-9-]/g, '');
}

// Simple in-memory dedupe to avoid spamming toasts within a session
const seen = new Set<string>();
const once = (key: string, fn: () => void) => {
  if (seen.has(key)) return;
  seen.add(key);
  fn();
};

/**
 * Customer-side subscriptions
 * - orders: notify on any status change
 * - quotes: notify on status change (e.g., ready/approved/declined)
 * - inquiries: notify on status change or new resolution comment
 */
export function startCustomerNotifications(customerId: string, toast: ToastMethods): Cleanup {
  const cleanups: Cleanup[] = [];

  // Orders for this customer
  const ordersCh = supabase
    .channel(`cust-orders:${customerId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `customer_id=eq.${safeEq(customerId)}` },
      (payload) => {
        const orderId = (payload.new as any)?.order_id;
        if (!orderId) return;
        const key = `cust-order-update:${orderId}:${(payload.new as any)?.order_status}`;
        once(key, () => {
          const { title, message } = msgOrderUpdated(orderId);
          toast.info(title, message);
        });
      }
    )
    .subscribe();
  cleanups.push(() => void supabase.removeChannel(ordersCh));

  // Quotes for this customer's orders
  const quotesCh = supabase
    .channel(`cust-quotes:${customerId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quotes' },
      (payload) => {
        const quoteId = (payload.new as any)?.quote_id || (payload.new as any)?.id;
        if (!quoteId) return;
        const key = `cust-quote:${quoteId}:${payload.eventType}`;
        once(key, () => {
          const { title, message } = msgQuoteUpdated(quoteId);
          toast.info(title, message);
        });
      }
    )
    .subscribe();
  cleanups.push(() => void supabase.removeChannel(quotesCh));

  // Inquiries for this customer
  const inquiriesCh = supabase
    .channel(`cust-inquiries:${customerId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'inquiries', filter: `customer_id=eq.${safeEq(customerId)}` },
      (payload) => {
        const displayId = (payload.new as any)?.display_id || (payload.new as any)?.inquiry_id;
        if (!displayId) return;
        const key = `cust-inquiry-submitted:${displayId}`;
        once(key, () => {
          const { title, message } = msgTicketSubmitted(displayId);
          toast.success(title, message);
        });
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'inquiries', filter: `customer_id=eq.${safeEq(customerId)}` },
      (payload) => {
        const displayId = (payload.new as any)?.display_id || (payload.new as any)?.inquiry_id;
        if (!displayId) return;
        const prevStatus = (payload.old as any)?.inquiry_status;
        const nextStatus = (payload.new as any)?.inquiry_status;
        const prevComment = (payload.old as any)?.resolution_comments || '';
        const nextComment = (payload.new as any)?.resolution_comments || '';

        if (prevStatus !== nextStatus) {
          const key = `cust-inquiry-status:${displayId}:${nextStatus}`;
          once(key, () => {
            const { title, message } = msgTicketUpdated(displayId);
            toast.info(title, message);
          });
        } else if (nextComment && nextComment !== prevComment) {
          const key = `cust-inquiry-reply:${displayId}:${nextComment.length}`;
          once(key, () => {
            const { title, message } = msgTicketReply(displayId);
            toast.info(title, message);
          });
        }
      }
    )
    .subscribe();
  cleanups.push(() => void supabase.removeChannel(inquiriesCh));

  return () => cleanups.forEach(c => c());
}

/**
 * Admin-side subscriptions
 * - inquiries: notify when a new ticket is created
 * - orders: notify when a customer accepts a quote (Awaiting Payment)
 * - quotes: notify on any status change
 */
export function startAdminNotifications(toast: ToastMethods): Cleanup {
  const cleanups: Cleanup[] = [];

  // New inquiries (tickets)
  const inquiriesInsertCh = supabase
    .channel('admin-inquiries-insert')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'inquiries' },
      (payload) => {
        const displayId = (payload.new as any)?.display_id || (payload.new as any)?.inquiry_id;
        if (!displayId) return;
        const key = `admin-inquiry-new:${displayId}`;
        once(key, () => {
          const { title, message } = msgTicketNew(displayId);
          toast.info(title, message);
        });
      }
    )
    .subscribe();
  cleanups.push(() => void supabase.removeChannel(inquiriesInsertCh));

  // Orders: detect transition when a customer accepts a quote
  const ordersUpdateCh = supabase
    .channel('admin-orders-update')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      (payload) => {
        const orderId = (payload.new as any)?.order_id;
        if (!orderId) return;
        const prev = ((payload.old as any)?.order_status || '').toLowerCase();
        const next = ((payload.new as any)?.order_status || '').toLowerCase();
        const accepted =
          (prev === 'needs quote' || prev === 'quoted') && next === 'awaiting payment';
        if (accepted) {
          const key = `admin-order-accepted:${orderId}:${next}`;
          once(key, () => {
            toast.success('Order accepted', `Customer accepted quote for ${orderId}.`);
          });
        } else if (prev !== next) {
          const key = `admin-order-update:${orderId}:${next}`;
          once(key, () => {
            toast.info('Order updated', `Order ${orderId} updated.`);
          });
        }
      }
    )
    .subscribe();
  cleanups.push(() => void supabase.removeChannel(ordersUpdateCh));

  // Quotes: status changes
  const quotesCh = supabase
    .channel('admin-quotes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quotes' },
      (payload) => {
        const quoteId = (payload.new as any)?.quote_id || (payload.new as any)?.id;
        if (!quoteId) return;
        const key = `admin-quote:${quoteId}:${payload.eventType}`;
        once(key, () => {
          const { title, message } = msgQuoteUpdated(quoteId);
          toast.info(title, message);
        });
      }
    )
    .subscribe();
  cleanups.push(() => void supabase.removeChannel(quotesCh));

  return () => cleanups.forEach(c => c());
}


