import React from 'react';
import { Text, Card } from '../../components/shared';

const AdminDashboard: React.FC = () => {
  return (
    <Card className="p-8">
      <Text
        variant="h2"
        size="xl"
        weight="semibold"
        className="text-neutral-800"
      >
        Admin Dashboard
      </Text>
      <Text className="mt-2 text-neutral-600">Coming soon.</Text>
    </Card>
  );
};

export default AdminDashboard;
