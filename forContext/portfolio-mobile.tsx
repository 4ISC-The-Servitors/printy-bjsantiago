'use client';

import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Plus,
  MoreVertical,
  MessageCircle,
  X,
  Trash2,
} from 'lucide-react';

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

interface SelectedComponent {
  id: string;
  name: string;
  type: string;
}

const mockPortfolioData: ServiceCategory[] = [
  {
    id: 'commercial',
    name: 'Commercial Printing',
    count: 25,
    services: [
      {
        id: 'cp001',
        name: 'Business Cards',
        code: 'SRV-CP001',
        status: 'Active',
      },
      { id: 'cp002', name: 'Brochures', code: 'SRV-CP002', status: 'Active' },
      { id: 'cp003', name: 'Flyers', code: 'SRV-CP003', status: 'Inactive' },
    ],
  },
  {
    id: 'packaging',
    name: 'Packaging',
    count: 5,
    services: [
      { id: 'pk001', name: 'Soap Box', code: 'SRV-PK001', status: 'Active' },
      {
        id: 'pk002',
        name: 'Coffee / Tea Box',
        code: 'SRV-PK002',
        status: 'Active',
      },
      {
        id: 'pk003',
        name: 'Pharmaceutical Box',
        code: 'SRV-PK003',
        status: 'Active',
      },
      { id: 'pk004', name: 'Paper Bag', code: 'SRV-PK004', status: 'Inactive' },
      { id: 'pk005', name: 'Hang Tag', code: 'SRV-PK005', status: 'Active' },
    ],
  },
  {
    id: 'digital',
    name: 'Digital Printing',
    count: 5,
    services: [
      {
        id: 'dp001',
        name: 'Photo Prints',
        code: 'SRV-DP001',
        status: 'Active',
      },
      {
        id: 'dp002',
        name: 'Canvas Prints',
        code: 'SRV-DP002',
        status: 'Retired',
      },
    ],
  },
  {
    id: 'large-format',
    name: 'Large Format Printing',
    count: 5,
    services: [
      { id: 'lf001', name: 'Banners', code: 'SRV-LF001', status: 'Active' },
      { id: 'lf002', name: 'Posters', code: 'SRV-LF002', status: 'Inactive' },
    ],
  },
];

const mockServicesOffered: ServiceCategory[] = [
  {
    id: 'commercial-offered',
    name: 'Commercial Printing',
    count: 19,
    services: [
      { id: 'co001', name: 'Letterheads', code: 'SRV-CO001', status: 'Active' },
      { id: 'co002', name: 'Envelopes', code: 'SRV-CO002', status: 'Active' },
    ],
  },
  {
    id: 'packaging-offered',
    name: 'Packaging',
    count: 4,
    services: [
      { id: 'po001', name: 'Gift Boxes', code: 'SRV-PO001', status: 'Active' },
      {
        id: 'po002',
        name: 'Food Containers',
        code: 'SRV-PO002',
        status: 'Active',
      },
    ],
  },
  {
    id: 'digital-offered',
    name: 'Digital Printing',
    count: 4,
    services: [
      { id: 'do001', name: 'Stickers', code: 'SRV-DO001', status: 'Active' },
      { id: 'do002', name: 'Labels', code: 'SRV-DO002', status: 'Active' },
    ],
  },
  {
    id: 'large-format-offered',
    name: 'Large Format Printing',
    count: 4,
    services: [
      { id: 'lo001', name: 'Signage', code: 'SRV-LO001', status: 'Active' },
      {
        id: 'lo002',
        name: 'Vehicle Wraps',
        code: 'SRV-LO002',
        status: 'Active',
      },
    ],
  },
];

