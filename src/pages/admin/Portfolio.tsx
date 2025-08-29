import React, { useMemo, useState } from 'react';
import { Text, Badge, Button } from '../../components/shared';
import ServicePortfolioCard from '../../components/admin/ServicePortfolioCard';
import ServicesOfferedCard from '../../components/admin/ServicesOfferedCard';
import { useAdmin } from './AdminContext';
import { mockServices } from '../../data/services';

const AdminPortfolio: React.FC = () => {
  const { addSelected, selected } = useAdmin();

  type PendingItem = { id: string; label: string; type: 'service' };
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
        addSelected({
          id: p.id,
          label: p.label,
          type: p.type
        });
      }
    });
    setPending([]);
  };
  const clearPending = () => setPending([]);

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof mockServices>();
    mockServices.forEach(s => {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return Array.from(map.entries());
  }, []);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    servicesByCategory.forEach(([cat]) => (obj[cat] = true));
    return obj;
  });
  
  return (
    <div className="p-3 sm:p-4 lg:p-8 space-y-6">
      <div className="mb-6">
        <Text variant="h1" size="2xl" weight="bold" className="mb-2">
          Service Portfolio
        </Text>
        <Text variant="p" className="text-neutral-600">
          Manage your service offerings and portfolio
        </Text>
      </div>

      {/* Service Portfolio and Services Offered */}
      <div className="space-y-6">
        <ServicePortfolioCard 
          isPending={isPending} 
          togglePending={(i, c) => togglePending({ id: i.id, label: i.label, type: 'service' }, c)} 
          expanded={expanded} 
          setExpanded={setExpanded} 
        />

        <ServicesOfferedCard 
          isPending={isPending} 
          togglePending={(i, c) => togglePending({ id: i.id, label: i.label, type: 'service' }, c)} 
        />
      </div>

      {/* Selection Preview Panel */}
      {pending.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-4">
          <div className="w-full max-w-3xl bg-white border border-neutral-200 shadow-xl rounded-xl p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="primary" size="sm">{pending.length} selected</Badge>
                <Text variant="p" size="sm" color="muted">
                  {pending.length} services
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" threeD onClick={clearPending}>Clear</Button>
                <Button variant="primary" size="sm" threeD onClick={addPendingToChat}>Add to Chat</Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm">Suggest: Toggle Availability</Button>
              <Button variant="secondary" size="sm">Suggest: Update Pricing</Button>
              <Button variant="secondary" size="sm">Suggest: Edit Descriptions</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPortfolio;
