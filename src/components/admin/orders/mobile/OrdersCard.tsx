import React, { useState } from 'react';
import { Card, Badge, Button, Text } from '../../../shared';
import { mockOrders } from '../../../../data/orders';
import { useAdmin } from '../../../../hooks/admin/AdminContext';
import { MessageSquare, Plus, MoreVertical } from 'lucide-react';

const OrdersCard: React.FC = () => {
  const { openChat } = useAdmin();
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // Limit to max 5 orders
  const displayOrders = mockOrders.slice(0, 5);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const addSelectedToChat = () => {
    // Add selected orders to chat context
    void selectedOrders; // Acknowledge the usage for now
    openChat();
    setSelectedOrders(new Set()); // Clear selections after adding to chat
  };

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <Text variant="h3" size="lg" weight="semibold">
            Recent Orders
          </Text>
        </div>

        <div className="divide-y divide-neutral-200">
          {displayOrders.map(o => (
            <div key={o.id} className="p-4 space-y-3">
              {/* Header row with ID, total, and action */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-brand-primary rounded"
                    checked={selectedOrders.has(o.id)}
                    onChange={() => toggleOrderSelection(o.id)}
                    title="Select order"
                  />
                  <div className="min-w-0 flex-1">
                    <Text
                      variant="p"
                      size="sm"
                      color="muted"
                      className="truncate"
                    >
                      {o.id}
                    </Text>
                    <Text variant="h4" size="lg" weight="semibold">
                      {o.total}
                    </Text>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Ask about ${o.id}`}
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

              {/* Customer name */}
              <div>
                <Text
                  variant="p"
                  size="base"
                  weight="medium"
                  className="truncate"
                >
                  {o.customer}
                </Text>
                <Text variant="p" size="sm" color="muted">
                  {o.date}
                </Text>
              </div>

              {/* Status badges */}
              <div className="flex items-center gap-2 flex-wrap">
                {o.priority && (
                  <Badge size="sm" variant="error">
                    {o.priority}
                  </Badge>
                )}
                <Badge
                  size="sm"
                  variant={o.status === 'Processing' ? 'info' : 'warning'}
                >
                  {o.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Add to Chat button (match Portfolio mobile style) */}
      {selectedOrders.size > 0 && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
          >
            <Plus className="w-5 h-5" />
            Add to Chat ({selectedOrders.size})
          </Button>
        </div>
      )}
    </div>
  );
};

export default OrdersCard;
