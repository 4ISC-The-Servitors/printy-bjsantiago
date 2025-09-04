import React from 'react';
import { Card, Text, Button } from '../shared';
import { mockServices } from '../../data/services';
import { bumpWidget } from '../../lib/telemetry';

type TogglePending = (
  item: { id: string; label: string; type: 'service' },
  checked: boolean
) => void;
type IsPending = (id: string) => boolean;

interface Props {
  isPending: IsPending;
  togglePending: TogglePending;
}

const ServicesOfferedCard: React.FC<Props> = ({ isPending, togglePending }) => {
  return (
    <Card title="Services Offered">
      <div className="space-y-2">
        {mockServices
          .filter(s => s.status === 'Active')
          .map(s => (
            <label
              key={s.id}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-brand-primary"
                  title="Select service"
                  checked={isPending(s.id)}
                  onChange={e =>
                    togglePending(
                      { id: s.id, label: s.name, type: 'service' },
                      e.target.checked
                    )
                  }
                />
                <Text
                  variant="p"
                  size="sm"
                  weight="medium"
                  className="truncate"
                >
                  {s.name}
                </Text>
              </div>
              <Text variant="p" size="xs" color="muted" className="truncate">
                {s.code}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  bumpWidget('offered');
                }}
              >
                Quick Access
              </Button>
            </label>
          ))}
      </div>
    </Card>
  );
};

export default ServicesOfferedCard;
