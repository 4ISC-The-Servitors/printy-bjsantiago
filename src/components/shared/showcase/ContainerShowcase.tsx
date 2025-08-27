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
        <Container size="3xl" className="bg-neutral-100 p-4 rounded">
          <Text>3XL Container (max-width: 1536px)</Text>
        </Container>
        <Container size="full" className="bg-neutral-100 p-4 rounded">
          <Text>Full Width Container (no max-width constraint)</Text>
        </Container>
      </div>

      <Text variant="h3" size="xl" weight="semibold">
        Responsive Container Usage
      </Text>
      <div className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <Text variant="p" size="sm" weight="medium" className="mb-3">
            Recommended Usage by Screen Size
          </Text>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700"
              >
                Mobile (&lt; 640px)
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use: xs, sm for tight layouts
              </Text>
            </div>
            <div>
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700"
              >
                Tablet (640px - 1024px)
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use: sm, md, lg for forms & content
              </Text>
            </div>
            <div>
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700"
              >
                Desktop (1024px - 1280px)
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use: lg, xl, 2xl for main content
              </Text>
            </div>
            <div>
              <Text
                variant="p"
                size="xs"
                weight="semibold"
                className="text-blue-700"
              >
                Wide Screens (&gt; 1280px)
              </Text>
              <Text variant="p" size="xs" color="muted">
                Use: 2xl, 3xl, full for dashboards
              </Text>
            </div>
          </div>
        </div>
      </div>

      <Text variant="h3" size="xl" weight="semibold">
        3D Containers (All Sizes)
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
        <Container size="3xl" threeD className="p-4">
          <Text>3XL 3D Container</Text>
        </Container>
        <Container size="full" threeD className="p-4">
          <Text>Full 3D Container</Text>
        </Container>
      </div>
    </section>
  );
};

export default ContainerShowcase;
