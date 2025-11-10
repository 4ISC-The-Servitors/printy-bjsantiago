/**
 * useRecentTicket
 * Fetches the latest inquiry/ticket for the current user using admin real-time patterns.
 */
import { useEffect, useState, useRef } from 'react';
import { supabase } from '@lib/supabase';
import { formatInquiryType } from '@shared/utils/statusFormatter';
import type { RecentTicket } from '@shared/types/customer';

export type RecentTicketData = RecentTicket;

export function useRecentTicket() {
  const [data, setData] = useState<RecentTicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const dataRef = useRef<RecentTicketData | null>(null);

  // Normalization function
  const normalizeTicket = (rawData: any): RecentTicketData => {
    const receivedAt = new Date(rawData.received_at).getTime();
    const updatedAt = rawData.updated_at
      ? new Date(rawData.updated_at).getTime()
      : receivedAt;
    const resolvedAt = rawData.resolved_at
      ? new Date(rawData.resolved_at).getTime()
      : undefined;

    return {
      id: rawData.inquiry_id,
      displayId:
        rawData.display_id || rawData.inquiry_id.slice(0, 8).toUpperCase(),
      subject: formatInquiryType(rawData.inquiry_type || 'other'),
      status: rawData.inquiry_status || 'unknown',
      createdAt: receivedAt,
      updatedAt,
      resolvedAt,
    };
  };

  // Fetch initial recent ticket and set up user ID
  useEffect(() => {
    const initialize = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }
        setUserId(user.id);

        const { data: inquiryData, error: inquiryError } = await supabase
          .from('inquiries_v2')
          .select(
            `
            inquiry_id,
            display_id,
            inquiry_status,
            inquiry_type,
            received_at,
            updated_at,
            resolved_at
          `
          )
          .eq('customer_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (inquiryError) {
          setError(inquiryError.message);
          setLoading(false);
          return;
        }

        if (inquiryData) {
          const ticketData = normalizeTicket(inquiryData);
          setData(ticketData);
          dataRef.current = ticketData;
        } else {
          dataRef.current = null;
        }
      } catch (e: any) {
        console.error('[useRecentTicket] Initialization error:', e);
        setError(e?.message || 'Unknown error');
        dataRef.current = null;
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Update ref whenever data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Real-time subscription for inquiries changes using admin pattern
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('inquiries_v2-customer-recent')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inquiries_v2',
          filter: `customer_id=eq.${userId}`,
        },
        async payload => {
          const inquiryId =
            (payload.new as any)?.inquiry_id ||
            (payload.old as any)?.inquiry_id;
          if (!inquiryId) return;

          try {
            // Handle DELETE: remove from local state or refetch
            if (payload.eventType === 'DELETE') {
              if (dataRef.current?.id === inquiryId) {
                // Refetch latest ticket
                const { data: latestData, error: latestError } = await supabase
                  .from('inquiries_v2')
                  .select(
                    `
                    inquiry_id,
                    display_id,
                    inquiry_status,
                    inquiry_type,
                    received_at,
                    updated_at,
                    resolved_at
                  `
                  )
                  .eq('customer_id', userId)
                  .order('updated_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();

                if (!latestError && latestData) {
                  const ticketData = normalizeTicket(latestData);
                  setData(ticketData);
                  dataRef.current = ticketData;
                } else {
                  setData(null);
                  dataRef.current = null;
                }
              }
              return;
            }

            // Handle INSERT/UPDATE: fetch single row with joins and merge into state
            const { data: fullTicket, error: fetchError } = await supabase
              .from('inquiries_v2')
              .select(
                `
                inquiry_id,
                display_id,
                inquiry_status,
                inquiry_type,
                received_at,
                updated_at,
                resolved_at
              `
              )
              .eq('inquiry_id', inquiryId)
              .single();

            if (fetchError || !fullTicket) {
              console.error(
                '[useRecentTicket] Error fetching updated ticket:',
                fetchError
              );
              return;
            }

            const normalizedTicket = normalizeTicket(fullTicket);
            const currentTicket = dataRef.current;

            // Determine if this should replace the current ticket
            const shouldUpdate =
              !currentTicket ||
              currentTicket.id === inquiryId ||
              normalizedTicket.updatedAt > currentTicket.updatedAt;

            if (shouldUpdate) {
              setData(normalizedTicket);
              dataRef.current = normalizedTicket;
            }
          } catch (e) {
            console.error(
              '[useRecentTicket] Error processing realtime update:',
              e
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { data, loading, error } as const;
}

export default useRecentTicket;
