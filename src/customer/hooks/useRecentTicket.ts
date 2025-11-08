/**
 * useRecentTicket
 * Fetches the latest inquiry/ticket for the current user and shapes minimal card data.
 *
 * NOTE: Updated to use new sessionQueries pattern for FK-based lookups
 */
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { getCustomerInquiries } from '@features/chat/api/sessionQueries';
import { formatInquiryType } from '@shared/utils/statusFormatter';
import type { RecentTicket } from '@shared/types/customer';

export type RecentTicketData = RecentTicket;

export function useRecentTicket() {
  const [data, setData] = useState<RecentTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  console.log('[useRecentTicket] Hook initialized');

  const loadRecentTicket = useCallback(async () => {
    if (!userId) return;

    try {
      // Use new sessionQueries to get customer inquiries
      const inquiries = await getCustomerInquiries(userId);
      const latestInquiry = inquiries[0]; // Most recent inquiry

      if (latestInquiry) {
        const receivedAt = latestInquiry.createdAt;
        setData({
          id: latestInquiry.inquiry_id,
          displayId:
            latestInquiry.displayId ||
            latestInquiry.inquiry_id.slice(0, 8).toUpperCase(),
          subject: formatInquiryType(latestInquiry.inquiryType || 'other'),
          status: latestInquiry.inquiryStatus || 'unknown',
          createdAt: receivedAt,
          updatedAt: latestInquiry.updatedAt || receivedAt,
          resolvedAt: latestInquiry.resolvedAt,
        });
      } else {
        setData(null);
      }
    } catch (e: any) {
      setError(e?.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (userId) {
      loadRecentTicket();
    }
  }, [userId, loadRecentTicket]);

  // Create unique channel ID to prevent conflicts
  const customerId = useMemo(
    () =>
      userId
        ? `customer-inquiries_v2-${userId}-${Math.random().toString(36).slice(2, 9)}`
        : null,
    [userId]
  );

  // Add real-time subscription for inquiries_v2 table changes
  useEffect(() => {
    if (!userId || !customerId) return;

    console.log(
      '[useRecentTicket] Setting up real-time subscription for inquiries_v2, userId:',
      userId
    );
    console.log('[useRecentTicket] Using channel ID:', customerId);

    const channel = supabase
      .channel(customerId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'inquiries_v2',
          filter: `customer_id=eq.${userId}`,
        },
        payload => {
          console.log(
            '[useRecentTicket] Real-time INSERT event received:',
            payload
          );
          void loadRecentTicket();
        }
      )
      .subscribe((status, err) => {
        console.log('[useRecentTicket] Subscription status:', status);
        if (err) {
          console.error('[useRecentTicket] Subscription error:', err);
        }
      });

    return () => {
      console.log('[useRecentTicket] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [userId, loadRecentTicket, customerId]);

  return { data, loading, error } as const;
}

export default useRecentTicket;
