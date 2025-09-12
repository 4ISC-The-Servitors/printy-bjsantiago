import React, { useState } from 'react';
import { Button, Card, Text, Badge, Checkbox } from '../../../shared';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  MessageCircle,
  X,
} from 'lucide-react';
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

interface PortfolioMobileLayoutProps {
  mockPortfolioData: ServiceCategory[];
  mockServicesOffered: ServiceCategory[];
  selectedServices: string[];
  setSelectedServices: (services: string[]) => void;
  handleServiceSelect: (service: Service) => void;
  handleViewInChat: (service: Service) => void;
  handleAddToChat: () => void;
  getStatusColor: (status: string) => string;
}

const PortfolioMobileLayout: React.FC<PortfolioMobileLayoutProps> = ({
  mockPortfolioData,
  mockServicesOffered,
  selectedServices,
  setSelectedServices,
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
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

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

  const handleSelectFromMenu = (service: Service) => {
    setIsSelectionMode(true);
    setSelectedServices([service.id]);
    setOpenMenuId(null);
  };

  const hasSelectedItems = selectedServices.length > 0;

  return (
    <div className="p-4 space-y-6">
      {/* Service Portfolio Section */}
      <Card className="w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <Text
            variant="h2"
            size="lg"
            weight="semibold"
            className="text-gray-900"
          >
            Service Portfolio
          </Text>
          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <Button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedServices([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </Button>
            )}
            <Button className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              <Plus className="w-4 h-4" />
              Add Service
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {mockPortfolioData.map(category => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg"
            >
              <button
                onClick={() => togglePortfolioDropdown(category.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Text
                    variant="p"
                    size="sm"
                    weight="medium"
                    className="text-gray-900"
                  >
                    {category.name}
                  </Text>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {category.count}
                  </span>
                </div>
                {openPortfolioDropdown === category.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {openPortfolioDropdown === category.id && (
                <div className="border-t border-gray-200 p-3">
                  <div className="space-y-3">
                    {category.services.map(service => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {(isSelectionMode ||
                            selectedServices.includes(service.id)) && (
                            <Checkbox
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() =>
                                handleServiceSelect(service)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                          <div>
                            <Text
                              variant="p"
                              size="sm"
                              weight="medium"
                              className="text-gray-900"
                            >
                              {service.name}
                            </Text>
                            <Text variant="p" size="xs" color="muted">
                              {service.code}
                            </Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              getStatusColor(service.status),
                              'text-xs'
                            )}
                            variant="secondary"
                          >
                            {service.status}
                          </Badge>
                          <div className="relative">
                            <Button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === service.id ? null : service.id
                                )
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                            {openMenuId === service.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                                <Button
                                  onClick={() => handleViewInChat(service)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <Text variant="p" size="sm">
                                    View in Chat
                                  </Text>
                                </Button>
                                <Button
                                  onClick={() => handleSelectFromMenu(service)}
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
        <div className="p-4 border-b border-gray-200">
          <Text
            variant="h2"
            size="lg"
            weight="semibold"
            className="text-gray-900"
          >
            Services Offered
          </Text>
        </div>

        <div className="p-4 space-y-3">
          {mockServicesOffered.map(category => (
            <div
              key={category.id}
              className="border border-gray-200 rounded-lg"
            >
              <button
                onClick={() => toggleServicesDropdown(category.id)}
                className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Text
                    variant="p"
                    size="sm"
                    weight="medium"
                    className="text-gray-900"
                  >
                    {category.name}
                  </Text>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                    {category.count}
                  </span>
                </div>
                {openServicesDropdown === category.id ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </button>

              {openServicesDropdown === category.id && (
                <div className="border-t border-gray-200 p-3">
                  <div className="space-y-3">
                    {category.services.map(service => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {(isSelectionMode ||
                            selectedServices.includes(service.id)) && (
                            <Checkbox
                              checked={selectedServices.includes(service.id)}
                              onCheckedChange={() =>
                                handleServiceSelect(service)
                              }
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                          <div>
                            <Text
                              variant="p"
                              size="sm"
                              weight="medium"
                              className="text-gray-900"
                            >
                              {service.name}
                            </Text>
                            <Text variant="p" size="xs" color="muted">
                              {service.code}
                            </Text>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </Badge>
                          <div className="relative">
                            <Button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === service.id ? null : service.id
                                )
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                            {openMenuId === service.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                                <Button
                                  onClick={() => handleViewInChat(service)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  <Text variant="p" size="sm">
                                    View in Chat
                                  </Text>
                                </Button>
                                <Button
                                  onClick={() => handleSelectFromMenu(service)}
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
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Floating Add to Chat Button */}
      {hasSelectedItems && isSelectionMode && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={handleAddToChat}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Add to Chat ({selectedServices.length})
          </Button>
        </div>
      )}
    </div>
  );
};

export default PortfolioMobileLayout;
