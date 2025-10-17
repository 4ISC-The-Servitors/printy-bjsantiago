import { useEffect } from 'react';
import { supabase } from './supabase';
import { useToast } from './useToast';

// ✅ This hook sets up realtime listeners for ticket/order updates
export const useRealtimeNotifications = () => {
  const [_, toast] = useToast();

  useEffect(() => {
    // 🔔 Listen to ticket updates
    const ticketChannel = supabase
      .channel('tickets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        (payload) => {
          console.log('Realtime ticket payload:', payload);

          if (payload.eventType === 'INSERT') {
            toast.info(
              'New Ticket Created',
              `Ticket ${payload.new.display_id} has been submitted.`
            );
          }

          if (payload.eventType === 'UPDATE') {
            toast.success(
              'Ticket Updated',
              `Ticket ${payload.new.display_id} status changed to ${payload.new.status}.`
            );
          }
        }
      )
      .subscribe();

    // 🔔 Listen to order updates
    const orderChannel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime order payload:', payload);

          if (payload.eventType === 'INSERT') {
            toast.success(
              'New Order Created',
              `Order ${payload.new.display_id} has been created.`
            );
          }

          if (payload.eventType === 'UPDATE') {
            toast.info(
              'Order Updated',
              `Order ${payload.new.display_id} has been updated.`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(orderChannel);
    };
  }, [toast]);
};

