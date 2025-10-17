import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabase';
import DesktopLayout from '@customer/components/shared/layouts/DesktopLayout';
import MobileLayout from '@customer/components/shared/layouts/MobileLayout';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import { Text, Badge, Button } from '@shared/components';
import { formatQuoteStatus } from '@shared/utils/statusFormatter';
import { getQuoteStatusBadgeVariant } from '@utils/admin/statusColors';
import { formatLongDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { useRecentChatSessions, type ConversationLike } from '@customer/hooks/useRecentChatSessions';

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
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [conversations, setConversations] = useState<ConversationLike[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load conversations for sidebar
  useRecentChatSessions(setConversations);

  // Load quotes from database
  useEffect(() => {
    const loadQuotes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('quotes')
          .select(`
            quote_id,
            session_id,
            display_id,
            status,
            created_at,
            updated_at,
            ended_at
          `)
          .eq('customer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading quotes:', error);
          return;
        }

        // Get quoted prices and spec details from related tables
        const quoteList: Quote[] = await Promise.all(
          (data || []).map(async (quote) => {
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
              endedAt: quote.ended_at ? new Date(quote.ended_at).getTime() : undefined,
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return quotes.filter(quote => {
      const matchesQuery = q
        ? quote.title.toLowerCase().includes(q) ||
          quote.displayId.toLowerCase().includes(q) ||
          quote.status.toLowerCase().includes(q) ||
          (quote.subject && quote.subject.toLowerCase().includes(q))
        : true;
      const matchesStatus = status
        ? quote.status === status
        : true;
      return matchesQuery && matchesStatus;
    });
  }, [quotes, query, status]);

  const handleItemClick = (quote: Quote) => {
    // Navigate to quote details or open chat for this quote
    alert(`Quote ${quote.displayId} clicked`);
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    navigate('/auth/signin');
  };

  const sidebar = (
    <SidebarPanel
      conversations={conversations}
      activeId={null}
      onSwitchConversation={(id: string) => {
        window.dispatchEvent(
          new CustomEvent('customer-open-session', { detail: { sessionId: id } })
        );
        navigate('/customer');
      }}
      onNavigateToAccount={() => navigate('/customer/account')}
      bottomActions={
        <LogoutButton onClick={() => setShowLogoutModal(true)} />
      }
    />
  );

  const renderQuoteItem = (quote: Quote) => {
    const displayId = quote.displayId || quote.id.substring(0, 8).toUpperCase();
    
    return (
      <div 
        key={quote.id}
        className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-brand-primary-300 transition-colors cursor-pointer"
        onClick={() => handleItemClick(quote)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Text variant="h3" size="base" weight="semibold" className="font-mono">
                {displayId}
              </Text>
              <Badge variant={getQuoteStatusBadgeVariant(quote.status)} size="sm">
                {formatQuoteStatus(quote.status)}
              </Badge>
            </div>
            
            <Text variant="p" size="sm" color="muted" className="mb-3">
              {quote.subject || quote.title}
            </Text>

            {quote.description && (
              <Text variant="p" size="xs" color="muted" className="line-clamp-2 mb-3">
                {quote.description}
              </Text>
            )}

            {/* Important dates */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex justify-between">
                <Text variant="p" size="xs" color="muted">Created:</Text>
                <Text variant="p" size="xs" color="muted">{formatLongDate(quote.createdAt)}</Text>
              </div>
              <div className="flex justify-between">
                <Text variant="p" size="xs" color="muted">Updated:</Text>
                <Text variant="p" size="xs" color="muted">{formatRelativeTimeLabel(quote.updatedAt)}</Text>
              </div>
              {quote.endedAt && (
                <div className="flex justify-between">
                  <Text variant="p" size="xs" color="muted">Ended:</Text>
                  <Text variant="p" size="xs" color="muted">{formatLongDate(quote.endedAt)}</Text>
                </div>
              )}
            </div>

            {quote.quoted_price && (
              <Text variant="p" size="sm" weight="medium" className="text-brand-primary">
                Quoted: ₱{Number(quote.quoted_price).toLocaleString()}
              </Text>
            )}
          </div>
        </div>
      </div>
    );
  };

  const content = (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/customer')}
            className="text-neutral-600 hover:text-neutral-900"
          >
            ← Back to Dashboard
          </Button>
        </div>
        <Text variant="h1" size="2xl" weight="bold" className="text-neutral-900">
          Quote History
        </Text>
        <Text variant="p" size="base" color="muted">
          View all your quote requests and their current status
        </Text>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search quotes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="spec_proposed">Spec Proposed</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="ended">Ended</option>
          </select>
        </div>
        {(query || status) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setStatus('');
            }}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Quotes List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Text variant="p" size="base" color="muted">
            {quotes.length === 0 ? 'No quotes found.' : 'No quotes match your filters.'}
          </Text>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(renderQuoteItem)}
        </div>
      )}

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />
    </>
  );

  return (
    <>
      {/* Desktop Layout */}
      <div className="hidden lg:block">
        <DesktopLayout sidebar={sidebar}>
          {content}
        </DesktopLayout>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden">
        <MobileLayout sidebar={sidebar}>
          {content}
        </MobileLayout>
      </div>
    </>
  );
};

export default QuoteHistory;
