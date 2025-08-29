import React, { useMemo, useState } from 'react';
import { Text, Badge, Button } from '../../components/shared';
import OrdersCard from '../../components/admin/OrdersCard';
import TicketsCard from '../../components/admin/TicketsCard';
import { useAdmin } from './AdminContext';
import { getTelemetry } from '../../lib/telemetry';

// Data now imported from src/data

const AdminDashboard: React.FC = () => {
  const { addSelected, selected } = useAdmin();

  type PendingItem = { id: string; label: string; type: 'order' | 'ticket' };
  const [pending, setPending] = useState<PendingItem[]>([]);

  const isPending = (id: string) => pending.some(p => p.id === id);
  const togglePending = (item: PendingItem, checked: boolean) => {
    setPending(prev => {
      if (checked) {
        if (prev.some(p => p.id === item.id)) return prev;
        return [...prev, item];
      } else {
        return prev.filter(p => p.id !== item.id);
      }
    });
  };

  const addPendingToChat = () => {
    pending.forEach(p => {
      if (!selected.some(s => s.id === p.id)) {
        addSelected({ id: p.id, label: p.label, type: p.type });
      }
    });
    // Auto-hide by clearing selection after sending to chat
    setPending([]);
  };
  const clearPending = () => setPending([]);

  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-6">
      {/* Orders and Tickets */}
      <div className="flex flex-wrap gap-6">
        <div className="flex-1 min-w-[320px] space-y-3" style={{ order: (getTelemetry().widgets['orders'] || 0) * -1 }}>
          <Text variant="h2" size="xl" weight="semibold" className="px-1">Recent Orders</Text>
          <OrdersCard isPending={isPending} togglePending={(i, c) => togglePending({ id: i.id, label: i.label, type: 'order' }, c)} />
        </div>

        <div className="flex-1 min-w-[320px] space-y-3" style={{ order: (getTelemetry().widgets['tickets'] || 0) * -1 }}>
          <Text variant="h2" size="xl" weight="semibold" className="px-1">Recent Tickets</Text>
          <TicketsCard isPending={isPending} togglePending={(i, c) => togglePending({ id: i.id, label: i.label, type: 'ticket' }, c)} />
        </div>
      </div>

      {/* Selection Preview Bar (compact centered) */}
      {pending.length > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
          <div className="inline-flex items-center gap-4 bg-white border border-neutral-200 shadow-xl rounded-full px-5 py-3">
            <Badge variant="primary" size="sm">{pending.length} selected</Badge>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" threeD onClick={clearPending}>Clear</Button>
              <Button variant="primary" size="sm" threeD onClick={addPendingToChat}>Add to Chat</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
