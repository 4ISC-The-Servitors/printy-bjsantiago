import { useCallback, useEffect, useState } from 'react';
import { useAdminChat } from '@admin/hooks/useAdminChat';
import {
  fetchAllServices,
  fetchServicesByCategory,
} from '@/features/chat/api/servicesApi';

export type ServiceStatus = 'active' | 'inactive' | 'retired';

export interface Service {
  service_id: string;
  service_name: string;
  display_id: string;
  status: ServiceStatus;
}

export interface ServiceCategory {
  category_id: string;
  category_name: string;
  service_count: number;
  services: Service[];
}

export const usePortfolio = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [portfolioData, setPortfolioData] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load services data
  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true);
        const [allServices, categories] = await Promise.all([
          fetchAllServices(),
          fetchServicesByCategory(),
        ]);

        // Transform to legacy format for compatibility
        const transformedServices: Service[] = allServices.map(s => ({
          service_id: s.service_id,
          service_name: s.service_name,
          display_id: s.display_id,
          status: s.status,
        }));

        const transformedCategories: ServiceCategory[] = categories.map(c => ({
          category_id: c.category_id,
          category_name: c.category_name,
          service_count: c.service_count,
          services: c.services.map(s => ({
            service_id: s.service_id,
            service_name: s.service_name,
            display_id: s.display_id,
            status: s.status,
          })),
        }));

        setServices(transformedServices);
        setPortfolioData(transformedCategories);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

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

  const updateService = useCallback(
    (serviceId: string, updates: Partial<Service>) => {
      setServices(prev =>
        prev.map(s => (s.service_id === serviceId ? { ...s, ...updates } : s))
      );
    },
    []
  );

  const refreshServices = useCallback(async () => {
    try {
      const [allServices, categories] = await Promise.all([
        fetchAllServices(),
        fetchServicesByCategory(),
      ]);

      const transformedServices: Service[] = allServices.map(s => ({
        service_id: s.service_id,
        service_name: s.service_name,
        display_id: s.display_id,
        status: s.status,
      }));

      const transformedCategories: ServiceCategory[] = categories.map(c => ({
        category_id: c.category_id,
        category_name: c.category_name,
        service_count: c.service_count,
        services: c.services.map(s => ({
          service_id: s.service_id,
          service_name: s.service_name,
          display_id: s.display_id,
          status: s.status,
        })),
      }));

      setServices(transformedServices);
      setPortfolioData(transformedCategories);
    } catch (error) {
      console.error('Error refreshing services:', error);
    }
  }, []);

  const handleServiceSelect = useCallback((service: Service) => {
    setSelectedServices(prev =>
      prev.includes(service.service_id)
        ? prev.filter(id => id !== service.service_id)
        : [...prev, service.service_id]
    );
  }, []);

  const handleViewInChat = useCallback(
    (service: Service) => {
      // Open chat focused on a single service
      handleChatOpenWithTopic(
        'portfolio',
        service.service_id,
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

    // Use single portfolio flow for all cases
    handleChatOpenWithTopic(
      'portfolio',
      selectedServices[0], // Use first service as primary
      updateService,
      services,
      refreshServices,
      selectedServices // Pass all selected services as orderIds
    );

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
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'retired':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  return {
    // data
    services,
    portfolioData,
    selectedServices,
    isLoading,

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
