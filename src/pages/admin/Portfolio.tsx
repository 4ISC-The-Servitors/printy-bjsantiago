import React, { useMemo, useState } from 'react';
import { Text, Container, Button } from '../../components/shared';
import { ServicePortfolioCard } from '../../components/admin/portfolio';
import { mockServices } from '../../data/services';
import { MessageSquare } from 'lucide-react';

const AdminPortfolio: React.FC = () => {
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, typeof mockServices>();
    mockServices.forEach(s => {
      const arr = map.get(s.category) || [];
      arr.push(s);
      map.set(s.category, arr);
    });
    return Array.from(map.entries());
  }, []);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const obj: Record<string, boolean> = {};
    servicesByCategory.forEach(([cat]) => (obj[cat] = false)); // Closed by default
    return obj;
  });

  return (
    <Container size="xl" className="py-6 md:py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Text variant="h1" size="2xl" weight="bold" className="mb-2">
            Service Portfolio
          </Text>
          <Text variant="p" className="text-neutral-600">
            Manage your service offerings and portfolio
          </Text>
        </div>
        {/* Chat icon button */}
        <Button variant="secondary" size="sm" threeD aria-label="Ask Printy">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </div>

      {/* Service Portfolio and Services Offered */}
      <div className="space-y-6">
        <ServicePortfolioCard expanded={expanded} setExpanded={setExpanded} />
      </div>
    </Container>
  );
};

export default AdminPortfolio;