export default function PortfolioMobile() {
  const [openPortfolioDropdown, setOpenPortfolioDropdown] = useState<
    string | null
  >(null);
  const [openServicesDropdown, setOpenServicesDropdown] = useState<
    string | null
  >(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedComponents, setSelectedComponents] = useState<
    SelectedComponent[]
  >([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'Retired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleServiceSelect = (service: Service) => {
    if (selectedServices.includes(service.id)) {
      setSelectedServices(selectedServices.filter(id => id !== service.id));
    } else {
      setSelectedServices([...selectedServices, service.id]);
    }
  };

  const handleViewInChat = (service: Service) => {
    const component: SelectedComponent = {
      id: service.id,
      name: service.name,
      type: 'SERVICE',
    };
    setSelectedComponents([component]);
    setIsChatOpen(true);
    setOpenMenuId(null);
  };

  const handleSelectFromMenu = (service: Service) => {
    setIsSelectionMode(true);
    setSelectedServices([service.id]);
    setOpenMenuId(null);
  };

  const handleAddToChat = () => {
    const newComponents = selectedServices
      .map(serviceId => {
        const allServices = [
          ...mockPortfolioData,
          ...mockServicesOffered,
        ].flatMap(cat => cat.services);
        const service = allServices.find(s => s.id === serviceId);
        return service
          ? {
              id: service.id,
              name: service.name,
              type: 'SERVICE',
            }
          : null;
      })
      .filter(Boolean) as SelectedComponent[];

    setSelectedComponents(newComponents);
    setIsChatOpen(true);
    setIsSelectionMode(false);
    setSelectedServices([]);
  };

  const removeComponent = (componentId: string) => {
    setSelectedComponents(selectedComponents.filter(c => c.id !== componentId));
  };

  const removeAllComponents = () => {
    selectedComponents.forEach(component => {
      removeComponent(component.id);
    });
  };

  const hasSelectedItems = selectedServices.length > 0;

  return (
    <div className="p-4 space-y-6">
      {/* Chat Panel for Mobile */}
      {isChatOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full h-2/3 rounded-t-lg flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Selected Components
                </h3>
                {selectedComponents.length > 0 && (
                  <>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm font-medium">
                      {selectedComponents.length}
                    </span>
                    <button
                      onClick={removeAllComponents}
                      className="p-1 hover:bg-gray-100 rounded"
                      title="Remove All"
                    >
                      <Trash2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto">
              {selectedComponents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedComponents.map(component => (
                    <div
                      key={component.id}
                      className="flex items-center gap-1 bg-white border border-green-200 rounded px-2 py-1 text-sm min-h-[32px]"
                    >
                      <span className="text-gray-900">{component.name}</span>
                      <button
                        onClick={() => removeComponent(component.id)}
                        className="ml-1 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center">
                  No services selected
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Portfolio Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Service Portfolio
          </h2>
          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <button
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedServices([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            )}
            <button className="flex items-center gap-2 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm">
              <Plus className="w-4 h-4" />
              Add Service
            </button>
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
                  <span className="font-medium text-gray-900 text-sm">
                    {category.name}
                  </span>
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
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.id)}
                              onChange={() => handleServiceSelect(service)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {service.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {service.code}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}
                          >
                            {service.status}
                          </span>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === service.id ? null : service.id
                                )
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {openMenuId === service.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                                <button
                                  onClick={() => handleViewInChat(service)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  View in Chat
                                </button>
                                <button
                                  onClick={() => handleSelectFromMenu(service)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  Select
                                </button>
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
      </div>

      {/* Services Offered Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Services Offered
          </h2>
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
                  <span className="font-medium text-gray-900 text-sm">
                    {category.name}
                  </span>
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
                            <input
                              type="checkbox"
                              checked={selectedServices.includes(service.id)}
                              onChange={() => handleServiceSelect(service)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                          )}
                          <div>
                            <h4 className="font-medium text-gray-900 text-sm">
                              {service.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {service.code}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            Active
                          </span>
                          <div className="relative">
                            <button
                              onClick={() =>
                                setOpenMenuId(
                                  openMenuId === service.id ? null : service.id
                                )
                              }
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <MoreVertical className="w-4 h-4 text-gray-500" />
                            </button>
                            {openMenuId === service.id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[140px]">
                                <button
                                  onClick={() => handleViewInChat(service)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                  View in Chat
                                </button>
                                <button
                                  onClick={() => handleSelectFromMenu(service)}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                >
                                  Select
                                </button>
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
      </div>

      {/* Floating Add to Chat Button */}
      {hasSelectedItems && isSelectionMode && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <button
            onClick={handleAddToChat}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg rounded-full px-6 py-3 flex items-center gap-2 min-h-[56px] text-sm"
          >
            <MessageCircle className="w-5 h-5" />
            Add to Chat ({selectedServices.length})
          </button>
        </div>
      )}
    </div>
  );
}
