import React, { useEffect, useState } from 'react';
import { supabase } from '@lib/supabase';
import ResponsivePageLayout from '@customer/components/shared/layouts/ResponsivePageLayout';
import HistoryItemCard from '@customer/components/shared/cards/HistoryItemCard';
import {
  Card,
  Button,
  Text,
  Search,
  Filter,
  Pagination,
} from '@shared/components';
import { ArrowLeft } from 'lucide-react';
import TrackTicketButton from '@customer/components/dashboard/recentTickets/TrackTicketButton';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import { FILTER_CONFIGS } from '@shared/types/filters';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';

interface Ticket {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  displayId: string;
  subject?: string;
  description?: string;
  resolvedAt?: number;
  assignedTo?: string;
}

const TicketHistory: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Responsive page size
  const pageSize = useResponsivePageSize({
    itemHeight: 140, // Approximate height of a ticket card
    itemSpacing: 24, // space-y-6 = 24px
    headerOffset: 200, // Navbar + header + search/filter
    footerOffset: 80, // Pagination height
    minItems: 2,
    maxItems: 20,
    useDynamicCalculation: true,
  });

  // Search + Filter logic using generic search filter
  const {
    search,
    setSearch,
    filter,
    setFilter,
    filteredItems: allFilteredTickets,
  } = useGenericSearchFilter({
    items: tickets,
    searchFields: [
      'id',
      'displayId',
      'title',
      'status',
      'subject',
      'createdAt',
      'updatedAt',
    ],
    dateField: 'createdAt',
    filterConfig: FILTER_CONFIGS.tickets,
    statusField: 'status',
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedTickets = allFilteredTickets.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Load tickets from database (inquiries_v2)
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('inquiries_v2')
          .select(
            `
            inquiry_id,
            display_id,
            inquiry_status,
            received_at,
            updated_at,
            inquiry_type,
            customer_id,
            order_id,
            session_id
          `
          )
          .eq('customer_id', user.id)
          .order('received_at', { ascending: false });

        if (error) {
          console.error('Error loading tickets:', error);
          return;
        }

        const ticketList: Ticket[] = (data || []).map(ticket => ({
          id: ticket.inquiry_id,
          title: ticket.inquiry_type || 'Support Ticket',
          createdAt: new Date(ticket.received_at).getTime(),
          updatedAt: ticket.updated_at
            ? new Date(ticket.updated_at).getTime()
            : new Date(ticket.received_at).getTime(),
          status: ticket.inquiry_status,
          displayId:
            ticket.display_id ||
            ticket.inquiry_id.substring(0, 8).toUpperCase(),
          subject: ticket.inquiry_type,
          description: undefined,
          resolvedAt: undefined,
          assignedTo: undefined,
        }));

        setTickets(ticketList);
      } catch (error) {
        console.error('Error loading tickets:', error);
      }
    };

    loadTickets();
  }, []);

  const handleItemClick = (ticket: Ticket) => {
    // TODO: Navigate to ticket details page or open chat
    console.log('Ticket clicked:', ticket.displayId);
  };

  // Build actions for each ticket
  const renderTicketActions = (ticket: Ticket) => {
    const statusLower = ticket.status.toLowerCase();

    // Only show track button for tickets that are not resolved or closed
    if (statusLower !== 'resolved' && statusLower !== 'closed') {
      return (
        <TrackTicketButton
          inquiryId={ticket.id}
          subject={ticket.subject || ticket.title}
          status={ticket.status}
        />
      );
    }

    return null;
  };

  // Build metadata for each ticket
  const buildTicketMetadata = (ticket: Ticket) => {
    const metadata: Record<string, string> = {};

    if (ticket.subject && ticket.subject !== ticket.title) {
      metadata.subject = ticket.subject;
    }

    if (ticket.description) {
      metadata.description = ticket.description;
    }

    if (ticket.assignedTo) {
      metadata.assigned = ticket.assignedTo;
    }

    if (ticket.resolvedAt) {
      metadata.resolved = new Date(ticket.resolvedAt).toLocaleDateString();
    }

    return metadata;
  };

  return (
    <ResponsivePageLayout>
      <div className="space-y-4">
        {/* Back to Dashboard */}
        <div className="flex justify-start">
          <Button
            threeD
            variant="ghost"
            size="sm"
            onClick={() => window.location.assign('/customer')}
            className="text-neutral-600 hover:text-neutral-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Page Title */}
        <div>
          <Text
            variant="h1"
            size="xl"
            weight="bold"
            className="device-text-heading text-neutral-900 mt-5 mb-5"
          >
            Ticket History
          </Text>
        </div>

        {/* Search and Filter Section */}
        <div className="relative mb-6 sm:mb-8">
          {/* Filter and Search Row - Always horizontal layout with responsive spacing */}
          <div className={`flex items-center ${spacingClasses.gap}`}>
            {/* Filter Component - Floating mode */}
            <div className={`${isMobile ? 'w-24' : 'w-auto'} shrink-0`}>
              <Filter
                value={filter}
                onChange={v => setFilter(v)}
                filterConfig={FILTER_CONFIGS.tickets}
                showResultCount={false}
                resultCount={allFilteredTickets.length}
                floating={true}
              />
            </div>

            {/* Search Bar - Takes remaining space */}
            <div className="flex-1 min-w-0">
              <Search
                value={search}
                onChange={v => setSearch(v)}
                placeholder="Search by ticket ID, subject, or status..."
                size="lg"
              />
            </div>
          </div>

          {/* Result Count */}
          {(filter.statuses?.length > 0 ||
            filter.dateFrom ||
            filter.dateTo ||
            search.trim()) && (
            <div className="text-sm text-neutral-600 mt-4">
              Found{' '}
              <span className="font-semibold text-neutral-900">
                {allFilteredTickets.length}
              </span>{' '}
              {allFilteredTickets.length === 1 ? 'ticket' : 'tickets'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {allFilteredTickets.length > pageSize && (
          <div className="mt-6">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={allFilteredTickets.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <div className="space-y-4">
          {paginatedTickets.map(ticket => (
            <HistoryItemCard
              key={ticket.id}
              type="ticket"
              displayId={ticket.displayId}
              title={ticket.subject || ticket.title}
              status={ticket.status}
              createdAt={ticket.createdAt}
              updatedAt={ticket.updatedAt}
              metadata={buildTicketMetadata(ticket)}
              actions={renderTicketActions(ticket)}
              onClick={() => handleItemClick(ticket)}
            />
          ))}
        </div>

        {allFilteredTickets.length === 0 && (
          <Card className="p-8 text-center">
            <Text variant="p" className="text-neutral-500">
              {tickets.length === 0
                ? 'No tickets found.'
                : 'No tickets match your filters.'}
            </Text>
          </Card>
        )}
      </div>
    </ResponsivePageLayout>
  );
};

export default TicketHistory;
