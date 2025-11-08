import React, { useState } from 'react';
import { Badge, Button, Text, AuditInfoModal } from '@shared/components';
import { getServiceStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatStatus } from '@shared/utils/statusFormatter';
import { formatDateWithTimeDesktop } from '@shared/utils/dateFormatter';
import { formatUserName } from '@shared/utils/userFormatter';
import { MessageSquare, MoreHorizontal } from 'lucide-react';
import type { PrintingService } from '@shared/types/service';

interface Service extends PrintingService {
  service_id: string;
  display_id: string;
  service_name: string;
  total_order_count?: number;
}

interface ServiceItemProps {
  service: Service;
  onHover: (serviceId: string | null) => void;
  onViewInChat: (serviceId: string) => void;
}

export const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onHover,
  onViewInChat,
}) => {
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

  // Format dates for display
  const createdDate = service.created_at
    ? formatDateWithTimeDesktop(service.created_at)
    : '';
  const updatedDate = service.updated_at
    ? formatDateWithTimeDesktop(service.updated_at)
    : '';

  // Format user names for display
  const createdBy = service.created_by_user
    ? formatUserName(service.created_by_user)
    : service.created_by
      ? 'Unknown User'
      : null;
  const updatedBy = service.updated_by_user
    ? formatUserName(service.updated_by_user)
    : service.updated_by
      ? 'Unknown User'
      : null;

  return (
    <div
      className="relative flex flex-col device-spacing-component border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
      onMouseEnter={() => onHover(service.service_id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            {/* Desktop/Tablet: inline label with bullet */}
            <Text
              variant="p"
              size="sm"
              color="muted"
              className="truncate hidden sm:block"
            >
              {service.display_id}
              {typeof service.total_order_count === 'number' && (
                <>{` \u2022 Lifetime Completed: ${service.total_order_count}`}</>
              )}
            </Text>
            {/* Mobile: two-line, no bullet */}
            <div className="sm:hidden space-y-0.5">
              <Text variant="p" size="sm" color="muted" className="truncate">
                {service.display_id}
              </Text>
              {typeof service.total_order_count === 'number' && (
                <Text variant="p" size="sm" color="muted">
                  {`Lifetime Completed: ${service.total_order_count}`}
                </Text>
              )}
            </div>
            <Text
              variant="p"
              size="lg"
              weight="medium"
              className="truncate text-gray-900 mt-1"
            >
              {service.service_name}
            </Text>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={getServiceStatusBadgeVariant(service.status)}
                className="device-badge-sm"
              >
                {formatStatus(service.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="text-right flex-shrink-0 flex flex-col gap-1.5 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="min-h-[44px] min-w-[44px] touch-target"
            title="View audit information"
            onClick={() => setIsAuditModalOpen(true)}
          >
            <MoreHorizontal className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            threeD
            className="min-h-[44px] min-w-[44px] touch-target"
            title="Chat about this service"
            onClick={() => onViewInChat(service.service_id)}
          >
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>

      <AuditInfoModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        title={`${service.service_name}`}
        description={service.description || undefined}
        auditInfo={{
          created_at: createdDate,
          created_by: createdBy || undefined,
          updated_at: updatedDate,
          updated_by: updatedBy || undefined,
        }}
      />
    </div>
  );
};

export default ServiceItem;
