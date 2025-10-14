import React from 'react';
import { Card, Badge, Button, Text } from '../../shared';
import { Plus, ChevronDown } from 'lucide-react';
import { ServiceItem } from './ServiceItem';
import { PortfolioSkeleton } from './PortfolioSkeleton';
import { usePortfolioCard } from '../../../hooks/admin/usePortfolioCard';

const PortfolioCard: React.FC = () => {
  const {
    isLoading,
    allServices,
    offeredServices,
    categoriesAll,
    categoriesOffered,
    openAllCategoryId,
    openOfferedCategoryId,
    hoveredServiceId,
    setHoveredServiceId,
    isSelected,
    selectionCount,
    toggleServiceSelection,
    viewInChat,
    handleAddService,
    toggleAllCategory,
    toggleOfferedCategory,
  } = usePortfolioCard();

  if (isLoading) return <PortfolioSkeleton />;

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
              onClick={handleAddService}
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
                onClick={() => toggleAllCategory(cat.id)}
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
                      <ServiceItem
                        key={s.id}
                        service={s}
                        isSelected={isSelected(s.id)}
                        isHovered={hoveredServiceId === s.id}
                        showCheckbox={selectionCount > 0}
                        onHover={setHoveredServiceId}
                        onToggleSelection={toggleServiceSelection}
                        onViewInChat={viewInChat}
                      />
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
                onClick={() => toggleOfferedCategory(cat.id)}
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
                                variant="success"
                                className="text-sm px-3 py-1"
                              >
                                Active
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-4"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
};

export default PortfolioCard;
