import React, { useState } from 'react';
import { Card, Badge, Button, Text, AuditInfoModal } from '@shared/components';
import { Plus, ChevronDown, MoreHorizontal } from 'lucide-react';
import { ServiceItem } from './ServiceItem';
import { PortfolioSkeleton } from './PortfolioSkeleton';
import { usePortfolioCard } from '@admin/hooks/usePortfolioCard';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';
import { formatUserName } from '@shared/utils/userFormatter';
import type { ServiceCategoryWithCount } from '@shared/types/service';
import { StaticInfoSectionsCard } from './AboutFAQsCard';

const PortfolioCard: React.FC = () => {
  const {
    isLoading,
    allServices,
    offeredServices,
    categoriesAll,
    categoriesOffered,
    openAllCategoryId,
    openOfferedCategoryId,
    setHoveredServiceId,
    viewInChat,
    handleAddService,
    toggleAllCategory,
    toggleOfferedCategory,
  } = usePortfolioCard();
  const [isPortfolioOpen, setIsPortfolioOpen] = useState(false);
  const [isOfferedOpen, setIsOfferedOpen] = useState(false);

  if (isLoading) return <PortfolioSkeleton />;

  return (
    <div className="relative space-y-6">
      {/* Service Portfolio (All) */}
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 gap-2">
          <button
            type="button"
            onClick={() => setIsPortfolioOpen(prev => !prev)}
            aria-expanded={isPortfolioOpen}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md flex-1"
          >
            <Text variant="h3" size="lg" weight="semibold" className="flex items-center gap-3">
              Service Portfolio
              <Badge size="sm" variant="secondary">
                {allServices.length}
              </Badge>
            </Text>
          </button>
          <div className="flex items-center gap-2">
            {isPortfolioOpen && (
              <Button
                variant="primary"
                size="sm"
                threeD
                onClick={handleAddService}
                aria-label="Add Service"
                className="inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </Button>
            )}
            <button
              type="button"
              onClick={() => setIsPortfolioOpen(prev => !prev)}
              aria-label={isPortfolioOpen ? 'Collapse Service Portfolio' : 'Expand Service Portfolio'}
              className="min-h-[44px] min-w-[44px] touch-target rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center"
            >
              <ChevronDown
                className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform ${isPortfolioOpen ? 'rotate-180' : ''}`}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
        {isPortfolioOpen && (
          <div className="p-8 space-y-6">
            {categoriesAll.map(cat => (
              <CategoryItem
                key={cat.category_id}
                category={cat}
                isOpen={openAllCategoryId === cat.category_id}
                onToggle={() => toggleAllCategory(cat.category_id)}
                onHover={setHoveredServiceId}
                onViewInChat={viewInChat}
              />
            ))}
          </div>
        )}
      </Card>

      {/* Services Offered (Active only) */}
      <Card className="p-0">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4 gap-2">
          <button
            type="button"
            onClick={() => setIsOfferedOpen(prev => !prev)}
            aria-expanded={isOfferedOpen}
            className="flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 rounded-md flex-1"
          >
            <Text variant="h3" size="lg" weight="semibold" className="flex items-center gap-3">
              Services Offered
              <Badge size="sm" variant="secondary">
                {offeredServices.length}
              </Badge>
            </Text>
          </button>
          <button
            type="button"
            onClick={() => setIsOfferedOpen(prev => !prev)}
            aria-label={isOfferedOpen ? 'Collapse Services Offered' : 'Expand Services Offered'}
            className="min-h-[44px] min-w-[44px] touch-target rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 flex items-center justify-center flex-shrink-0"
          >
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isOfferedOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>
        </div>
        {isOfferedOpen && (
          <div className="p-8 space-y-6">
            {categoriesOffered.map(cat => (
              <CategoryItem
                key={cat.category_id}
                category={cat}
                isOpen={openOfferedCategoryId === cat.category_id}
                onToggle={() => toggleOfferedCategory(cat.category_id)}
                onHover={setHoveredServiceId}
                onViewInChat={viewInChat}
              />
            ))}
          </div>
        )}
      </Card>

      <StaticInfoSectionsCard onViewInChat={viewInChat} />
    </div>
  );
};

// Category Item Component
interface CategoryItemProps {
  category: ServiceCategoryWithCount;
  isOpen: boolean;
  onToggle: () => void;
  onHover: (serviceId: string | null) => void;
  onViewInChat: (serviceId: string) => void;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  category,
  isOpen,
  onToggle,
  onHover,
  onViewInChat,
}) => {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Type assertion to access audit fields that exist at runtime
  const categoryWithAudit = category as ServiceCategoryWithCount & {
    created_at?: string;
    updated_at?: string;
    created_by?: string;
    updated_by?: string;
    created_by_user?: {
      first_name: string | null;
      last_name: string | null;
    };
    updated_by_user?: {
      first_name: string | null;
      last_name: string | null;
    };
  };

  // Format dates for display
  const createdDate = categoryWithAudit.created_at
    ? formatDateWithTimeDesktop(categoryWithAudit.created_at)
    : '';
  const updatedDate = categoryWithAudit.updated_at
    ? formatDateWithTimeDesktop(categoryWithAudit.updated_at)
    : '';

  // Format user names for display
  const createdBy = categoryWithAudit.created_by_user
    ? formatUserName(categoryWithAudit.created_by_user)
    : categoryWithAudit.created_by
      ? 'Unknown User'
      : null;
  const updatedBy = categoryWithAudit.updated_by_user
    ? formatUserName(categoryWithAudit.updated_by_user)
    : categoryWithAudit.updated_by
      ? 'Unknown User'
      : null;

  const hasAuditInfo = createdDate || createdBy || updatedDate || updatedBy;

  const handleMenuClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsAuditModalOpen(true);
  };

  return (
    <>
      <div className="border border-gray-200 rounded-lg">
        <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
          <button
            type="button"
            className="flex items-baseline gap-3 mt-1 flex-1 text-left"
            onClick={onToggle}
            aria-expanded={isOpen}
          >
            <Text
              variant="p"
              size="base"
              weight="medium"
              className="text-gray-900"
            >
              {category.category_name}
            </Text>
            <Badge size="sm" variant="secondary">
              {category.service_count}
            </Badge>
          </button>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasAuditInfo && (
              <button
                type="button"
                onClick={handleMenuClick}
                className="min-h-[44px] min-w-[44px] touch-target btn btn-ghost device-btn-secondary p-0 hover:bg-neutral-100 flex items-center justify-center"
                title="View audit information"
              >
                <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            )}
            <ChevronDown
              className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </div>
        </div>
        {isOpen && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Services List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.services.map(s => (
                <ServiceItem
                  key={s.service_id}
                  service={s as any}
                  onHover={onHover}
                  onViewInChat={onViewInChat}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      <AuditInfoModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`${category.category_name}`}
        description={category.description || undefined}
        auditInfo={{
          created_at: createdDate,
          created_by: createdBy || undefined,
          updated_at: updatedDate,
          updated_by: updatedBy || undefined,
        }}
      />
    </>
  );
};

export default PortfolioCard;
