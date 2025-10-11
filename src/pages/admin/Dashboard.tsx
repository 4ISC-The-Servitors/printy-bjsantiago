import React from 'react';
import { Text, Card } from '../../components/shared';

const AdminDashboard: React.FC = () => {
  return (
    <div>
      <div className="mb-6">
        <Text
          variant="h1"
          size="3xl"
          weight="bold"
          className="text-neutral-900"
        >
          Dashboard
        </Text>
        <Text variant="p" size="base" color="muted" className="mt-1">
          Overview of your admin metrics
        </Text>
      </div>

      <Card className="p-8">
        <Text variant="p" color="muted">
          Dashboard content coming soon...
        </Text>
      </Card>
    </div>
  );
};

export default AdminDashboard;
