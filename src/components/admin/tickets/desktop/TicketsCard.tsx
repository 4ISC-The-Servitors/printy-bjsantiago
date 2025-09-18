import React, { useState, useEffect, useCallback } from 'react';
import { Card, Badge, Button, Skeleton, Checkbox } from '../../../shared';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { getTicketStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { MessageSquare, Plus } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { supabase } from '../../../../lib/supabase';

// variant derived by getTicketStatusBadgeVariant

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
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hoveredTicketId, setHoveredTicketId] = useState<string | null>(null);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(
    new Set()
  );
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [hasMore, setHasMore] = useState<boolean>(false);

  const loadInquiries = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await supabase
      .from('inquiries')
      .select(
        `
        inquiry_id,
        inquiry_type,
        inquiry_status,
        inquiry_message,
        customer_id,
        customer:customer_id (
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .order('received_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Failed to load inquiries', error);
      setErrorMessage('Unable to load inquiries.');
      setInquiries([]);
    } else {
      const normalized: InquiryRecord[] = (data as any[]).map(row => {
        const first = row?.customer?.first_name || '';
        const last = row?.customer?.last_name || '';
        const full = `${first} ${last}`.trim() || null;
        return {
          inquiry_id: row.inquiry_id,
          inquiry_type: row.inquiry_type,
          inquiry_status: row.inquiry_status,
          inquiry_message: row.inquiry_message,
          customer_id: row.customer_id,
          customer_full_name: full,
          customer_first_name: first || null,
          customer_last_name: last || null,
        };
      });
      setInquiries(normalized);
      setHasMore(typeof count === 'number' ? to + 1 < count : normalized.length === pageSize);
    }
    setIsLoading(false);
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
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const addSelectedToChat = () => {
    if (selectedTickets.size === 0) return;
    selectedTickets.forEach(() => {
      // Could add selection to chips bar if needed
    });
    openChat();
    setSelectedTickets(new Set());
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Card className="p-0">
          <div className="flex items-center justify-end px-3 py-2 sm:px-4">
            <Skeleton variant="rectangular" width="40px" height="20px" />
          </div>
          <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60"
              >
                <Skeleton variant="circular" width="16px" height="16px" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton variant="text" width="100px" height="16px" />
                    <Skeleton variant="text" width="120px" height="16px" />
                  </div>
                  <Skeleton variant="text" width="80px" height="14px" />
                  <Skeleton variant="text" width="140px" height="16px" />
                  <Skeleton variant="rectangular" width="60px" height="20px" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton variant="rectangular" width="32px" height="32px" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="text-xs text-neutral-500">Page {page}</div>
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
            <Badge size="sm" variant="secondary">
              {displayInquiries.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {errorMessage && (
            <div className="p-4 text-sm text-error-600">{errorMessage}</div>
          )}
          {!errorMessage && displayInquiries.length === 0 && (
            <div className="p-4 text-sm text-neutral-500">
              No inquiries found.
            </div>
          )}
          {!errorMessage &&
            displayInquiries.map(t => (
              <div
                key={t.inquiry_id}
                className="group p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
                onMouseEnter={() => setHoveredTicketId(t.inquiry_id)}
                onMouseLeave={() => setHoveredTicketId(null)}
              >
                {/* Hover checkbox on left (match PortfolioCard behavior) */}
                <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                  <Checkbox
                    checked={selectedTickets.has(t.inquiry_id)}
                    onCheckedChange={() => toggleTicketSelection(t.inquiry_id)}
                    className={cn(
                      'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                      hoveredTicketId === t.inquiry_id ||
                        selectedTickets.size > 0
                        ? 'opacity-100'
                        : 'opacity-0'
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pl-6">
                  {/* Left grid: Ticket ID, Subject, then Status below subject */}
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                      {t.inquiry_id}
                    </div>
                    <div className="mt-1 text-sm sm:text-base lg:text-lg font-medium text-neutral-900 truncate">
                      {t.inquiry_type || '—'}
                    </div>
                    <div className="mt-2">
                      <Badge
                        size="sm"
                        variant={getTicketStatusBadgeVariant(
                          t.inquiry_status || ''
                        )}
                        className="text-xs sm:text-sm"
                      >
                        {t.inquiry_status}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle grid is removed per new spec; use spacer on md+ */}
                  <div className="hidden md:block" />

                  {/* Right grid: Requester and Date beside Chat button */}
                  <div className="flex items-center justify-between md:justify-end gap-4">
                    <div className="min-w-0 text-right">
                      <div className="text-sm sm:text-base font-medium text-neutral-900 truncate">
                        {t.customer_full_name ?? '—'}
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      threeD
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
                      className="shrink-0 min-h-[40px] min-w-[40px]"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* Floating Add to Chat button (match Portfolio style) */}
      {selectedTickets.size > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={() => {
              if (openChatWithTopic) {
                openChatWithTopic(
                  'multiple-tickets',
                  undefined,
                  undefined,
                  mappedTickets,
                  undefined,
                  Array.from(selectedTickets)
                );
              } else {
                addSelectedToChat();
              }
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
          >
            <Plus className="h-5 w-5" />
            Add to Chat ({selectedTickets.size})
          </Button>
        </div>
      )}

      {/* Pagination controls */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          disabled={page === 1 || isLoading}
          onClick={() => setPage(p => Math.max(1, p - 1))}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!hasMore || isLoading}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default TicketsCard;
