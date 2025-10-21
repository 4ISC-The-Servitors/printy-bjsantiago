/**
 * useRecentTicket
 * Fetches the latest inquiry/ticket for the current user and shapes minimal card data.
 *
 * NOTE: Updated to use new sessionQueries pattern for FK-based lookups
 */
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { getCustomerInquiries } from '@features/chat/api/sessionQueries';
import type { RecentTicket } from '@shared/types/customer';

export type RecentTicketData = RecentTicket;

export function useRecentTicket() {
  const [data, setData] = useState<RecentTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        // Use new sessionQueries to get customer inquiries
        const inquiries = await getCustomerInquiries(user.id);
        const latestInquiry = inquiries[0]; // Most recent inquiry

        if (latestInquiry) {
          const receivedAt = latestInquiry.createdAt;
          setData({
            id: latestInquiry.inquiry_id,
            displayId:
              latestInquiry.displayId ||
              latestInquiry.inquiry_id.slice(0, 8).toUpperCase(),
            subject: latestInquiry.inquiryType || '(no subject)',
            status: latestInquiry.inquiryStatus || 'unknown',
            createdAt: receivedAt,
            updatedAt: latestInquiry.updatedAt || receivedAt,
            resolvedAt: latestInquiry.resolvedAt,
          });
        }
      } catch (e: any) {
        setError(e?.message || 'Unknown error');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { data, loading, error } as const;
}

export default useRecentTicket;
