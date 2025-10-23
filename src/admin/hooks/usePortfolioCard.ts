import { useState } from 'react';
import {
  getPortfolioServices,
  getServicesOffered,
  getServicesByCategory,
} from '@data/services';
// Selection removed
import { useAdmin } from '@admin/hooks/AdminContext';

export const usePortfolioCard = () => {
  const { openChat, openChatWithTopic } = useAdmin();
  // No artificial timers: compute data synchronously; rely on route Suspense for bundle load
  const [isLoading] = useState(false);
  const [openAllCategoryId, setOpenAllCategoryId] = useState<string | null>(
    null
  );
  const [openOfferedCategoryId, setOpenOfferedCategoryId] = useState<
    string | null
  >(null);
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);

  // No delayed UI: portfolio uses local data for now, so we render immediately

  const allServices = getPortfolioServices();
  const offeredServices = getServicesOffered();
  const categoriesAll = getServicesByCategory(allServices);
  const categoriesOffered = getServicesByCategory(offeredServices);

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
