import React from 'react';
import { Badge, Button, Checkbox, Text } from '../../shared';
import { getServiceStatusBadgeVariant } from '../../../utils/admin/statusColors';
import { formatStatus } from '../../../utils/shared/statusFormatter';
import { MessageSquare } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { useIsMobile } from '../../../hooks/ui/useIsMobile';
import { MobileCardMenu } from '../mobile';

interface Service {
  id: string;
  code: string;
  name: string;
  status: string;
}

interface ServiceItemProps {
  service: Service;
  isSelected: boolean;
  isHovered: boolean;
  showCheckbox: boolean;
  openMenuId: string | null;
  onHover: (serviceId: string | null) => void;
  onToggleSelection: (serviceId: string) => void;
  onViewInChat: (serviceId: string) => void;
  onToggleMenu: (serviceId: string | null) => void;
}

export const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  isSelected,
  isHovered,
  showCheckbox,
  openMenuId,
  onHover,
  onToggleSelection,
  onViewInChat,
  onToggleMenu,
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className="relative flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors min-h-[80px]"
      onMouseEnter={() => onHover(service.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Hover checkbox on left */}
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelection(service.id)}
          className={cn(
            'transition-opacity bg-white border-2 border-gray-300 w-5 h-5 rounded data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500',
            isHovered || showCheckbox ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      <div className="flex items-center gap-4 min-w-0 flex-1 pl-6">
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

      {/* Desktop: Button, Mobile: Menu */}
      <div className="text-right flex-shrink-0 ml-4">
        {isMobile ? (
          <MobileCardMenu
            isOpen={openMenuId === service.id}
            onToggle={() =>
              onToggleMenu(openMenuId === service.id ? null : service.id)
            }
            actions={[
              {
                label: 'View in Chat',
                onClick: () => onViewInChat(service.id),
              },
              {
                label: isSelected ? 'Unselect' : 'Select',
                onClick: () => onToggleSelection(service.id),
              },
            ]}
          />
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default ServiceItem;
