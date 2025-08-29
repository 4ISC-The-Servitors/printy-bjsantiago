import React from 'react';
import { Card, Text, Badge, Button } from '../shared';
import { mockServices } from '../../data/services';
import { bumpWidget } from '../../lib/telemetry';

type TogglePending = (item: { id: string; label: string; type: 'service' }, checked: boolean) => void;
type IsPending = (id: string) => boolean;

interface Props {
  isPending: IsPending;
  togglePending: TogglePending;
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

const ServicePortfolioCard: React.FC<Props> = ({ isPending, togglePending, expanded, setExpanded }) => {
  const map = new Map<string, typeof mockServices>();
  mockServices.forEach(s => {
    const arr = map.get(s.category) || [];
    arr.push(s);
    map.set(s.category, arr);
  });
  const servicesByCategory = Array.from(map.entries());

  return (
    <Card title="Service Portfolio">
      <div className="space-y-4">
        {servicesByCategory.map(([category, items]) => (
          <div key={category} className="border border-neutral-200 rounded-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <Text variant="h4" size="sm" weight="semibold">{category}</Text>
              <Button variant="ghost" size="sm" onClick={() => setExpanded(prev => ({ ...prev, [category]: !prev[category] }))}>{expanded[category] ? '▾' : '▸'}</Button>
            </div>
            {expanded[category] && (
              <div className="px-4 pb-3 space-y-2">
                {items.map(s => (
                  <label key={s.id} className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 cursor-pointer">
                    <div className="flex items-center gap-3 min-w-0">
                      <input type="checkbox" className="w-4 h-4 accent-brand-primary" title="Select service"
                        checked={isPending(s.id)} onChange={e => togglePending({ id: s.id, label: s.name, type: 'service' }, e.target.checked)} />
                      <Text variant="p" size="sm" weight="medium" className="truncate">{s.name}</Text>
                      <Badge variant={s.status === 'Active' ? 'success' : 'warning'} size="sm">{s.status}</Badge>
                    </div>
                    <Text variant="p" size="xs" color="muted" className="truncate">{s.code}</Text>
                    <Button variant="ghost" size="sm" onClick={() => togglePending({ id: s.id, label: s.name, type: 'service' }, !isPending(s.id))}>Ask Printy</Button>
                    <Button variant="ghost" size="sm" onClick={() => { bumpWidget('portfolio'); }}>Quick Access</Button>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ServicePortfolioCard;


