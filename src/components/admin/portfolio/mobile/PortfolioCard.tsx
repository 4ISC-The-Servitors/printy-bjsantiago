import React, { useState } from 'react';
import { Card, Badge, Button, Text, Checkbox } from '../../../shared';
import {
  getPortfolioServices,
  getServicesOffered,
  getServicesByCategory,
} from '@data/services';
import { useAdmin } from '@hooks/admin/AdminContext';
import { MessageSquare, Plus, MoreVertical, ChevronDown } from 'lucide-react';
import { cn } from '../../../../lib/utils';

const PortfolioCard: React.FC = () => {
  const { openChat } = useAdmin();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const services = getPortfolioServices();
  const offered = getServicesOffered();
  const categoriesAll = getServicesByCategory(services);
  const categoriesOffered = getServicesByCategory(offered);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openOfferedCat, setOpenOfferedCat] = useState<string | null>(null);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelectedToChat = () => {
    // Could map to AdminContext selected items if needed later
    openChat();
    setSelected(new Set());
    setIsSelectionMode(false);
  };

  return (
    <div className="relative">
      <Card className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <Text variant="h3" size="lg" weight="semibold">
            Service Portfolio
          </Text>
          <div className="flex items-center gap-2">
            <Badge size="sm" variant="secondary">
              {services.length}
            </Badge>
            {isSelectionMode && (
              <Button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelected(new Set());
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                {/* simple X replacement with text for clarity */}
                <span className="text-sm text-gray-600">Clear</span>
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              threeD
              onClick={() => openChat()}
              aria-label="Add Service"
              className="min-h-[36px]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden xs:inline">Add Service</span>
            </Button>
          </div>
        </div>
        <div className="divide-y divide-neutral-200">
          {categoriesAll.map(cat => (
            <div key={cat.id}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() =>
                  setOpenCat(prev => (prev === cat.id ? null : cat.id))
                }
                aria-expanded={openCat === cat.id}
              >
                <Text
                  variant="h4"
                  size="base"
                  weight="medium"
                  className="truncate"
                >
                  {cat.name}
                </Text>
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="secondary">
                    {cat.count}
                  </Badge>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform ${openCat === cat.id ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </button>
              {openCat === cat.id && (
                <div className="divide-y divide-neutral-200">
                  {cat.services.map(s => (
                    <div key={s.id} className="p-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {(isSelectionMode || selected.has(s.id)) && (
                            <Checkbox
                              checked={selected.has(s.id)}
                              onCheckedChange={() => toggle(s.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <Text
                              variant="p"
                              size="sm"
                              color="muted"
                              className="truncate"
                            >
                              {s.code}
                            </Text>
                            <Text
                              variant="h4"
                              size="lg"
                              weight="semibold"
                              className="truncate"
                            >
                              {s.name}
                            </Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              s.status === 'Active'
                                ? 'bg-green-100 text-green-800'
                                : s.status === 'Inactive'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-gray-100 text-gray-700',
                              'rounded-full text-xs font-medium'
                            )}
                          >
                            {s.status}
                          </Badge>
                          <div className="relative">
                            <Button
                              onClick={() =>
                                setOpenMenuId(openMenuId === s.id ? null : s.id)
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                            {openMenuId === s.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                                <Button
                                  onClick={() => {
                                    openChat();
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                  <Text variant="p" size="sm">
                                    Chat about this service
                                  </Text>
                                </Button>
                                <Button
                                  onClick={() => {
                                    setIsSelectionMode(true);
                                    setSelected(new Set([s.id]));
                                    setOpenMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  <Text variant="p" size="sm">
                                    Select
                                  </Text>
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
          <Text variant="h3" size="lg" weight="semibold">
            Services Offered
          </Text>
          <Badge size="sm" variant="secondary">
            {offered.length}
          </Badge>
        </div>
        <div className="divide-y divide-neutral-200">
          {categoriesOffered.map(cat => (
            <div key={cat.id}>
              <button
                type="button"
                className="w-full flex items-center justify-between px-4 py-3"
                onClick={() =>
                  setOpenOfferedCat(prev => (prev === cat.id ? null : cat.id))
                }
                aria-expanded={openOfferedCat === cat.id}
              >
                <Text
                  variant="h4"
                  size="base"
                  weight="medium"
                  className="truncate"
                >
                  {cat.name}
                </Text>
                <div className="flex items-center gap-2">
                  <Badge size="sm" variant="secondary">
                    {cat.count}
                  </Badge>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 transition-transform ${openOfferedCat === cat.id ? 'rotate-180' : ''}`}
                    aria-hidden="true"
                  />
                </div>
              </button>
              {openOfferedCat === cat.id && (
                <div className="divide-y divide-neutral-200">
                  {cat.services.map(s => (
                    <div key={s.id} className="p-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="min-w-0 flex-1">
                            <Text
                              variant="p"
                              size="sm"
                              color="muted"
                              className="truncate"
                            >
                              {s.code}
                            </Text>
                            <Text
                              variant="h4"
                              size="lg"
                              weight="semibold"
                              className="truncate"
                            >
                              {s.name}
                            </Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </Badge>
                          <Button
                            variant="secondary"
                            size="sm"
                            aria-label={`Ask about ${s.name}`}
                            onClick={() => openChat()}
                            className="w-10 h-10 p-0"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-10 h-10 p-0"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {selected.size > 0 && isSelectionMode && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
          >
            <MessageSquare className="w-5 h-5" />
            Add to Chat ({selected.size})
          </Button>
        </div>
      )}
    </div>
  );
};

export default PortfolioCard;
