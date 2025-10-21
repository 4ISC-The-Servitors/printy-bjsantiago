import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@lib/supabase';
import DesktopLayout from '@customer/components/shared/layouts/DesktopLayout';
import MobileLayout from '@customer/components/shared/layouts/MobileLayout';
import SidebarPanel from '@customer/components/shared/sidebar/SidebarPanel';
import LogoutButton from '@customer/components/shared/sidebar/LogoutButton';
import LogoutModal from '@customer/components/shared/sidebar/LogoutModal';
import { Text, Badge, Button } from '@shared/components';
import { formatTicketStatus } from '@shared/utils/statusFormatter';
import { getTicketStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatLongDate } from '@shared/utils/dateFormatter';
import { formatRelativeTimeLabel } from '@shared/utils/timeFormatter';
import { useRecentChatSessions, type ConversationLike } from '@customer/hooks/useRecentChatSessions';

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
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [conversations, setConversations] = useState<ConversationLike[]>([]);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load conversations for sidebar
  useRecentChatSessions(setConversations);

  // Load tickets from database
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('inquiries_v2')
          .select(`
            inquiry_id,
            display_id,
            inquiry_status,
            received_at,
            updated_at,
            inquiry_type,
            customer_id,
            order_id,
            session_id
          `)
          .eq('customer_id', user.id)
          .order('received_at', { ascending: false });

        if (error) {
          console.error('Error loading tickets:', error);
          return;
        }

        console.log('Loaded tickets data:', data);
        console.log('Current user ID:', user.id);

        // If no tickets found for this user, let's try a broader query to debug
        if (!data || data.length === 0) {
          console.log('No tickets found for user, checking all inquiries...');
          const { data: allData, error: allError } = await supabase
            .from('inquiries_v2')
            .select('inquiry_id, display_id, inquiry_status, received_at, updated_at, inquiry_type, customer_id, order_id, session_id')
            .order('received_at', { ascending: false })
            .limit(5);
          
          if (!allError) {
            console.log('Sample of all inquiries:', allData);
          }
        }

        const ticketList: Ticket[] = (data || []).map(ticket => ({
          id: ticket.inquiry_id,
          title: ticket.inquiry_type || 'Support Ticket',
          createdAt: new Date(ticket.received_at).getTime(),
          updatedAt: new Date(ticket.received_at).getTime(), // Using received_at as updated_at since it's not available
          status: ticket.inquiry_status,
          displayId: ticket.display_id || ticket.inquiry_id.substring(0, 8).toUpperCase(),
          subject: ticket.inquiry_type,
          description: undefined, // No description field available in inquiries table
          resolvedAt: undefined, // Resolved_at column doesn't exist in inquiries table
          assignedTo: ticket.assigned_to,
        }));

        setTickets(ticketList);
      } catch (error) {
        console.error('Error loading tickets:', error);
      }
    };

    loadTickets();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter(ticket => {
      const matchesQuery = q
        ? ticket.title.toLowerCase().includes(q) ||
          ticket.displayId.toLowerCase().includes(q) ||
          ticket.status.toLowerCase().includes(q) ||
          (ticket.subject && ticket.subject.toLowerCase().includes(q))
        : true;
      const matchesStatus = status
        ? ticket.status === status
        : true;
      return matchesQuery && matchesStatus;
    });
  }, [tickets, query, status]);

  const handleItemClick = (ticket: Ticket) => {
    // Navigate to ticket details or open chat for this ticket
    alert(`Ticket ${ticket.displayId} clicked`);
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

  const renderTicketItem = (ticket: Ticket) => {
    const displayId = ticket.displayId || ticket.id.substring(0, 8).toUpperCase();
    
    return (
      <div 
        key={ticket.id}
        className="bg-white rounded-lg border border-neutral-200 p-4 hover:border-brand-primary-300 transition-colors cursor-pointer"
        onClick={() => handleItemClick(ticket)}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Text variant="h3" size="base" weight="semibold" className="font-mono">
                {displayId}
              </Text>
              <Badge variant={getTicketStatusBadgeVariant(ticket.status)} size="sm">
                {formatTicketStatus(ticket.status)}
              </Badge>
            </div>
            
            <Text variant="p" size="sm" color="muted" className="mb-3">
              {ticket.subject || ticket.title}
            </Text>

            {ticket.description && (
              <Text variant="p" size="xs" color="muted" className="line-clamp-2 mb-3">
                {ticket.description}
              </Text>
            )}

            {/* Important dates */}
            <div className="flex flex-col gap-1 mb-3">
              <div className="flex justify-between">
                <Text variant="p" size="xs" color="muted">Created:</Text>
                <Text variant="p" size="xs" color="muted">{formatLongDate(ticket.createdAt)}</Text>
              </div>
              <div className="flex justify-between">
                <Text variant="p" size="xs" color="muted">Updated:</Text>
                <Text variant="p" size="xs" color="muted">{formatRelativeTimeLabel(ticket.updatedAt)}</Text>
              </div>
            </div>

            {/* Show assigned_to if available */}
            {ticket.assignedTo && (
              <div className="mt-2">
                <Badge variant="secondary" size="sm">
                  Assigned: {ticket.assignedTo}
                </Badge>
              </div>
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
          Ticket History
        </Text>
        <Text variant="p" size="base" color="muted">
          View all your support tickets and their current status
        </Text>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tickets..."
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
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
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

      {/* Tickets List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <Text variant="p" size="base" color="muted">
            {tickets.length === 0 
              ? 'No tickets found. If you just created an inquiry, it may take a moment to appear.' 
              : 'No tickets match your filters.'}
          </Text>
          {tickets.length === 0 && (
            <div className="mt-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate('/customer')}
              >
                Start New Chat
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(renderTicketItem)}
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

export default TicketHistory;
