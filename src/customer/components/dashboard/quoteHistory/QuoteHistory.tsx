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
import TrackQuoteButton from '@customer/components/dashboard/recentQuotes/TrackQuoteButton';
import { useGenericSearchFilter } from '@shared/hooks/ui/useGenericSearchFilter';
import { FILTER_CONFIGS } from '@shared/types/filters';
import {
  useResponsiveClasses,
  useDeviceUtils,
} from '@shared/hooks/ui/useResponsiveClasses';
import { useResponsivePageSize } from '@shared/hooks/ui/useResponsivePageSize';

interface Quote {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  displayId: string;
  subject?: string;
  description?: string;
  quoted_price?: number;
  endedAt?: number;
}

const QuoteHistory: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  // Responsive hooks
  const { spacingClasses } = useResponsiveClasses();
  const { isMobile } = useDeviceUtils();

  // Responsive page size
  const pageSize = useResponsivePageSize({
    itemHeight: 140, // Approximate height of a quote card
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
    filteredItems: allFilteredQuotes,
  } = useGenericSearchFilter({
    items: quotes,
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
    filterConfig: FILTER_CONFIGS.quotes,
    statusField: 'status',
  });

  // Pagination logic
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedQuotes = allFilteredQuotes.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filter]);

  // Load quotes from database
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('quotes')
          .select(
            `
            quote_id,
            session_id,
            display_id,
            status,
            created_at,
            updated_at,
            ended_at
          `
          )
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading quotes:', error);
          return;
        }

        // Get quoted prices and spec details from related tables
        const quoteList: Quote[] = await Promise.all(
          (data || []).map(async quote => {
            let quotedPrice: number | undefined;
            let subject = 'Quote Request';
            let description = undefined;

            // Get spec data for subject and description (using session_id)
            const { data: spec } = await supabase
              .from('quote_specs')
              .select('spec_data')
              .eq('session_id', quote.session_id)
              .single();

            if (spec?.spec_data) {
              subject = spec.spec_data.product_name || 'Quote Request';
              description = spec.spec_data.description;
            }

            // Get quoted price from accepted proposals
            if (quote.status === 'accepted') {
              const { data: proposal } = await supabase
                .from('quote_proposals')
                .select('quoted_price')
                .eq('session_id', quote.session_id)
                .eq('status', 'accepted')
                .single();

              quotedPrice = proposal?.quoted_price;
            }

            return {
              id: quote.quote_id,
              title: subject,
              createdAt: new Date(quote.created_at).getTime(),
              updatedAt: new Date(quote.updated_at).getTime(),
              status: quote.status,
              displayId: quote.display_id || quote.quote_id,
              subject: subject,
              description: description,
              quoted_price: quotedPrice,
              endedAt: quote.ended_at
                ? new Date(quote.ended_at).getTime()
                : undefined,
            };
          })
        );

        setQuotes(quoteList);
      } catch (error) {
        console.error('Error loading quotes:', error);
      }
    };

    loadQuotes();
  }, []);

  const handleItemClick = (quote: Quote) => {
    // TODO: Navigate to quote details or open chat
    console.log('Quote clicked:', quote.displayId);
  };

  // Build actions for each quote
  const renderQuoteActions = (quote: Quote) => {
    const statusLower = quote.status.toLowerCase();

    // Only show track button for quotes that are not accepted or rejected
    if (statusLower !== 'accepted' && statusLower !== 'rejected') {
      return (
        <TrackQuoteButton
          conversationId={quote.id}
          subject={quote.subject || quote.title}
          status={quote.status}
        />
      );
    }

    return null;
  };

  // Build metadata for each quote
  const buildQuoteMetadata = (quote: Quote) => {
    const metadata: Record<string, string> = {};

    if (quote.description) {
      metadata.description = quote.description;
    }

    if (quote.quoted_price) {
      metadata['quoted price'] =
        `₱${Number(quote.quoted_price).toLocaleString()}`;
    }

    if (quote.endedAt) {
      metadata.ended = new Date(quote.endedAt).toLocaleDateString();
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
            Quote History
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
                filterConfig={FILTER_CONFIGS.quotes}
                showResultCount={false}
                resultCount={allFilteredQuotes.length}
                floating={true}
              />
            </div>

            {/* Search Bar - Takes remaining space */}
            <div className="flex-1 min-w-0">
              <Search
                value={search}
                onChange={v => setSearch(v)}
                placeholder="Search by quote ID, subject, or status..."
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
                {allFilteredQuotes.length}
              </span>{' '}
              {allFilteredQuotes.length === 1 ? 'quote' : 'quotes'}
            </div>
          )}
        </div>

        {/* Pagination */}
        {allFilteredQuotes.length > pageSize && (
          <div className="mt-6">
            <Pagination
              page={currentPage}
              pageSize={pageSize}
              total={allFilteredQuotes.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}

        <div className="space-y-4">
          {paginatedQuotes.map(quote => (
            <HistoryItemCard
              key={quote.id}
              type="quote"
              displayId={quote.displayId}
              title={quote.subject || quote.title}
              status={quote.status}
              createdAt={quote.createdAt}
              updatedAt={quote.updatedAt}
              metadata={buildQuoteMetadata(quote)}
              actions={renderQuoteActions(quote)}
              onClick={() => handleItemClick(quote)}
            />
          ))}
        </div>

        {allFilteredQuotes.length === 0 && (
          <Card className="p-8 text-center">
            <Text variant="p" className="text-neutral-500">
              {quotes.length === 0
                ? 'No quotes found.'
                : 'No quotes match your filters.'}
            </Text>
          </Card>
        )}
      </div>
    </ResponsivePageLayout>
  );
};

export default QuoteHistory;
