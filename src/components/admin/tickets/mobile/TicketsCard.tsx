import React, { useState } from 'react';
import { Card, Badge, Button, Text } from '../../../shared';
import { mockTickets } from '../../../../data/tickets';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { MessageSquare, Plus, MoreVertical } from 'lucide-react';

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

  // Limit to max 5 tickets
  const displayTickets = mockTickets.slice(0, 5);

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
          {displayTickets.map(t => (
            <div key={t.id} className="p-4 space-y-3">
              {/* Header row with ID and actions */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-brand-primary rounded"
                    checked={selectedTickets.has(t.id)}
                    onChange={() => toggleTicketSelection(t.id)}
                    title="Select ticket"
                  />
                  <div className="min-w-0 flex-1">
                    <Text
                      variant="p"
                      size="sm"
                      color="muted"
                      className="truncate"
                    >
                      {t.id}
                    </Text>
                    <Text variant="p" size="xs" color="muted">
                      {t.date}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Ask about ${t.id}`}
                    onClick={() => openChat()}
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
                  {t.subject}
                </Text>
              </div>

              {/* Status badge */}
              <div className="flex items-center justify-start">
                <Badge size="sm" variant={getBadgeVariantForStatus(t.status)}>
                  {t.status}
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
    </div>
  );
};

export default TicketsCard;
