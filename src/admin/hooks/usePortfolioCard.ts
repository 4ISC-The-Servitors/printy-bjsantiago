import { useState, useEffect } from 'react';
import { 
  fetchAllServices, 
  fetchActiveServices, 
  fetchServicesByCategory,
  fetchActiveServicesByCategory
} from '@features/api/servicesApi';
import type { ServiceWithCategory, ServiceCategoryWithCount } from '@shared/types/service';
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
  const [offeredServices, setOfferedServices] = useState<ServiceWithCategory[]>([]);
  const [categoriesAll, setCategoriesAll] = useState<ServiceCategoryWithCount[]>([]);
  const [categoriesOffered, setCategoriesOffered] = useState<ServiceCategoryWithCount[]>([]);

  // Fetch services data
  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true);
        const [all, active, allCategories, activeCategories] = await Promise.all([
          fetchAllServices(),
          fetchActiveServices(),
          fetchServicesByCategory(),
          fetchActiveServicesByCategory()
        ]);
        
        setAllServices(all);
        setOfferedServices(active);
        setCategoriesAll(allCategories);
        setCategoriesOffered(activeCategories);
      } catch (error) {
        console.error('Error loading services:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, []);

  const toggleServiceSelection = (_serviceId: string) => {
    // no selection; noop
  };

  const viewInChat = (serviceId: string) => {
    if (openChatWithTopic)
      openChatWithTopic('portfolio', serviceId, undefined, allServices);
    else openChat();
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
