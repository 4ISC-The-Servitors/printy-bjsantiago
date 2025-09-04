import React, { useRef, useState } from 'react';
import { Card, Badge, Button } from '../shared';
import { mockTickets } from '../../data/tickets';
import { useAdmin } from '../../pages/admin/AdminContext';
import { MessageSquare } from 'lucide-react';

export type TogglePending = (
  item: { id: string; label: string; type: 'ticket' },
  checked: boolean
) => void;
export type IsPending = (id: string) => boolean;

interface Props {
  isPending: IsPending;
  togglePending: TogglePending;
}

const getBadgeVariantForStatus = (
  status: string
): 'info' | 'warning' | 'secondary' => {
  const s = (status || '').toLowerCase();
  if (s === 'open') return 'info';
  if (s === 'pending' || s === 'in progress' || s === 'awaiting')
    return 'warning';
  return 'secondary'; // closed/resolved/other
};

const TicketsCard: React.FC<Props> = ({ isPending, togglePending }) => {
  const { addSelected, openChat } = useAdmin();
  const [bulk, setBulk] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const askAboutTicket = (id: string) => {
    addSelected({ id, label: id, type: 'ticket' });
    openChat();
  };

  return (
    <Card
      className="p-0"
      ref={containerRef as unknown as React.Ref<HTMLDivElement>}
    >
      {/* Slim control row for Bulk Select */}
      <div className="flex items-center justify-end px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 text-neutral-500 text-xs">
          <Badge size="sm" variant="secondary">
            {mockTickets.length}
          </Badge>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setBulk(b => !b)}
            aria-pressed={bulk}
          >
            {bulk ? 'Hide Selection' : 'Bulk Select'}
          </Button>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
        {mockTickets.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors"
          >
            {bulk && (
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-primary shrink-0"
                checked={isPending(t.id)}
                onChange={e =>
                  togglePending(
                    { id: t.id, label: t.id, type: 'ticket' },
                    e.target.checked
                  )
                }
                title="Select ticket"
              />
            )}

            <div className="flex w-full items-center justify-between gap-3 sm:gap-4">
              {/* Left section: identifiers + subject/status */}
              <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                    {t.id}
                  </span>
                  <div className="text-sm sm:text-base lg:text-lg font-medium text-neutral-900 text-pretty sm:hidden truncate">
                    {t.subject}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-neutral-500 sm:self-start">{t.time}</div>

                <div className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-neutral-900 text-pretty truncate">{t.subject}</div>

                <div className="flex justify-start sm:hidden">
                  <Badge size="sm" variant={getBadgeVariantForStatus(t.status)} className="text-xs">{t.status}</Badge>
                </div>
                <div className="hidden sm:flex sm:items-center sm:gap-3">
                  <Badge size="sm" variant={getBadgeVariantForStatus(t.status)} className="text-xs sm:text-sm">{t.status}</Badge>
                </div>
              </div>

              {/* Right section: action aligned right */}
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Ask about ${t.id}`}
                  onClick={() => askAboutTicket(t.id)}
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
  );
};

export default TicketsCard;
