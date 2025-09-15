import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAdminChat } from '@hooks/admin/useAdminChat';
import { getPortfolioServices, getServicesByCategory } from '@data/services';

export type ServiceStatus = 'Active' | 'Inactive' | 'Retired';

export interface Service {
  id: string;
  name: string;
  code: string;
  status: ServiceStatus;
}

export interface ServiceCategory {
  id: string;
  name: string;
  count: number;
  services: Service[];
}

export const usePortfolio = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const mockPortfolioData: ServiceCategory[] = useMemo(
    () => getServicesByCategory(getPortfolioServices()),
    []
  );

  const {
    chatOpen,
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
    setServices(getPortfolioServices());
  }, []);

  const updateService = useCallback(
    (serviceId: string, updates: Partial<Service>) => {
      setServices(prev =>
        prev.map(s => (s.id === serviceId ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const refreshServices = useCallback(() => {
    setServices(getPortfolioServices());
  }, []);

  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedServices(prev =>
      prev.includes(service.id)
        ? prev.filter(id => id !== service.id)
        : [...prev, service.id]
    );
  }, []);

  const handleViewInChat = useCallback(
    (service: Service) => {
      // Open chat focused on a single service
      handleChatOpenWithTopic(
        'portfolio',
        service.id,
        updateService,
        services,
        refreshServices
      );
    },
    [handleChatOpenWithTopic, refreshServices, services, updateService]
  );

  const handleServiceChat = useCallback(
    (service?: Service) => {
      if (service) {
        handleViewInChat(service);
      } else {
        handleChatOpen();
      }
    },
    [handleChatOpen, handleViewInChat]
  );

  const handleAddService = useCallback(() => {
    handleChatOpenWithTopic(
      'add-service',
      undefined,
      updateService,
      services,
      refreshServices
    );
  }, [handleChatOpenWithTopic, refreshServices, services, updateService]);

  const handleAddToChat = useCallback(() => {
    if (selectedServices.length === 0) return;

    const flowId =
      selectedServices.length > 1 ? 'multiple-portfolio' : 'portfolio';
    if (flowId === 'multiple-portfolio') {
      handleChatOpenWithTopic(
        'multiple-portfolio',
        undefined,
        updateService,
        services,
        refreshServices,
        selectedServices
      );
    } else {
      handleChatOpenWithTopic(
        'portfolio',
        selectedServices[0],
        updateService,
        services,
        refreshServices
      );
    }

    setSelectedServices([]);
  }, [
    handleChatOpenWithTopic,
    refreshServices,
    selectedServices,
    services,
    updateService,
  ]);

  const getStatusColor = useCallback((status: ServiceStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'Retired':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return {
    // data
    services,
    mockPortfolioData,
    selectedServices,

    // selection
    setSelectedServices,
    handleServiceSelect,

    // chat state
    chatOpen,
    messages,
    isTyping,
    quickReplies,

    // chat actions
    handleChatOpen,
    handleChatOpenWithTopic,
    endChatWithDelay,
    handleSendMessage,
    handleQuickReply,
    handleViewInChat,
    handleServiceChat,
    handleAddService,
    handleAddToChat,

    // helpers
    getStatusColor,
  };
};

export default usePortfolio;
