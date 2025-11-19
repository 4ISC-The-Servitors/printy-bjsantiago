import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllServices,
  fetchActiveServices,
  fetchServicesByCategory,
  fetchActiveServicesByCategory,
  subscribeToServices,
  subscribeToServiceCategories,
  subscribeToActiveServices,
} from '@features/chat/api/servicesApi';
import type {
  ServiceWithCategory,
  ServiceCategoryWithCount,
} from '@shared/types/service';
// Selection removed
import { useAdmin } from '@admin/hooks/AdminContext';

export const usePortfolioCard = () => {
  const { openChat, openChatWithTopic } = useAdmin();
  const [isLoading, setIsLoading] = useState(true);
  const [openAllCategoryId, setOpenAllCategoryId] = useState<string | null>(
    null
  );
  const [openOfferedCategoryId, setOpenOfferedCategoryId] = useState<
    string | null
  >(null);
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);
  const [allServices, setAllServices] = useState<ServiceWithCategory[]>([]);
  const [offeredServices, setOfferedServices] = useState<ServiceWithCategory[]>(
    []
  );
  const [categoriesAll, setCategoriesAll] = useState<
    ServiceCategoryWithCount[]
  >([]);
  const [categoriesOffered, setCategoriesOffered] = useState<
    ServiceCategoryWithCount[]
  >([]);

  // Load services data function
  const loadServices = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const [all, active, allCategories, activeCategories] = await Promise.all([
        fetchAllServices(),
        fetchActiveServices(),
        fetchServicesByCategory(),
        fetchActiveServicesByCategory(),
      ]);

      setAllServices(all);
      setOfferedServices(active);
      setCategoriesAll(allCategories);
      setCategoriesOffered(activeCategories);
    } catch (error) {
      console.error('Error loading services:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  }, []);

  // Fetch services data on mount
  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Set up realtime subscriptions for services and categories
  useEffect(() => {
    // Debounce function to prevent rapid updates
    let debounceTimer: NodeJS.Timeout;
    const debouncedLoadServices = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Update silently in background without showing loading state
        loadServices(false);
      }, 500); // 500ms debounce
    };

    const servicesSubscription = subscribeToServices(() => {
      // Update silently in background when services change
      debouncedLoadServices();
    });

    const categoriesSubscription = subscribeToServiceCategories(() => {
      // Update silently in background when categories change
      debouncedLoadServices();
    });

    const activeServicesSubscription = subscribeToActiveServices(() => {
      // Update silently in background when active services change
      debouncedLoadServices();
    });

    // Cleanup subscriptions on unmount
    return () => {
      clearTimeout(debounceTimer);
      servicesSubscription.unsubscribe();
      categoriesSubscription.unsubscribe();
      activeServicesSubscription.unsubscribe();
    };
  }, [loadServices]);

  const toggleServiceSelection = (_serviceId: string) => {
    // no selection; noop
  };

  const viewInChat = (serviceId: string) => {
    if (!openChatWithTopic) {
      openChat();
      return;
    }

    if (serviceId === 'about-bj-santiago') {
      openChatWithTopic('about-bj-santiago');
      return;
    }

    if (serviceId === 'faqs-bj-santiago') {
      openChatWithTopic('faqs-bj-santiago');
      return;
    }

    openChatWithTopic('portfolio', serviceId, undefined, allServices);
  };

  const handleAddService = () => {
    if (openChatWithTopic) openChatWithTopic('add-service');
    else openChat();
  };

  const toggleAllCategory = (categoryId: string) => {
    setOpenAllCategoryId(prev => (prev === categoryId ? null : categoryId));
  };

  const toggleOfferedCategory = (categoryId: string) => {
    setOpenOfferedCategoryId(prev => (prev === categoryId ? null : categoryId));
  };

  return {
    isLoading,
    allServices,
    offeredServices,
    categoriesAll,
    categoriesOffered,
    openAllCategoryId,
    openOfferedCategoryId,
    hoveredServiceId,
    setHoveredServiceId,
    isSelected: () => false,
    selectionCount: 0,
    toggleServiceSelection,
    viewInChat,
    handleAddService,
    toggleAllCategory,
    toggleOfferedCategory,
  };
};
