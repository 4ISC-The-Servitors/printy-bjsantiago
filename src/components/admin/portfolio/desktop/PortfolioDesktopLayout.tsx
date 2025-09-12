import React, { useState } from 'react';
import { Button, Card, Text, Badge, Checkbox } from '../../../shared';
import { ChevronDown, ChevronUp, Plus, MessageCircle } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import { getServiceStatusBadgeVariant } from '../../../../utils/admin/statusColors';

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
  mockServicesOffered: ServiceCategory[];
  selectedServices: string[];
  handleServiceSelect: (service: Service) => void;
  handleViewInChat: (service: Service) => void;
  handleAddToChat: () => void;
  getStatusColor: (status: string) => string;
}

const PortfolioDesktopLayout: React.FC<PortfolioDesktopLayoutProps> = ({
  mockPortfolioData,
  mockServicesOffered,
  selectedServices,
  handleServiceSelect,
  handleViewInChat,
  handleAddToChat,
  getStatusColor,
}) => {
  const [openPortfolioDropdown, setOpenPortfolioDropdown] = useState<
    string | null
  >(null);
  const [openServicesDropdown, setOpenServicesDropdown] = useState<
    string | null
  >(null);

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

  const hasSelectedItems = selectedServices.length > 0;

  return (
    <div className="flex-1 p-8 overflow-auto">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Service Portfolio Section */}
        <Card className="w-full">
          <div className="flex items-center justify-between p-8 border-b border-gray-200">
            <Text
              variant="h2"
              size="2xl"
              weight="semibold"
              className="text-gray-900"
            >
              Service Portfolio
            </Text>
            <div className="flex items-center gap-3">
              {hasSelectedItems && (
                <Button
                  onClick={handleAddToChat}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Add to Chat ({selectedServices.length})
                </Button>
              )}
              <Button className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors">
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {mockPortfolioData.map(category => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg"
              >
                <button
                  onClick={() => togglePortfolioDropdown(category.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Text
                      variant="p"
                      size="base"
                      weight="medium"
                      className="text-gray-900"
                    >
                      {category.name}
                    </Text>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      {category.count}
                    </span>
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
                          className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
                        >
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceSelect(service)}
                            className="absolute top-2 left-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="ml-6">
                            <Text
                              variant="p"
                              size="base"
                              weight="medium"
                              className="text-gray-900"
                            >
                              {service.name}
                            </Text>
                            <Text variant="p" size="sm" color="muted">
                              {service.code}
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={cn('text-xs')}
                              variant={getServiceStatusBadgeVariant(service.status)}
                            >
                              {service.status}
                            </Badge>
                            <Button
                              onClick={() => handleViewInChat(service)}
                              className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="View in Chat"
                            >
                              <MessageCircle className="w-4 h-4 text-gray-500" />
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
          <div className="p-8 border-b border-gray-200">
            <Text
              variant="h2"
              size="2xl"
              weight="semibold"
              className="text-gray-900"
            >
              Services Offered
            </Text>
          </div>

          <div className="p-8 space-y-6">
            {mockServicesOffered.map(category => (
              <div
                key={category.id}
                className="border border-gray-200 rounded-lg"
              >
                <button
                  onClick={() => toggleServicesDropdown(category.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Text
                      variant="p"
                      size="base"
                      weight="medium"
                      className="text-gray-900"
                    >
                      {category.name}
                    </Text>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                      {category.count}
                    </span>
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
                          className="group flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors relative"
                        >
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={() => handleServiceSelect(service)}
                            className="absolute top-2 left-2 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="ml-6">
                            <Text
                              variant="p"
                              size="base"
                              weight="medium"
                              className="text-gray-900"
                            >
                              {service.name}
                            </Text>
                            <Text variant="p" size="sm" color="muted">
                              {service.code}
                            </Text>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className="rounded-full text-xs font-medium"
                              variant={getServiceStatusBadgeVariant('Active')}
                            >
                              Active
                            </Badge>
                            <Button
                              onClick={() => handleViewInChat(service)}
                              className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                              title="View in Chat"
                            >
                              <MessageCircle className="w-4 h-4 text-gray-500" />
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
      </div>
    </div>
  );
};

export default PortfolioDesktopLayout;
