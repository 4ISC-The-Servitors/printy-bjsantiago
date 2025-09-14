import React, { useState } from 'react';
import { Button, Card, Text, Badge, Checkbox } from '../../../shared';
import { ChevronDown, ChevronUp, Plus, MessageSquare } from 'lucide-react';
import { getServiceStatusBadgeVariant } from '../../../../utils/admin/statusColors';
import { cn } from '../../../../lib/utils';

interface Service {
  id: string;
  name: string;
  code: string;
  status: 'Active' | 'Inactive' | 'Retired';
}

interface ServiceCategory {
  id: string;
  name: string;
  count: number;
  services: Service[];
}

interface PortfolioDesktopLayoutProps {
  mockPortfolioData: ServiceCategory[];
  selectedServices: string[];
  handleServiceSelect: (service: Service) => void;
  handleViewInChat: (service: Service) => void;
  handleAddToChat: () => void;
  handleServiceChat?: (service: any) => void;
  services?: any[];
}

const PortfolioDesktopLayout: React.FC<PortfolioDesktopLayoutProps> = ({
  mockPortfolioData,
  selectedServices,
  handleServiceSelect,
  handleViewInChat,
  handleAddToChat,
  handleServiceChat,
  services,
}) => {
  const [openPortfolioDropdown, setOpenPortfolioDropdown] = useState<
    string | null
  >(null);
  const [openServicesDropdown, setOpenServicesDropdown] = useState<
    string | null
  >(null);
  const [hoveredService, setHoveredService] = useState<string | null>(null);

  // Create dynamic portfolio data from services if available, otherwise use mock data
  const portfolioData = services
    ? (() => {
        const categoryMap = new Map<string, Service[]>();
        services.forEach(service => {
          const category = service.category || 'Uncategorized';
          if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
          }
          categoryMap.get(category)!.push({
            id: service.id,
            name: service.name,
            code: service.code,
            status: service.status as 'Active' | 'Inactive' | 'Retired',
          });
        });

        return Array.from(categoryMap.entries()).map(([name, services]) => ({
          id: name.toLowerCase().replace(/\s+/g, '-'),
          name,
          count: services.length,
          services,
        }));
      })()
    : mockPortfolioData;

  // Create Services Offered data by filtering portfolio data for Active services only
  const servicesOfferedData = portfolioData
    .map(category => ({
      ...category,
      services: category.services.filter(
        service => service.status === 'Active'
      ),
      count: category.services.filter(service => service.status === 'Active')
        .length,
    }))
    .filter(category => category.count > 0);

  const togglePortfolioDropdown = (categoryId: string) => {
    setOpenPortfolioDropdown(
      openPortfolioDropdown === categoryId ? null : categoryId
    );
  };

  const toggleServicesDropdown = (categoryId: string) => {
    setOpenServicesDropdown(
      openServicesDropdown === categoryId ? null : categoryId
    );
  };

  // Use checkbox selections for the floating button
  const hasSelectedItems = selectedServices.length > 0;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Service Portfolio Section */}
        <Card className="w-full">
          <div className="flex items-center justify-between p-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Text
                variant="h2"
                size="2xl"
                weight="semibold"
                className="text-gray-900"
              >
                Service Portfolio
              </Text>
              <Badge size="sm" variant="secondary">
                {portfolioData.reduce(
                  (total, category) => total + category.count,
                  0
                )}
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                threeD
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {portfolioData.map(category => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg"
              >
                <button
                  onClick={() => togglePortfolioDropdown(category.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-baseline gap-3 mt-1">
                    <Text
                      variant="p"
                      size="base"
                      weight="medium"
                      className="text-gray-900"
                    >
                      {category.name}
                    </Text>
                    <Badge
                      size="sm"
                      variant="secondary"
                      className="align-middle"
                    >
                      {category.count}
                    </Badge>
                  </div>
                  {openPortfolioDropdown === category.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {openPortfolioDropdown === category.id && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.services.map(service => (
                        <div
                          key={service.id}
                          className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
                          onMouseEnter={() => setHoveredService(service.id)}
                          onMouseLeave={() => setHoveredService(null)}
                        >
                          <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
                            <Checkbox
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() =>
                                handleServiceSelect(service)
                              }
                              className={cn(
                                'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
                                hoveredService === service.id ||
                                  selectedServices.length > 0
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
                                {service.code}
                              </Text>
                              <Text
                                variant="p"
                                size="lg"
                                weight="medium"
                                className="truncate"
                              >
                                {service.name}
                              </Text>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant={getServiceStatusBadgeVariant(
                                    service.status
                                  )}
                                  className="text-sm px-3 py-1"
                                >
                                  {service.status}
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
                              onClick={() =>
                                handleServiceChat?.(service) ||
                                handleViewInChat(service)
                              }
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

        {/* Services Offered Section */}
        <Card className="w-full">
          <div className="flex items-center justify-between p-8 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Text
                variant="h2"
                size="2xl"
                weight="semibold"
                className="text-gray-900"
              >
                Services Offered
              </Text>
              <Badge size="sm" variant="secondary">
                {servicesOfferedData.reduce(
                  (total, category) => total + category.count,
                  0
                )}
              </Badge>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {servicesOfferedData.map(category => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg"
              >
                <button
                  onClick={() => toggleServicesDropdown(category.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-baseline gap-3 mt-1">
                    <Text
                      variant="p"
                      size="base"
                      weight="medium"
                      className="text-gray-900"
                    >
                      {category.name}
                    </Text>
                    <Badge
                      size="sm"
                      variant="secondary"
                      className="align-middle"
                    >
                      {category.count}
                    </Badge>
                  </div>
                  {openServicesDropdown === category.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {openServicesDropdown === category.id && (
                  <div className="border-t border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {category.services.map(service => (
                        <div
                          key={service.id}
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
                                {service.code}
                              </Text>
                              <Text
                                variant="p"
                                size="lg"
                                weight="medium"
                                className="truncate"
                              >
                                {service.name}
                              </Text>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge
                                  variant={getServiceStatusBadgeVariant(
                                    service.status
                                  )}
                                  className="text-sm px-3 py-1"
                                >
                                  {service.status}
                                </Badge>
                              </div>
                            </div>
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

        {/* Floating Add to Chat button */}
        {hasSelectedItems && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={handleAddToChat}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-8 py-4 flex items-center gap-3 min-h-[64px] text-lg"
            >
              <Plus className="h-5 w-5" />
              Add to Chat ({selectedServices.length})
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PortfolioDesktopLayout;
