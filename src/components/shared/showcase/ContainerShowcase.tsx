import React from 'react';
import { Container, Text } from '../index';

const ContainerShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Layout Containers
      </Text>
      
      <div className="space-y-4">
        <Container size="xs" className="bg-neutral-100 p-4 rounded">
          <Text>Extra Small Container (max-width: 475px)</Text>
        </Container>
        <Container size="sm" className="bg-neutral-100 p-4 rounded">
          <Text>Small Container (max-width: 640px)</Text>
        </Container>
        <Container size="md" className="bg-neutral-100 p-4 rounded">
          <Text>Medium Container (max-width: 768px)</Text>
        </Container>
        <Container size="lg" className="bg-neutral-100 p-4 rounded">
          <Text>Large Container (max-width: 1024px)</Text>
        </Container>
        <Container size="xl" className="bg-neutral-100 p-4 rounded">
          <Text>Extra Large Container (max-width: 1280px)</Text>
        </Container>
        <Container size="2xl" className="bg-neutral-100 p-4 rounded">
          <Text>2XL Container (max-width: 1400px)</Text>
        </Container>
      </div>

      <Text variant="h3" size="xl" weight="semibold">
        3D Containers
      </Text>
      <div className="space-y-4">
        <Container size="xs" threeD className="p-4">
          <Text>XS 3D Container</Text>
        </Container>
        <Container size="sm" threeD className="p-4">
          <Text>SM 3D Container</Text>
        </Container>
        <Container size="md" threeD className="p-4">
          <Text>MD 3D Container</Text>
        </Container>
        <Container size="lg" threeD className="p-4">
          <Text>LG 3D Container</Text>
        </Container>
        <Container size="xl" threeD className="p-4">
          <Text>XL 3D Container</Text>
        </Container>
        <Container size="2xl" threeD className="p-4">
          <Text>2XL 3D Container</Text>
        </Container>
      </div>
    </section>
  );
};

export default ContainerShowcase;
