import React from 'react';
import { Badge, Button, Text } from '@admin/components/shared';
import { getServiceStatusBadgeVariant } from '@shared/utils/statusColors';
import { formatStatus } from '@shared/utils/statusFormatter';
import { MessageSquare } from 'lucide-react';

interface Service {
  id: string;
  code: string;
  name: string;
  status: string;
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
      onMouseEnter={() => onHover(service.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div className="min-w-0 flex-1">
          <Text
            variant="p"
            size="sm"
            color="muted"
            className="truncate"
          >
            {service.code}
          </Text>
          <Text
            variant="p"
            size="lg"
            weight="medium"
            className="truncate text-gray-900"
          >
            {service.name}
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
          onClick={() => onViewInChat(service.id)}
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ServiceItem;
