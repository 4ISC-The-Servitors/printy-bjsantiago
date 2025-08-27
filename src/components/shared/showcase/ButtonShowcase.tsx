import React from 'react';
import { Button } from '../index';
import { Text } from '../index';

const ButtonShowcase: React.FC = () => {
  return (
    <section className="space-y-6">
      <Text variant="h2" size="2xl" weight="semibold">
        Buttons
      </Text>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="primary">Primary Button</Button>
        <Button variant="secondary">Secondary Button</Button>
        <Button variant="accent">Accent Button</Button>
        <Button variant="ghost">Ghost Button</Button>
      </div>

      <Text variant="h3" size="xl" weight="semibold">
        3D Buttons
      </Text>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="primary" threeD>
          Primary 3D
        </Button>
        <Button variant="secondary" threeD>
          Secondary 3D
        </Button>
        <Button variant="accent" threeD>
          Accent 3D
        </Button>
        <Button variant="ghost" threeD className="active:scale-98">
          Ghost 3D
        </Button>
      </div>

      <Text variant="h3" size="xl" weight="semibold">
        Button Sizes
      </Text>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
        <Button size="xs" threeD>
          Extra Small
        </Button>
        <Button size="sm" threeD>
          Small
        </Button>
        <Button size="md" threeD>
          Medium
        </Button>
        <Button size="lg" threeD>
          Large
        </Button>
        <Button size="xl" threeD>
          Extra Large
        </Button>
      </div>

      <Text variant="h3" size="lg" weight="medium" color="muted">
        Responsive Usage Examples
      </Text>
      <div className="space-y-4">
        <div className="p-4 bg-neutral-50 rounded-lg">
          <Text variant="p" size="sm" weight="medium" className="mb-3">
            Mobile-First Approach
          </Text>
          <div className="flex flex-wrap gap-2">
            <Button size="xs" variant="secondary" className="sm:hidden">
              Mobile XS
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="hidden sm:inline-flex md:hidden"
            >
              Tablet SM
            </Button>
            <Button
              size="md"
              variant="secondary"
              className="hidden md:inline-flex lg:hidden"
            >
              Desktop MD
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="hidden lg:inline-flex xl:hidden"
            >
              Large LG
            </Button>
            <Button
              size="xl"
              variant="secondary"
              className="hidden xl:inline-flex"
            >
              Wide XL
            </Button>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-lg">
          <Text variant="p" size="sm" weight="medium" className="mb-3">
            Action Hierarchy
          </Text>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" variant="primary" threeD>
              Primary Action
            </Button>
            <Button size="md" variant="secondary" threeD>
              Secondary
            </Button>
            <Button size="sm" variant="ghost">
              Tertiary
            </Button>
            <Button size="xs" variant="ghost">
              Helper
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button loading threeD>
          Loading 3D
        </Button>
        <Button disabled threeD>
          Disabled 3D
        </Button>
      </div>
    </section>
  );
};

export default ButtonShowcase;
