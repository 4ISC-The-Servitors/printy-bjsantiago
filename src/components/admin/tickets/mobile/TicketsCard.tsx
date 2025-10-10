import React, { useState, useCallback, useEffect } from 'react';
import { Card, Badge, Button, Text } from '../../../shared';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { MessageSquare, Plus, MoreVertical } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';

const getBadgeVariantForStatus = (
  status: string
): 'info' | 'warning' | 'secondary' => {
  const s = (status || '').toLowerCase();
  if (s === 'open') return 'info';
  if (s === 'pending' || s === 'in progress' || s === 'awaiting')
    return 'warning';
  return 'secondary'; // closed/resolved/other
};

type InquiryRecord = {
  inquiry_id: string;
  inquiry_type: string | null;
  inquiry_status: string | null;
  inquiry_message?: string | null;
  customer_id?: string | null;
  customer_full_name?: string | null;
  customer_first_name?: string | null;
  customer_last_name?: string | null;
};

const TicketsCard: React.FC = () => {
  const { openChat, openChatWithTopic } = useAdmin();
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(
    new Set()
  );
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState<boolean>(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const from = (page - 1) * pageSize;
    try {
      const { data, error } = await supabase.rpc('api_inquiries_admin_list', {
        p_limit: pageSize,
        p_offset: from,
      });

      let rows: any[] = [];
      if (!error && Array.isArray(data)) {
        rows = data as any[];
      } else {
        const { data: userRows, error: userErr } = await supabase.rpc(
          'api_inquiries_for_user',
          { p_limit: pageSize, p_offset: from }
        );
        if (!userErr && Array.isArray(userRows)) {
          rows = userRows as any[];
        } else {
          const { data: viewRows, error: viewErr } = await supabase
            .from('inquiries_secure')
            .select(
              'inquiry_id, customer_id, inquiry_type, inquiry_status, inquiry_message'
            )
            .order('received_at', { ascending: false })
            .range(from, from + pageSize - 1);
          if (!viewErr && Array.isArray(viewRows)) rows = viewRows as any[];
          if (viewErr && error) throw error;
        }
      }

      const normalized: InquiryRecord[] = (rows || []).map(row => {
        const first = (row as any).customer_first_name || '';
        const last = (row as any).customer_last_name || '';
        const full = `${first} ${last}`.trim() || null;
        return {
          inquiry_id: (row as any).inquiry_id,
          inquiry_type: (row as any).inquiry_type,
          inquiry_status: (row as any).inquiry_status,
          inquiry_message: (row as any).inquiry_message,
          customer_id: (row as any).customer_id,
          customer_full_name: full,
          customer_first_name: first || null,
          customer_last_name: last || null,
        } as InquiryRecord;
      });
      setInquiries(normalized);
      setHasMore(normalized.length === pageSize);
    } catch (e) {
      console.error('Failed to load inquiries', e);
      setErrorMessage('Unable to load inquiries.');
      setInquiries([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadInquiries();
  }, [loadInquiries]);

  useEffect(() => {
    const channel = supabase
      .channel('inquiries-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inquiries' },
        () => {
          void loadInquiries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInquiries]);

  const displayInquiries = inquiries;
  const mappedTickets = displayInquiries.map(i => ({
    id: i.inquiry_id,
    subject: i.inquiry_type || '—',
    status: i.inquiry_status || 'open',
    description: i.inquiry_message || '',
    requester: i.customer_full_name || 'Customer',
    lastMessage: i.inquiry_message || '',
  }));
  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticketId)) {
        newSet.delete(ticketId);
      } else {
        newSet.add(ticketId);
      }
      return newSet;
    });
  };

  const addSelectedToChat = () => {
    selectedTickets.forEach(() => {
      // Add selected tickets to chat context
    });
    openChat();
    setSelectedTickets(new Set()); // Clear selections after adding to chat
  };

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <Text variant="h3" size="lg" weight="semibold">
            Recent Tickets
          </Text>
        </div>

        <div className="divide-y divide-neutral-200">
          {loading && (
            <div className="p-4 text-sm text-neutral-500">
              Loading inquiries…
            </div>
          )}
          {!loading && errorMessage && (
            <div className="p-4 text-sm text-error-600">{errorMessage}</div>
          )}
          {!loading && !errorMessage && displayInquiries.length === 0 && (
            <div className="p-4 text-sm text-neutral-500">
              No inquiries found.
            </div>
          )}
          {!loading &&
            !errorMessage &&
            displayInquiries.map(t => (
              <div key={t.inquiry_id} className="p-4 space-y-3">
                {/* Header row with ID and actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      className="w-5 h-5 accent-brand-primary rounded"
                      checked={selectedTickets.has(t.inquiry_id)}
                      onChange={() => toggleTicketSelection(t.inquiry_id)}
                      title="Select ticket"
                    />
                    <div className="min-w-0 flex-1">
                      <Text
                        variant="p"
                        size="sm"
                        color="muted"
                        className="truncate"
                      >
                        {t.inquiry_id}
                      </Text>
                      <Text variant="p" size="xs" color="muted">
                        {t.customer_full_name ?? '—'}
                      </Text>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      aria-label={`Ask about ${t.inquiry_id}`}
                      onClick={() => {
                        if (openChatWithTopic) {
                          openChatWithTopic(
                            'tickets',
                            t.inquiry_id,
                            undefined,
                            mappedTickets
                          );
                        } else {
                          openChat();
                        }
                      }}
                      className="w-10 h-10 p-0"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="w-10 h-10 p-0">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <Text
                    variant="h4"
                    size="base"
                    weight="medium"
                    className="line-clamp-2"
                  >
                    {t.inquiry_type || '—'}
                  </Text>
                </div>

                {/* Status badge */}
                <div className="flex items-center justify-start">
                  <Badge
                    size="sm"
                    variant={getBadgeVariantForStatus(t.inquiry_status || '')}
                  >
                    {t.inquiry_status}
                  </Badge>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Floating Add to Chat button (match Portfolio mobile style) */}
      {selectedTickets.size > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
          >
            <Plus className="w-5 h-5" />
            Add to Chat ({selectedTickets.size})
          </Button>
        </div>
      )}

      {/* Pagination controls */}
      <div className="mt-3 mb-16 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 1 || loading}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasMore || loading}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TicketsCard;
