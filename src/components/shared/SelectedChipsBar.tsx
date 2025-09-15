import React from 'react';
import { X } from 'lucide-react';
import { Badge, Text, Button } from './index';

export interface ChipItem {
  id: string;
  label: string;
  type?: 'order' | 'ticket' | 'service' | 'other';
}

interface SelectedChipsBarProps {
  title?: string;
  items: ChipItem[];
  onRemove: (id: string) => void;
  onClear?: () => void;
}

const SelectedChipsBar: React.FC<SelectedChipsBarProps> = ({
  title = 'Selected Components',
  items,
  onRemove,
  onClear,
}) => {
  return (
    <div className="border-b bg-white px-3 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Text variant="p" size="sm" weight="medium">
            {title}
          </Text>
          <Badge size="sm" variant="secondary">
            {items.length}
          </Badge>
        </div>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>
      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        {items.map(it => (
          <span
            key={it.id}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-300 bg-neutral-50 px-2 py-1 text-xs text-neutral-700 whitespace-nowrap"
          >
            {it.label}
            <button
              aria-label={`Remove ${it.label}`}
              onClick={() => onRemove(it.id)}
              className="text-neutral-400 hover:text-neutral-700"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
};

export default SelectedChipsBar;
