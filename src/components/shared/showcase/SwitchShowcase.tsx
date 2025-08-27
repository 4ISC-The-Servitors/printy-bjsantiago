import React, { useState } from 'react';
import { Switch, Text, Card } from '../index';

const SwitchShowcase: React.FC = () => {
  const [sm, setSm] = useState(true);
  const [md, setMd] = useState(false);
  const [lg, setLg] = useState(true);

  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Switches
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">Small</Text>
          <div className="flex items-center justify-between">
            <Text variant="p" className="mr-4">Email Notifications</Text>
            <Switch size="sm" checked={sm} onCheckedChange={setSm} label="Email Notifications" />
          </div>
        </Card>

        <Card className="p-6">
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">Medium</Text>
          <div className="flex items-center justify-between">
            <Text variant="p" className="mr-4">Order Updates</Text>
            <Switch size="md" checked={md} onCheckedChange={setMd} label="Order Updates" />
          </div>
        </Card>

        <Card className="p-6">
          <Text variant="h3" size="lg" weight="semibold" className="mb-2">Large</Text>
          <div className="flex items-center justify-between">
            <Text variant="p" className="mr-4">Security Alerts</Text>
            <Switch size="lg" checked={lg} onCheckedChange={setLg} label="Security Alerts" />
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <Text variant="h3" size="lg" weight="semibold" className="mb-2">Disabled</Text>
        <div className="flex items-center justify-between">
          <Text variant="p" className="mr-4">Promotions & Offers</Text>
          <Switch size="md" checked={false} disabled label="Promotions & Offers" />
        </div>
      </Card>
    </section>
  );
};

export default SwitchShowcase;


