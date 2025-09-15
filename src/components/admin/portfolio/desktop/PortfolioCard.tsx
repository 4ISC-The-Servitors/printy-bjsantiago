import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Skeleton, Text, Checkbox } from '../../../shared';
import {
  getPortfolioServices,
  getServicesOffered,
  getServicesByCategory,
} from '@data/services';
import { useServiceSelection } from '@hooks/admin/SelectionContext';
import { createServiceSelectionItems } from '@utils/admin/selectionUtils';
import { MessageSquare, Plus, ChevronDown } from 'lucide-react';
import { useAdmin } from '@hooks/admin/AdminContext';
//
import { getServiceStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { cn } from '../../../../lib/utils';

const PortfolioCard: React.FC = () => {
  const serviceSelection = useServiceSelection();
  const { openChat, openChatWithTopic, addSelected } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  const allServices = getPortfolioServices();
  const offeredServices = getServicesOffered();
  const categoriesAll = getServicesByCategory(allServices);
  const categoriesOffered = getServicesByCategory(offeredServices);
  const serviceItems = createServiceSelectionItems(allServices);

  const [openAllCategoryId, setOpenAllCategoryId] = useState<string | null>(
    null
  );
  const [openOfferedCategoryId, setOpenOfferedCategoryId] = useState<
    string | null
  >(null);
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);

  const toggleServiceSelection = (serviceId: string) => {
    const item = serviceItems.find(i => i.id === serviceId);
    if (item) serviceSelection.toggle(item);
  };

  const addSelectedToChat = () => {
    const selectedIds = serviceSelection.selectedIds;
    if (selectedIds.length === 0) return;
    const servicesArr = allServices;
    // Update chips bar for UI context
    selectedIds.forEach(id => {
      const svc = servicesArr.find(s => s.id === id);
      const label = svc ? `${svc.name} (${svc.code})` : id;
      addSelected({ id, label, type: 'service' });
    });
    if (selectedIds.length > 1) {
      openChatWithTopic?.(
        'multiple-portfolio',
        undefined,
        undefined,
        servicesArr,
        undefined,
        selectedIds
      );
    } else {
      openChatWithTopic?.('portfolio', selectedIds[0], undefined, servicesArr);
    }
    if (!openChatWithTopic) openChat();
    serviceSelection.clear();
  };

  if (isLoading) {
    return (
      <div className="relative">
        <Card className="p-0">
          <div className="flex items-center justify-end px-3 py-2 sm:px-4">
            <Skeleton variant="rectangular" width="40px" height="20px" />
          </div>
          <div className="space-y-4 sm:space-y-6 px-3 sm:px-4 pb-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg border bg-white/60"
              >
                <Skeleton variant="circular" width="16px" height="16px" />
                <div className="flex-1 space-y-2">
                  <Skeleton variant="text" width="160px" height="16px" />
                  <Skeleton variant="text" width="100px" height="14px" />
                </div>
                <Skeleton variant="rectangular" width="32px" height="32px" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative space-y-6">
      {/* Service Portfolio (All) */}
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="flex items-center gap-3">
            <Text variant="h3" size="lg" weight="semibold">
              Service Portfolio
            </Text>
            <Badge size="sm" variant="secondary">
              {allServices.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              threeD
              onClick={() => {
                if (openChatWithTopic) openChatWithTopic('add-service');
                else openChat();
              }}
              aria-label="Add Service"
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </div>
        </div>
        <div className="p-8 space-y-6">
          {categoriesAll.map(cat => (
            <div key={cat.id} className="border border-gray-200 rounded-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setOpenAllCategoryId(prev =>
                    prev === cat.id ? null : cat.id
                  )
                }
                aria-expanded={openAllCategoryId === cat.id}
              >
                <div className="flex items-baseline gap-3 mt-1">
                  <Text
                    variant="p"
                    size="base"
                    weight="medium"
                    className="text-gray-900"
                  >
                    {cat.name}
                  </Text>
                  <Badge size="sm" variant="secondary">
                    {cat.count}
                  </Badge>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${openAllCategoryId === cat.id ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {openAllCategoryId === cat.id && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.services.map(s => (
                      <div
                        key={s.id}
                        className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
                        onMouseEnter={() => setHoveredServiceId(s.id)}
                        onMouseLeave={() => setHoveredServiceId(null)}
                      >
                        <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                          <Checkbox
                            checked={serviceSelection.isSelected(s.id)}
                            onCheckedChange={() => toggleServiceSelection(s.id)}
                            className={cn(
                              'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                              hoveredServiceId === s.id ||
                                serviceSelection.selectionCount > 0
                                ? 'opacity-100'
                                : 'opacity-0'
                            )}
                          />
                        </div>

                        <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
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
                              variant="p"
                              size="lg"
                              weight="medium"
                              className="truncate text-gray-900"
                            >
                              {s.name}
                            </Text>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={getServiceStatusBadgeVariant(s.status)}
                                className="text-sm px-3 py-1"
                              >
                                {s.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            threeD
                            className="min-h-[44px] min-w-[44px]"
                            title="Chat about this service"
                            onClick={() => {
                              const label = `${s.name} (${s.code})`;
                              addSelected({ id: s.id, label, type: 'service' });
                              if (openChatWithTopic)
                                openChatWithTopic(
                                  'portfolio',
                                  s.id,
                                  undefined,
                                  allServices
                                );
                              else openChat();
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Services Offered (Active only) */}
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <div className="flex items-center gap-3">
            <Text variant="h3" size="lg" weight="semibold">
              Services Offered
            </Text>
            <Badge size="sm" variant="secondary">
              {offeredServices.length}
            </Badge>
          </div>
        </div>
        <div className="p-8 space-y-6">
          {categoriesOffered.map(cat => (
            <div key={cat.id} className="border border-gray-200 rounded-lg">
              <button
                type="button"
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                onClick={() =>
                  setOpenOfferedCategoryId(prev =>
                    prev === cat.id ? null : cat.id
                  )
                }
                aria-expanded={openOfferedCategoryId === cat.id}
              >
                <div className="flex items-baseline gap-3 mt-1">
                  <Text
                    variant="p"
                    size="base"
                    weight="medium"
                    className="text-gray-900"
                  >
                    {cat.name}
                  </Text>
                  <Badge size="sm" variant="secondary">
                    {cat.count}
                  </Badge>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${openOfferedCategoryId === cat.id ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              {openOfferedCategoryId === cat.id && (
                <div className="border-t border-gray-200 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cat.services.map(s => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
                      >
                        <div className="flex items-center gap-4 min-w-0 flex-1">
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
                              variant="p"
                              size="lg"
                              weight="medium"
                              className="truncate text-gray-900"
                            >
                              {s.name}
                            </Text>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge
                                variant={getServiceStatusBadgeVariant('Active')}
                                className="text-sm px-3 py-1"
                              >
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            threeD
                            title="Chat about this service"
                            onClick={() => {
                              if (openChatWithTopic)
                                openChatWithTopic(
                                  'portfolio',
                                  s.id,
                                  undefined,
                                  allServices
                                );
                              else openChat();
                            }}
                            className="min-h-[44px] min-w-[44px]"
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {serviceSelection.hasSelections && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={addSelectedToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
          >
            <Plus className="h-5 w-5" />
            Add to Chat ({serviceSelection.selectionCount})
          </Button>
        </div>
      )}
    </div>
  );
};

export default PortfolioCard;
