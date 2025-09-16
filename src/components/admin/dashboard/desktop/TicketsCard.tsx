import React, { useCallback, useEffect, useState } from 'react';
import { Card, Badge, Button } from '../../../shared';
import { useAdmin } from '../../../../pages/admin/AdminContext';
import { supabase } from '../../../../lib/supabase';
import { MessageSquare, Plus } from 'lucide-react';

const getBadgeVariantForStatus = (
  status: string
): 'info' | 'warning' | 'secondary' => {
  const s = (status || '').toLowerCase();
  if (s === 'open') return 'info';
  if (s === 'pending' || s === 'in progress' || s === 'awaiting')
    return 'warning';
  return 'secondary'; // closed/resolved/other
};

const TicketsCard: React.FC = () => {
  const { openChat } = useAdmin();
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(
    new Set()
  );

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

  const [inquiries, setInquiries] = useState<InquiryRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    const { data, error } = await supabase
      .from('inquiries')
      .select(`
        inquiry_id,
        inquiry_type,
        inquiry_status,
        inquiry_message,
        customer_id,
        customer:customer_id (
          first_name,
          last_name
        )
      `)
      .order('received_at', { ascending: false })
      .limit(5);

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
    }
    setLoading(false);
  }, []);

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

  // Display latest inquiries (already limited in query)
  const displayInquiries = inquiries;

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
        <div className="flex items-center justify-end px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2 text-neutral-500 text-xs">
            <Badge size="sm" variant="secondary">
              {displayInquiries.length}
            </Badge>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
          {loading && (
            <div className="p-4 text-sm text-neutral-500">Loading inquiries…</div>
          )}
          {!loading && errorMessage && (
            <div className="p-4 text-sm text-error-600">{errorMessage}</div>
          )}
          {!loading && !errorMessage && displayInquiries.length === 0 && (
            <div className="p-4 text-sm text-neutral-500">No inquiries found.</div>
          )}
          {!loading && !errorMessage && displayInquiries.map(t => (
            <div
              key={t.inquiry_id}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors relative"
            >
              {/* Hover checkbox on left */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand-primary"
                  checked={selectedTickets.has(t.inquiry_id)}
                  onChange={() => toggleTicketSelection(t.inquiry_id)}
                  title="Select ticket"
                />
              </div>

              <div className="flex w-full items-center justify-between gap-3 sm:gap-4">
                {/* Left section: identifiers + subject/status */}
                <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                      {t.inquiry_id}
                    </span>
                    <div className="text-sm sm:text-base lg:text-lg font-medium text-neutral-900 text-pretty sm:hidden truncate">
                      {t.inquiry_type || '—'}
                    </div>
                  </div>
                  <div className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-neutral-900 text-pretty truncate">
                    {t.inquiry_type || '—'}
                  </div>

                  <div className="flex justify-start sm:hidden">
                    <Badge
                      size="sm"
                      variant={getBadgeVariantForStatus(t.inquiry_status || '')}
                      className="text-xs"
                    >
                      {t.inquiry_status}
                    </Badge>
                  </div>
                  <div className="hidden sm:flex sm:items-center sm:gap-3">
                    <Badge
                      size="sm"
                      variant={getBadgeVariantForStatus(t.inquiry_status || '')}
                      className="text-xs sm:text-sm"
                    >
                      {t.inquiry_status}
                    </Badge>
                  </div>
                </div>

                {/* Right section: action aligned right */}
                <div className="flex items-center gap-3 sm:gap-4">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Ask about ${t.inquiry_id}`}
                    onClick={() => {
                      const parts = [
                        t.customer_full_name ? `Customer: ${t.customer_full_name}` : null,
                        t.inquiry_type ? `Type: ${t.inquiry_type}` : null,
                        t.inquiry_message ? `Message: ${t.inquiry_message}` : null,
                      ].filter(Boolean);
                      const prefill = parts.join('\n');
                      openChat(
                        prefill
                          ? {
                              text: prefill,
                              role: 'printy',
                              skipIntro: true,
                              followupBotText: 'What would you like to do about this ticket?',
                              context: { inquiryId: t.inquiry_id, customerId: t.customer_id || undefined },
                            }
                          : undefined
                      );
                    }}
                    className="shrink-0"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Add to Chat button */}
      {selectedTickets.size > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            variant="primary"
            size="lg"
            threeD
            onClick={addSelectedToChat}
            className="shadow-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add to Chat ({selectedTickets.size})
          </Button>
        </div>
      )}
    </div>
  );
};

export default TicketsCard;

