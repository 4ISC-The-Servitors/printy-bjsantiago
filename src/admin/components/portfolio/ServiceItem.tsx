import React from 'react';
import { Badge, Button, Text } from '@admin/components/shared';
import { getServiceStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatStatus } from '@shared/utils/statusFormatter';
import { MessageSquare } from 'lucide-react';

interface Service {
  service_id: string;
  display_id: string;
  service_name: string;
  status: string;
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
  return (
    <div
      className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
      onMouseEnter={() => onHover(service.service_id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          {/* Desktop/Tablet: inline label with bullet */}
          <Text variant="p" size="sm" color="muted" className="truncate hidden sm:block">
            {service.display_id}
            {typeof service.total_order_count === 'number' && (
              <>
                {` \u2022 Lifetime Completed: ${service.total_order_count}`}
              </>
            )}
          </Text>
          {/* Mobile: two-line, no bullet */}
          <div className="sm:hidden">
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
            className="truncate text-gray-900"
          >
            {service.service_name}
          </Text>
          <div className="flex items-center gap-2 mt-2">
            <Badge
              variant={getServiceStatusBadgeVariant(service.status)}
              className="text-sm px-3 py-1"
            >
              {formatStatus(service.status)}
            </Badge>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="text-right flex-shrink-0 ml-4">
        <Button
          variant="secondary"
          size="sm"
          threeD
          className="min-h-[44px] min-w-[44px]"
          title="Chat about this service"
          onClick={() => onViewInChat(service.service_id)}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceItem;
