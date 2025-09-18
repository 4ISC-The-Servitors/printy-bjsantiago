// ignore but dont delete! just for UI testing purposes only

import React from 'react';
import { Container, Text } from '../index';
import { ResponsiveDeviceShowcase } from './index';

const ComponentShowcase: React.FC = () => {
  return (
    <Container className="py-8 space-y-8">
      <ShowcaseHeader />

      {/* Device responsive system - comprehensive size demonstration */}
      <ResponsiveDeviceShowcase />

      {/* Individual showcases removed: consolidated into ResponsiveDeviceShowcase */}
    </Container>
  );
};

const ShowcaseHeader: React.FC = () => (
  <div className="text-center">
    <Text variant="h1" className="device-text-heading text-brand-primary">
      Printy Design System
    </Text>
    <Text variant="p" className="device-text-body mt-4" color="muted">
      Shared UI Components following our design principles
    </Text>
  </div>
);

export default ComponentShowcase;
