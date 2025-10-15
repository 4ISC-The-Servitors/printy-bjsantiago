import { useState } from 'react';
import {
  getPortfolioServices,
  getServicesOffered,
  getServicesByCategory,
} from '@data/services';
import { useServiceSelection } from '@hooks/admin/SelectionContext';
import { createServiceSelectionItems } from '@utils/admin/selectionUtils';
import { useAdmin } from '@hooks/admin/AdminContext';

export const usePortfolioCard = () => {
  const serviceSelection = useServiceSelection();
  const { openChat, openChatWithTopic, addSelected } = useAdmin();
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
  const serviceItems = createServiceSelectionItems(allServices);

  const toggleServiceSelection = (serviceId: string) => {
    const item = serviceItems.find(i => i.id === serviceId);
    if (item) serviceSelection.toggle(item);
  };

  const viewInChat = (serviceId: string) => {
    const svc = allServices.find(s => s.id === serviceId);
    const label = svc ? `${svc.name} (${svc.code})` : serviceId;
    addSelected({ id: serviceId, label, type: 'service' });
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
    setOpenOfferedCategoryId(prev =>
      prev === categoryId ? null : categoryId
    );
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
    isSelected: serviceSelection.isSelected,
    selectionCount: serviceSelection.selectionCount,
    toggleServiceSelection,
    viewInChat,
    handleAddService,
    toggleAllCategory,
    toggleOfferedCategory,
  };
};
