import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PortfolioMobileLayout from '../../components/admin/portfolio/mobile/PortfolioMobileLayout';
import PortfolioDesktopLayout from '../../components/admin/portfolio/desktop/PortfolioDesktopLayout';
import { useToast } from '../../components/shared';
import Sidebar from '../../components/admin/dashboard/desktop/Sidebar';
import { Text, Button } from '../../components/shared';
import ChatDock from '../../components/shared/ChatDock';
import type { SelectedItem } from './AdminContext';
import ChatPanel from '../../components/chat/CustomerChatPanel';
import { MessageSquare, X, Minimize2 } from 'lucide-react';
import { AdminProvider } from './AdminContext';
import { useAdminChat } from '../../hooks/admin/useAdminChat';
import { SelectionProvider } from '../../hooks/admin/SelectionContext';
import {
  getPortfolioServices,
  getServicesByCategory,
} from '../../data/services';

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

// Get data from services.ts
const mockPortfolioData: ServiceCategory[] = getServicesByCategory(
  getPortfolioServices()
);

const AdminPortfolio: React.FC = () => {
  const navigate = useNavigate();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [, toast] = useToast();

  // Use the admin chat hook
  const {
    chatOpen,
    setChatOpen,
    messages,
    isTyping,
    quickReplies,
    handleChatOpen,
    handleChatOpenWithTopic,
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
  } = useAdminChat();

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 1024); // Using lg breakpoint like existing code
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Initialize services data with portfolio services (all statuses)
  useEffect(() => {
    setServices(getPortfolioServices());
  }, []);

  const go = (
    route: 'dashboard' | 'orders' | 'tickets' | 'portfolio' | 'settings'
  ) => {
    if (route === 'dashboard') navigate('/admin');
    if (route === 'orders') navigate('/admin/orders');
    if (route === 'tickets') navigate('/admin/tickets');
    if (route === 'portfolio') navigate('/admin/portfolio');
    if (route === 'settings') navigate('/admin/settings');
  };

  const handleLogout = () => {
    navigate('/auth/signin');
  };

  const handleChatOpenForService = (service?: any) => {
    if (service) {
      // Use handleChatOpenWithTopic for individual service
      handleChatOpenWithTopic(
        'portfolio',
        service.id,
        updateService,
        services,
        refreshServices
      );
    } else {
      handleChatOpen();
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
    addSelected({
      id: service.id, // Service ID for flow logic
      label: service.name, // Service name for display
      type: 'service',
    });
    handleChatOpenForService(service);
  };

  const handleServiceChat = (service: any) => {
    // Only allow chat for Portfolio services (all statuses)
    handleChatOpenForService(service);
  };

  const handleAddService = () => {
    // Open chat with add service flow
    handleChatOpenWithTopic(
      'add-service',
      undefined,
      updateService,
      services,
      refreshServices
    );
  };

  const addSelected = (item: SelectedItem) => {
    setSelected(prev =>
      prev.find(i => i.id === item.id) ? prev : [...prev, item]
    );
  };

  const openChat = () => setChatOpen(true);

  const updateService = (serviceId: string, updates: Partial<any>) => {
    setServices(prev =>
      prev.map(s => (s.id === serviceId ? { ...s, ...updates } : s))
    );
  };

  const refreshServices = () => {
    setServices(getPortfolioServices());
  };

  const handleAddToChat = () => {
    if (selectedServices.length === 0) {
      toast.error(
        'No services selected',
        'Please select at least one service to add to chat.'
      );
      return;
    }

    // Add selected services to AdminContext
    selectedServices.forEach(serviceId => {
      const service = services.find(s => s.id === serviceId);
      if (service) {
        addSelected({
          id: service.id, // Service ID for flow logic
          label: service.name, // Service name for display
          type: 'service',
        });
      }
    });

    // Determine which flow to use and open chat
    const flowId =
      selectedServices.length > 1 ? 'multiplePortfolio' : 'portfolio';

    console.log('🔄 Starting chat with flow:', flowId);
    console.log('📋 Selected services:', selectedServices);
    console.log('🔧 Services data:', services);
    console.log('🎯 Update service function:', updateService);
    console.log('🔄 Refresh services function:', refreshServices);

    // Use handleChatOpenWithTopic with the appropriate flow
    if (flowId === 'multiplePortfolio') {
      console.log('🚀 Calling handleChatOpenWithTopic with multiple-portfolio');
      handleChatOpenWithTopic(
        'multiple-portfolio',
        undefined,
        updateService,
        services,
        refreshServices,
        selectedServices
      );
    } else {
      console.log('🚀 Calling handleChatOpenWithTopic with portfolio');
      handleChatOpenWithTopic(
        'portfolio',
        selectedServices[0],
        updateService,
        services,
        refreshServices
      );
    }

    // Clear the selected services checkboxes after adding to chat
    setSelectedServices([]);
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

  const commonProps = {
    mockPortfolioData,
    selectedServices,
    setSelectedServices,
    handleServiceSelect,
    handleViewInChat,
    handleAddToChat,
    handleServiceChat,
    handleAddService,
    getStatusColor,
    services,
  };

  return (
    <AdminProvider
      value={{
        selected,
        addSelected,
        removeSelected: (id: string) =>
          setSelected(prev => prev.filter(i => i.id !== id)),
        clearSelected: () => setSelected([]),
        openChat,
      }}
    >
      <SelectionProvider
        onAddToChat={(items, entityType) => {
          setSelected(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const mapped = items
              .filter(i => !existingIds.has(i.id))
              .map(i => ({
                id: i.id, // Service ID for flow logic
                label: i.label, // Service name for display
                type: entityType,
              }));
            return [...prev, ...mapped];
          });
          const serviceIds = items.map(i => i.id);
          // Open chat and initialize the multiple-portfolio flow with selected IDs
          handleChatOpenWithTopic(
            'multiple-portfolio',
            undefined,
            updateService,
            services,
            refreshServices,
            serviceIds
          );
        }}
        onOpenChat={() => setChatOpen(true)}
      >
        <div className="h-screen bg-gradient-to-br from-neutral-50 to-brand-primary-50 flex">
          <Sidebar active="portfolio" onNavigate={go} onLogout={handleLogout} />

          <main
            className={`flex-1 flex flex-col ${chatOpen ? 'lg:pr-[420px]' : ''} pl-16 lg:pl-0 overflow-y-auto scrollbar-hide`}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-4 border-b bg-white/80 backdrop-blur">
              <div className="flex items-center justify-between relative">
                <Text
                  variant="h1"
                  size="2xl"
                  weight="bold"
                  className="text-neutral-900"
                >
                  Portfolio
                </Text>
                <div className="flex items-center gap-2">
                  {chatOpen ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        threeD
                        className="lg:hidden"
                        onClick={() => setChatOpen(false)}
                        aria-label="Hide chat"
                      >
                        <Minimize2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="accent"
                        size="sm"
                        threeD
                        className="lg:hidden"
                        onClick={endChatWithDelay}
                        aria-label="Close chat"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      threeD
                      className="lg:hidden"
                      onClick={() => handleChatOpenForService()}
                      aria-label="Ask Printy"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  )}

                  <Button
                    variant="secondary"
                    size="sm"
                    threeD
                    className="hidden lg:inline-flex"
                    onClick={() => handleChatOpenForService()}
                    aria-label="Ask Printy"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isMobile && chatOpen ? (
                <div className="flex flex-col min-h-screen bg-white">
                  <ChatPanel
                    title="Printy Assistant"
                    messages={messages}
                    onSend={handleSendMessage}
                    isTyping={isTyping}
                    quickReplies={quickReplies}
                    onQuickReply={handleQuickReply}
                    onEndChat={() => setChatOpen(false)}
                  />
                </div>
              ) : (
                <div className="px-4 sm:px-6 lg:px-8 py-6">
                  {isMobile ? (
                    <PortfolioMobileLayout {...commonProps} />
                  ) : (
                    <PortfolioDesktopLayout {...commonProps} />
                  )}
                </div>
              )}
            </div>
          </main>

          {!isMobile && (
            <ChatDock
              open={chatOpen}
              onToggle={() => setChatOpen(false)}
              selected={selected}
              onRemoveSelected={id =>
                setSelected(prev => prev.filter(i => i.id !== id))
              }
              onClearSelected={() => setSelected([])}
              header={
                <div className="flex items-center justify-between">
                  <Text variant="h3" size="lg" weight="semibold">
                    Printy Assistant
                  </Text>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      threeD
                      aria-label="Hide chat"
                      onClick={() => setChatOpen(false)}
                    >
                      <Minimize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="accent"
                      size="sm"
                      threeD
                      aria-label="Close chat"
                      onClick={endChatWithDelay}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              }
            >
              <ChatPanel
                title="Printy Assistant"
                messages={messages}
                onSend={handleSendMessage}
                isTyping={isTyping}
                quickReplies={quickReplies}
                onQuickReply={handleQuickReply}
                onEndChat={endChatWithDelay}
              />
            </ChatDock>
          )}
        </div>
      </SelectionProvider>
    </AdminProvider>
  );
};

export default AdminPortfolio;
