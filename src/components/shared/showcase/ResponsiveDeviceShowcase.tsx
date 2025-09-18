// ignore but dont delete! just for UI testing purposes only

import React, { useState } from 'react';
import {
  Button,
  Card,
  Container,
  Text,
  Badge,
  Switch,
  Skeleton,
  Modal,
  ToastContainer,
} from '../index';
import { useToast } from '../../../lib/useToast';

const ResponsiveDeviceShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLargeModalOpen, setIsLargeModalOpen] = useState(false);
  const [switchSm, setSwitchSm] = useState(true);
  const [switchMd, setSwitchMd] = useState(false);
  const [switchLg, setSwitchLg] = useState(true);
  const [toasts, toastMethods] = useToast();
  return (
    <section className="space-y-8">
      <Text variant="h2" size="2xl" weight="semibold">
        Device-Responsive Design System
      </Text>

      <Text variant="p" color="muted" className="max-w-3xl">
        Our responsive system is organized around four device categories:
        Mobile, Tablet, Laptop, and Desktop. Each category has predefined size
        combinations for consistent experiences across devices.
      </Text>

      {/* Device Categories Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 device-mobile">
          <Text
            variant="h3"
            size="lg"
            weight="semibold"
            className="mb-2 text-blue-600"
          >
            📱 Mobile
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-3">
            xs - sm (475px - 640px)
          </Text>
          <div className="space-y-2">
            <Text variant="p" size="xs">
              • Compact layouts
            </Text>
            <Text variant="p" size="xs">
              • Single column
            </Text>
            <Text variant="p" size="xs">
              • Touch-optimized
            </Text>
            <Text variant="p" size="xs">
              • Smaller text & buttons
            </Text>
          </div>
        </Card>

        <Card className="p-6 device-tablet">
          <Text
            variant="h3"
            size="lg"
            weight="semibold"
            className="mb-2 text-green-600"
          >
            📱 Tablet
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-3">
            sm - md (640px - 768px)
          </Text>
          <div className="space-y-2">
            <Text variant="p" size="xs">
              • Adaptive layouts
            </Text>
            <Text variant="p" size="xs">
              • 2-column grids
            </Text>
            <Text variant="p" size="xs">
              • Medium sizing
            </Text>
            <Text variant="p" size="xs">
              • Balanced spacing
            </Text>
          </div>
        </Card>

        <Card className="p-6 device-laptop">
          <Text
            variant="h3"
            size="lg"
            weight="semibold"
            className="mb-2 text-purple-600"
          >
            💻 Laptop
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-3">
            md - lg (768px - 1024px)
          </Text>
          <div className="space-y-2">
            <Text variant="p" size="xs">
              • Multi-column
            </Text>
            <Text variant="p" size="xs">
              • Sidebar layouts
            </Text>
            <Text variant="p" size="xs">
              • Standard sizing
            </Text>
            <Text variant="p" size="xs">
              • Hover interactions
            </Text>
          </div>
        </Card>

        <Card className="p-6 device-desktop">
          <Text
            variant="h3"
            size="lg"
            weight="semibold"
            className="mb-2 text-orange-600"
          >
            🖥️ Desktop
          </Text>
          <Text variant="p" size="sm" color="muted" className="mb-3">
            lg+ (1024px+)
          </Text>
          <div className="space-y-2">
            <Text variant="p" size="xs">
              • Complex layouts
            </Text>
            <Text variant="p" size="xs">
              • Multi-panel views
            </Text>
            <Text variant="p" size="xs">
              • Larger elements
            </Text>
            <Text variant="p" size="xs">
              • Rich interactions
            </Text>
          </div>
        </Card>
      </div>

      {/* Typography Scaling */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Typography Device Scaling
        </Text>
        <div className="space-y-4">
          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-2">
              Display / Hero Headlines
            </Text>
            <div className="space-y-2">
              <Text variant="h1" className="device-text-display">
                Display Headline
              </Text>
              <Text variant="h1" className="device-text-hero">
                Hero Headline
              </Text>
            </div>
          </div>
          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-2">
              Primary Heading
            </Text>
            <Text variant="h1" className="device-text-heading">
              Responsive Heading Text
            </Text>
          </div>

          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-2">
              Body Text
            </Text>
            <Text variant="p" className="device-text-body">
              This paragraph demonstrates how body text scales across different
              device sizes. The text becomes more readable as screen size
              increases.
            </Text>
          </div>

          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-2">
              Caption Text
            </Text>
            <Text variant="p" className="device-text-caption" color="muted">
              Caption text for secondary information and metadata
            </Text>
          </div>
        </div>
      </Card>

      {/* Button Scaling */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Button Device Scaling
        </Text>
        <div className="space-y-6">
          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-3">
              Primary Actions
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" className="device-btn-primary" threeD>
                Primary Action
              </Button>
              <Button variant="secondary" className="device-btn-secondary">
                Secondary Action
              </Button>
              <Button variant="ghost" className="device-btn-tertiary">
                Tertiary Action
              </Button>
            </div>
          </div>

          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-3">
              Input Actions
            </Text>
            <div className="flex flex-wrap gap-3">
              <Button variant="accent" className="device-btn-input">
                Submit Form
              </Button>
              <Button variant="secondary" className="device-btn-input">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Layout Patterns */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Layout Device Patterns
        </Text>

        <div className="space-y-6">
          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-3">
              Card Grid
            </Text>
            <div className="device-grid">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="p-4 device-card-item">
                  <Text variant="p" size="sm">
                    Card {i + 1}
                  </Text>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-3">
              Content Container
            </Text>
            <Container className="device-container bg-neutral-50 p-6 rounded">
              <Text variant="p" className="device-text-body">
                This container demonstrates how content width adapts to device
                size, ensuring optimal reading experience across all screen
                sizes.
              </Text>
            </Container>
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Badges
        </Text>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="primary">Primary</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="error">Error</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </Card>

      {/* Switches */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Switches
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Text variant="p" className="mr-4">
                Email Notifications
              </Text>
              <Switch
                size="sm"
                checked={switchSm}
                onCheckedChange={setSwitchSm}
                label="Email Notifications"
              />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Text variant="p" className="mr-4">
                Order Updates
              </Text>
              <Switch
                size="md"
                checked={switchMd}
                onCheckedChange={setSwitchMd}
                label="Order Updates"
              />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Text variant="p" className="mr-4">
                Security Alerts
              </Text>
              <Switch
                size="lg"
                checked={switchLg}
                onCheckedChange={setSwitchLg}
                label="Security Alerts"
              />
            </div>
          </Card>
        </div>
      </Card>

      {/* Skeletons */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Loading States (Skeleton)
        </Text>
        <div className="space-y-3">
          <div className="space-y-2">
            <Skeleton variant="text" width="100%" />
            <Skeleton variant="text" width="80%" />
            <Skeleton variant="text" width="60%" />
          </div>
          <div className="flex gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="rectangular" width={200} height={40} />
          </div>
        </div>
      </Card>

      {/* Toasts */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Toast Notifications
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
          <Button
            variant="secondary"
            size="sm"
            className="device-btn-secondary"
            onClick={() =>
              toastMethods.show({
                title: 'Default Toast',
                message: 'This is a default toast message',
                variant: 'default',
                size: 'md',
                duration: 4000,
              })
            }
          >
            Default
          </Button>
          <Button
            variant="success"
            size="sm"
            className="device-btn-secondary"
            onClick={() =>
              toastMethods.success(
                'Success!',
                'Your action was completed successfully'
              )
            }
          >
            Success
          </Button>
          <Button
            variant="error"
            size="sm"
            className="device-btn-secondary"
            onClick={() =>
              toastMethods.error(
                'Error Occurred',
                'Something went wrong. Please try again.'
              )
            }
          >
            Error
          </Button>
          <Button
            variant="warning"
            size="sm"
            className="device-btn-secondary"
            onClick={() =>
              toastMethods.show({
                title: 'Warning',
                message: 'Please review your input before proceeding',
                variant: 'warning',
                size: 'md',
                duration: 5000,
              })
            }
          >
            Warning
          </Button>
          <Button
            variant="info"
            size="sm"
            className="device-btn-secondary"
            onClick={() =>
              toastMethods.info(
                'Information',
                'Here is some helpful information for you'
              )
            }
          >
            Info
          </Button>
        </div>
        <ToastContainer
          toasts={toasts}
          onRemoveToast={toastMethods.remove}
          position="top-right"
        />
      </Card>

      {/* Modals */}
      <Card className="p-6">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Modals
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="primary"
            threeD
            className="device-btn-primary"
            onClick={() => setIsModalOpen(true)}
          >
            Open Basic Modal
          </Button>
          <Button
            variant="error"
            threeD
            className="device-btn-primary"
            onClick={() => setIsConfirmOpen(true)}
          >
            Open Confirm Modal
          </Button>
          <Button
            variant="secondary"
            threeD
            className="device-btn-primary"
            onClick={() => setIsLargeModalOpen(true)}
          >
            Open Large Modal
          </Button>
        </div>

        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Card>
            <div className="p-6 pb-4">
              <Text variant="h3" size="xl" weight="semibold">
                Basic Modal Example
              </Text>
            </div>
            <div className="px-6 pb-4">
              <Text variant="p">
                This is a basic modal demonstrating the compound component
                pattern.
              </Text>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 pt-4">
              <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                Close
              </Button>
              <Button
                variant="primary"
                threeD
                onClick={() => setIsModalOpen(false)}
              >
                Save
              </Button>
            </div>
          </Card>
        </Modal>

        <Modal
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          size="sm"
        >
          <Card>
            <div className="p-6 pb-4">
              <Text variant="h3" size="lg" weight="semibold">
                Confirm Action
              </Text>
            </div>
            <div className="px-6 pb-4">
              <Text variant="p">
                Are you sure you want to perform this action?
              </Text>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 pt-4">
              <Button variant="ghost" onClick={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="error"
                threeD
                onClick={() => setIsConfirmOpen(false)}
              >
                Confirm
              </Button>
            </div>
          </Card>
        </Modal>

        <Modal
          isOpen={isLargeModalOpen}
          onClose={() => setIsLargeModalOpen(false)}
          size="lg"
        >
          <Card>
            <div className="p-6 pb-4">
              <Text variant="h3" size="xl" weight="semibold">
                Large Modal Example
              </Text>
            </div>
            <div className="px-6 pb-4">
              <Text variant="p">
                This modal can accommodate more complex content, forms, or
                detailed information displays.
              </Text>
            </div>
            <div className="flex items-center justify-end gap-3 p-6 pt-4">
              <Button
                variant="ghost"
                onClick={() => setIsLargeModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                threeD
                onClick={() => setIsLargeModalOpen(false)}
              >
                Apply
              </Button>
            </div>
          </Card>
        </Modal>
      </Card>

      {/* Usage Guidelines */}
      <Card className="p-6 bg-blue-50">
        <Text variant="h3" size="xl" weight="semibold" className="mb-4">
          Usage Guidelines
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-3">
              Recommended Classes
            </Text>
            <div className="space-y-2 text-sm font-mono bg-white p-4 rounded">
              <div>device-text-heading</div>
              <div>device-text-body</div>
              <div>device-text-caption</div>
              <div>device-btn-primary</div>
              <div>device-btn-secondary</div>
              <div>device-btn-input</div>
              <div>device-grid</div>
              <div>device-container</div>
            </div>
          </div>

          <div>
            <Text variant="h4" size="lg" weight="medium" className="mb-3">
              Device Targeting
            </Text>
            <div className="space-y-2 text-sm font-mono bg-white p-4 rounded">
              <div>device-mobile (xs-sm)</div>
              <div>device-tablet (sm-md)</div>
              <div>device-laptop (md-lg)</div>
              <div>device-desktop (lg+)</div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default ResponsiveDeviceShowcase;
