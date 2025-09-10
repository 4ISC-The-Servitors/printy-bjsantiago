import React from 'react';
import { Text, Container } from '../../components/shared';
import { OrdersCard, TicketsCard } from '../../components/admin/dashboard';
import { getTelemetry } from '../../lib/telemetry';

// Data now imported from src/data

const AdminDashboard: React.FC = () => {
  return (
    <Container size="xl" className="py-6 md:py-10">
      {/* Orders and Tickets */}
      <div className="flex flex-wrap gap-6">
        <div
          className="flex-1 min-w-[320px] space-y-3"
          style={{ order: (getTelemetry().widgets['orders'] || 0) * -1 }}
        >
          <Text variant="h2" size="xl" weight="semibold" className="px-1">
            Recent Orders
          </Text>
          <OrdersCard />
        </div>

        <div
          className="flex-1 min-w-[320px] space-y-3"
          style={{ order: (getTelemetry().widgets['tickets'] || 0) * -1 }}
        >
          <Text variant="h2" size="xl" weight="semibold" className="px-1">
            Recent Tickets
          </Text>
          <TicketsCard />
        </div>
      </div>
    </Container>
  );
};

export default AdminDashboard;
