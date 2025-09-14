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
    <Card className="p-0">
      <div className="px-4 py-3 border-b border-neutral-200">
        <Text variant="h3" size="lg" weight="semibold">
          Service Portfolio
        </Text>
      </div>

      <div className="divide-y divide-neutral-200">
        {servicesByCategory.map(([category, items]) => (
          <div key={category}>
            <button
              className="flex items-center justify-between w-full px-4 py-4 text-left active:bg-neutral-50 transition-colors"
              onClick={() =>
                setExpanded(prev => ({
                  ...prev,
                  [category]: !prev[category],
                }))
              }
            >
              <Text variant="h4" size="base" weight="semibold">
                {category}
              </Text>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" size="sm">
                  {items.length}
                </Badge>
                {expanded[category] ? (
                  <ChevronDown className="w-5 h-5 text-neutral-500" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-neutral-500" />
                )}
              </div>
            </button>

            {expanded[category] && (
              <div className="bg-neutral-50">
                {items.map(s => (
                  <div
                    key={s.id}
                    className="px-4 py-3 border-t border-neutral-200 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="min-w-0 flex-1">
                        <Text
                          variant="h5"
                          size="sm"
                          weight="medium"
                          className="mb-1"
                        >
                          {s.name}
                        </Text>
                        <Text variant="p" size="xs" color="muted">
                          {s.code}
                        </Text>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        threeD
                        aria-label={`Ask about ${s.name}`}
                        className="w-10 h-10 p-0 flex-shrink-0"
                        onClick={() => onServiceChat?.(s)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-start">
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
