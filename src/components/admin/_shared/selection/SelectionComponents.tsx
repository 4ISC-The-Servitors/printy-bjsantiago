import React from 'react';
import { Button, Text, Badge } from '../../../shared';
import { X, Plus, MessageSquare } from 'lucide-react';
import type { SelectionItem, SelectionEntity } from '../../../../hooks/admin/useSelection';

interface SelectionChipProps {
  item: SelectionItem;
  onRemove: (id: string) => void;
}

export const SelectionChip: React.FC<SelectionChipProps> = ({
  item,
  onRemove,
}) => {
  const getTypeColor = (type: SelectionEntity) => {
    switch (type) {
      case 'order':
        return 'bg-blue-100 text-blue-800';
      case 'ticket':
        return 'bg-orange-100 text-orange-800';
      case 'service':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getTypeColor(item.type)}`}
    >
      <Text variant="span" size="sm" weight="medium">
        {item.label}
      </Text>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(item.id)}
        className="h-4 w-4 p-0 hover:bg-black/10"
        aria-label={`Remove ${item.label}`}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

interface SelectionBarProps {
  items: SelectionItem[];
  onRemove: (id: string) => void;
  onClear: () => void;
  onAddToChat: () => void;
  entityType: SelectionEntity;
  className?: string;
}

export const SelectionBar: React.FC<SelectionBarProps> = ({
  items,
  onRemove,
  onClear,
  onAddToChat,
  entityType,
  className = '',
}) => {
  if (items.length === 0) return null;

  const getEntityLabel = (type: SelectionEntity) => {
    switch (type) {
      case 'order':
        return 'orders';
      case 'ticket':
        return 'tickets';
      case 'service':
        return 'services';
      default:
        return 'items';
    }
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <Text variant="h4" size="sm" weight="semibold">
            Selected {getEntityLabel(entityType)}
          </Text>
          <Badge variant="secondary" size="sm" className="align-middle">
            {items.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {items.map(item => (
          <SelectionChip key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <Text variant="p" size="sm" color="muted">
          {items.length} {getEntityLabel(entityType)} selected
        </Text>
        <Button
          variant="primary"
          size="sm"
          onClick={onAddToChat}
          className="flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          Add to Chat
        </Button>
      </div>
    </div>
  );
};

interface FloatingSelectionButtonProps {
  count: number;
  entityType: SelectionEntity;
  onAddToChat: () => void;
  className?: string;
}

export const FloatingSelectionButton: React.FC<
  FloatingSelectionButtonProps
> = ({ count, entityType, onAddToChat, className = '' }) => {
  if (count === 0) return null;

  const getEntityLabel = (type: SelectionEntity) => {
    switch (type) {
      case 'order':
        return 'orders';
      case 'ticket':
        return 'tickets';
      case 'service':
        return 'services';
      default:
        return 'items';
    }
  };

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <Button
        variant="primary"
        size="lg"
        threeD
        onClick={onAddToChat}
        className="shadow-lg flex items-center gap-2 rounded-full px-6 py-3"
      >
        <Plus className="w-4 h-4" />
        Add {count} {getEntityLabel(entityType)} to Chat
      </Button>
    </div>
  );
};

interface SelectionSummaryProps {
  items: SelectionItem[];
  onClear: () => void;
  onAddToChat: (entityType: SelectionEntity) => void;
  className?: string;
}

export const SelectionSummary: React.FC<SelectionSummaryProps> = ({
  items,
  onClear,
  onAddToChat,
  className = '',
}) => {
  if (items.length === 0) return null;

  const grouped = items.reduce(
    (acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = [];
      }
      acc[item.type].push(item);
      return acc;
    },
    {} as Record<SelectionEntity, SelectionItem[]>
  );

  return (
    <div
      className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <Text
          variant="h4"
          size="sm"
          weight="semibold"
          className="text-blue-900"
        >
          Selection Summary
        </Text>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="text-blue-600 hover:text-blue-800"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        {Object.entries(grouped).map(([type, typeItems]) => (
          <div key={type} className="flex items-center justify-between">
            <Text variant="p" size="sm" className="text-blue-800">
              {typeItems.length} {type}
              {typeItems.length > 1 ? 's' : ''}
            </Text>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAddToChat(type as SelectionEntity)}
              className="text-blue-600 hover:text-blue-800"
            >
              Add to Chat
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
