import React from 'react';
import { Card, Text, Badge, Button } from '../../../shared';
import { mockServices } from '../../../../data/services';
import { MessageSquare, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  expanded: Record<string, boolean>;
  setExpanded: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onServiceChat?: (service: any) => void;
  services?: any[];
}

// Add status badges to mock services for demonstration
const servicesWithStatus = mockServices.map((service, index) => ({
  ...service,
  status: index % 3 === 0 ? 'active' : index % 3 === 1 ? 'inactive' : 'retired',
}));

const ServicePortfolioCard: React.FC<Props> = ({
  expanded,
  setExpanded,
  onServiceChat,
  services,
}) => {
  // Use provided services or fallback to mock data
  const servicesToUse = services || servicesWithStatus;

  const map = new Map<string, typeof servicesToUse>();
  servicesToUse.forEach(s => {
    const arr = map.get(s.category) || [];
    arr.push(s);
    map.set(s.category, arr);
  });
  const servicesByCategory = Array.from(map.entries());

  return (
    <Card title="Service Portfolio">
      <div className="space-y-4">
        {servicesByCategory.map(([category, items]) => (
          <div key={category} className="border border-neutral-200 rounded-lg">
            <button
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-neutral-50 transition-colors"
              onClick={() =>
                setExpanded(prev => ({
                  ...prev,
                  [category]: !prev[category],
                }))
              }
            >
              <Text variant="h4" size="sm" weight="semibold">
                {category}
              </Text>
              {expanded[category] ? (
                <ChevronDown className="w-5 h-5 text-neutral-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              )}
            </button>
            {expanded[category] && (
              <div className="px-4 pb-3 space-y-2">
                {items.map(s => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Text
                        variant="p"
                        size="sm"
                        weight="medium"
                        className="truncate"
                      >
                        {s.name}
                      </Text>
                      <Badge
                        variant={
                          s.status === 'Active'
                            ? 'success'
                            : s.status === 'Inactive'
                              ? 'warning'
                              : s.status === 'Retired'
                                ? 'error'
                                : 'warning'
                        }
                        size="sm"
                      >
                        {s.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <Text
                        variant="p"
                        size="xs"
                        color="muted"
                        className="truncate"
                      >
                        {s.code}
                      </Text>
                      <Button
                        variant="secondary"
                        size="sm"
                        threeD
                        aria-label={`Ask about ${s.name}`}
                        onClick={() => onServiceChat?.(s)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default ServicePortfolioCard;
