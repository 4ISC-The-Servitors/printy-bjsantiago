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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
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

  const addSelectedToChat = () => {
    const selectedIds = serviceSelection.selectedIds;
    if (selectedIds.length === 0) return;
    const servicesArr = allServices;
    // Update chips bar for UI context
    selectedIds.forEach(id => {
      const svc = servicesArr.find(s => s.id === id);
      const label = svc ? `${svc.name} (${svc.code})` : id;
      addSelected({ id, label, type: 'service' });
    });
    if (selectedIds.length > 1) {
      openChatWithTopic?.(
        'multiple-portfolio',
        undefined,
        undefined,
        servicesArr,
        undefined,
        selectedIds
      );
    } else {
      openChatWithTopic?.('portfolio', selectedIds[0], undefined, servicesArr);
    }
    if (!openChatWithTopic) openChat();
    serviceSelection.clear();
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
    openMenuId,
    setOpenMenuId,
    isSelected: serviceSelection.isSelected,
    selectionCount: serviceSelection.selectionCount,
    hasSelections: serviceSelection.hasSelections,
    toggleServiceSelection,
    viewInChat,
    addSelectedToChat,
    handleAddService,
    toggleAllCategory,
    toggleOfferedCategory,
  };
};
