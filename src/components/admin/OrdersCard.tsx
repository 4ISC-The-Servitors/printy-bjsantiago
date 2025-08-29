import React, { useRef, useState } from 'react';
import { Card, Badge, Button } from '../shared';
import { mockOrders } from '../../data/orders';
import { useAdmin } from '../../pages/admin/AdminContext';
import { MessageSquare } from 'lucide-react';

export type TogglePending = (item: { id: string; label: string; type: 'order' }, checked: boolean) => void;
export type IsPending = (id: string) => boolean;

interface Props {
  isPending: IsPending;
  togglePending: TogglePending;
}

const OrdersCard: React.FC<Props> = ({ isPending, togglePending }) => {
  const { addSelected, openChat } = useAdmin();
  const [bulk, setBulk] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const askAboutOrder = (id: string) => {
    addSelected({ id, label: id, type: 'order' });
    openChat();
  };

  return (
    <Card className="p-0" ref={containerRef as unknown as React.Ref<HTMLDivElement>}>
      {/* Keep a slim control row for Bulk Select without a section title */}
      <div className="flex items-center justify-end px-3 py-2 sm:px-4">
        <div className="flex items-center gap-2 text-neutral-500 text-xs">
          <Badge size="sm" variant="secondary">{mockOrders.length}</Badge>
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
        {mockOrders.map(o => (
          <div key={o.id} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 lg:p-5 rounded-lg border bg-white/60 hover:bg-white transition-colors">
            {bulk && (
              <input
                type="checkbox"
                className="w-4 h-4 accent-brand-primary shrink-0"
                checked={isPending(o.id)}
                onChange={e => togglePending({ id: o.id, label: o.id, type: 'order' }, e.target.checked)}
                title="Select order"
              />
            )}

            <div className="flex-1 min-w-0 space-y-1 sm:space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                {/* ID + (mobile customer) */}
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 min-w-0">
                  <span className="text-xs sm:text-sm lg:text-base font-medium text-neutral-500 truncate">
                    {o.id}
                  </span>
                  <div className="text-sm sm:text-base lg:text-lg font-medium text-neutral-900 sm:hidden truncate">
                    {o.customer}
                  </div>
                </div>

                {/* Amount + Date */}
                <div className="flex items-center justify-between sm:flex-col sm:text-right">
                  <div className="text-sm sm:text-base lg:text-lg xl:text-xl font-semibold">{o.total}</div>
                  <div className="text-xs sm:text-sm text-neutral-500">{o.date}</div>
                </div>
              </div>

              {/* Mobile: badge row */}
              <div className="flex items-center justify-between sm:hidden">
                <div className="flex items-center gap-2">
                  {o.priority && (
                    <Badge size="sm" variant="error" className="text-xs">{o.priority}</Badge>
                  )}
                  <Badge size="sm" variant={o.status === 'Processing' ? 'info' : 'warning'} className="text-xs">{o.status}</Badge>
                </div>
              </div>

              {/* Desktop: customer and badges */}
              <div className="hidden sm:block text-sm sm:text-base lg:text-lg font-medium text-neutral-900 truncate">
                {o.customer}
              </div>
              <div className="hidden sm:flex sm:items-center sm:gap-3">
                {o.priority && (
                  <Badge size="sm" variant="error" className="text-xs sm:text-sm">{o.priority}</Badge>
                )}
                <Badge size="sm" variant={o.status === 'Processing' ? 'info' : 'warning'} className="text-xs sm:text-sm">{o.status}</Badge>
              </div>
            </div>

            {/* Ask/Chat action */}
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Ask about ${o.id}`}
              onClick={() => askAboutOrder(o.id)}
              className="shrink-0"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default OrdersCard;


